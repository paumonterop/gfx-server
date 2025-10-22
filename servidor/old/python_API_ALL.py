from flask import Flask, jsonify, request
import threading
import json
import time
from datetime import datetime
from geopy.distance import geodesic
import xml.etree.ElementTree as ET
from scipy.spatial import cKDTree
import numpy as np
import requests
import asyncio
import websockets
from flask_socketio import SocketIO


# ==============================
# RUTES GPX
# ==============================
route_points = []
route_kdtree = None
route_points_array = None
current_route = "race1"

gpx_files = {
    "race1": "test_motx.gpx",
    "race2": "otra_ruta.gpx",
    "race3": "ruta_final.gpx"
}

# ==============================
# CONFIGURACIO
# ==============================
HOST = "0.0.0.0"
WS_PORT = 5000
REST_PORT = 10009

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

# ==============================
# GPS DATA
# ==============================
gps_ips = [
    '10.147.17.11', '10.147.17.12', '10.147.17.13', '10.147.17.14',
    '10.147.17.15', '10.147.17.16', '10.147.17.17', '10.147.17.18',
    '10.147.17.19', '10.147.17.20', '10.147.17.30', '10.147.17.31'
]

gps_data = {
    gps_id: {
        "data": None,
        "last_seen": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "status": "offline"
    } for gps_id in gps_ips
}


def load_current_gpx():
    global route_points, route_kdtree, route_points_array
    file_path = gpx_files.get(current_route)
    if not file_path:
        print(f"Ruta '{current_route}' no encontrada")
        return

    route_points.clear()
    tree = ET.parse(file_path)
    root = tree.getroot()
    namespace = {'gpx': 'http://www.topografix.com/GPX/1/1'}
    trkpts = root.findall(".//gpx:trkpt", namespace)

    previous_point = None
    total_distance = 0.0
    coordinates = []

    for pt in trkpts:
        lat = float(pt.get('lat'))
        lon = float(pt.get('lon'))
        current_point = (lat, lon)

        if previous_point:
            total_distance += geodesic(previous_point, current_point).kilometers
        previous_point = current_point

        route_points.append((lat, lon, total_distance))
        coordinates.append((lat, lon))

    route_points_array = np.array(coordinates)
    route_kdtree = cKDTree(route_points_array)
    print(f"Ruta '{current_route}' cargada correctamente")

load_current_gpx()

# ==============================
# FUNCIONES AUXILIARES
# ==============================
def calculate_progress_optimized(gps_lat, gps_lon):
    gps_lat = gps_lat[:-2]
    gps_lon = gps_lon[:-2]

    degrees_minutes = float(gps_lat)
    degrees = int(degrees_minutes // 100)
    minutes = degrees_minutes % 100
    gps_lat = degrees + (minutes / 60)

    degrees_minutes = float(gps_lon)
    degrees = int(degrees_minutes // 100)
    minutes = degrees_minutes % 100
    gps_lon = degrees + (minutes / 60)

    if not route_kdtree or not route_points:
        return {"error": "No route loaded"}

    gps_point = np.array([gps_lat, gps_lon])
    dist, index_closest = route_kdtree.query(gps_point)
    closest_point = route_points[index_closest]

    km_recorridos = closest_point[2]
    km_totales = route_points[-1][2]
    km_restantes = km_totales - km_recorridos
    porcentaje = (km_recorridos / km_totales) * 100 if km_totales > 0 else 0

    return {
        "gps_data": {"lat_gps": gps_lat, "lon_gps": gps_lon},
        "closest_point": {
            "lat": closest_point[0],
            "lon": closest_point[1],
            "km_acumulats": closest_point[2]
        },
        "km_recorreguts": km_recorridos,
        "km_restants": km_restantes,
        "percentatge_completat": round(porcentaje, 2),
        "closest_distance_to_route": round(dist, 3)
    }

def calculate_distance_and_time_between(km1, km2, speed1, speed2):
    distance_km = abs(km1 - km2)
    if speed1 <= 0.3 or speed2 <= 0.3:
        return distance_km, "N/A"
    time1 = distance_km / speed1
    time2 = distance_km / speed2
    time_diff_seconds = int(abs(time1 - time2) * 3600)
    time_diff_str = time.strftime('%H:%M:%S', time.gmtime(time_diff_seconds))
    return distance_km, time_diff_str

# ==============================
# FUNCIONES QUE RETORNAN DATOS PUROS
# ==============================
def get_gps_data_dict():
    base = gps_data.copy()
    try:
        resp = requests.get("https://app.tracmove.io/api/race/642", timeout=5)
        resp.raise_for_status()
        tracmove_json = resp.json()
    except Exception as e:
        tracmove_json = {"error": "No se pudo obtener APItracmove", "details": str(e)}
    return {"gps_data": base, "APItracmove": tracmove_json}

def get_all_gps_info_dict():
    response = {}
    for gps_id, gps_info in gps_data.items():
        if not gps_info.get("data"):
            continue
        gps_lat = gps_info["data"].get("lat")
        gps_lon = gps_info["data"].get("lon")
        progress = calculate_progress_optimized(gps_lat, gps_lon) if gps_lat and gps_lon else None

        comparisons = []
        for other_id, other_info in gps_data.items():
            if other_id == gps_id or not other_info.get("data") or other_info["status"] != "online":
                continue
            other_lat = other_info["data"].get("lat")
            other_lon = other_info["data"].get("lon")
            other_progress = calculate_progress_optimized(other_lat, other_lon) if other_lat and other_lon else None

            if progress and other_progress:
                distance_km, time_diff = calculate_distance_and_time_between(
                    progress["closest_point"]["km_acumulats"],
                    other_progress["closest_point"]["km_acumulats"],
                    gps_info["data"].get("speed_kmh", 0),
                    other_info["data"].get("speed_kmh", 0),
                )
                comparisons.append({
                    "other_gps": other_id,
                    "distance_km": distance_km,
                    "time_difference": time_diff,
                })

        response[gps_id] = {
            "gps_info": gps_info,
            "progress": progress,
            "comparisons": comparisons
        }
    return response

# ==============================
# API REST
# ==============================
@app.route('/api/gps', methods=['GET'])
def api_gps():
    return jsonify(get_gps_data_dict())

@app.route('/api/gps_all', methods=['GET'])
def api_gps_all():
    return jsonify(get_all_gps_info_dict())

@app.route('/api/change_route', methods=['POST'])
def change_route():
    global current_route
    data = request.json
    route_name = data.get("route")
    if route_name not in gpx_files:
        return jsonify({"error": "Ruta no válida"}), 400
    current_route = route_name
    load_current_gpx()
    return jsonify({"message": f"Ruta cambiada a '{current_route}'"})

# ==============================
# WEBSOCKET SERVER
# ==============================
connected_clients = set()

async def ws_handler(websocket, path):
    print("Cliente conectado")
    connected_clients.add(websocket)
    try:
        async for message in websocket:
            try:
                data = json.loads(message)
                if data.get("type") == "status":
                    print("Cliente registrado para status")
            except Exception as e:
                print("Error procesando mensaje:", e)
    except Exception as e:
        print("Cliente desconectado", e)
    finally:
        connected_clients.remove(websocket)
        print("Cliente desconectado")

async def broadcast_loop():
    while True:
        if connected_clients:
            gps_status = get_gps_data_dict()
            gps_stats = get_all_gps_info_dict()
            msg = json.dumps({"gps_status": gps_status, "gps_statistics": gps_stats})
            await asyncio.gather(*[client.send(msg) for client in connected_clients])
        await asyncio.sleep(1)

def start_ws():
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    start_server = websockets.serve(ws_handler, HOST, WS_PORT)
    loop.run_until_complete(asyncio.gather(start_server, broadcast_loop()))
    loop.run_forever()


# ==============================
# WEBSOCKETS (recepción y broadcast)
# ==============================
clients = {}

@socketio.on('connect')
def handle_connect():
    print("Cliente conectado.")

@socketio.on('disconnect')
def handle_disconnect():
    if request.sid in clients:
        print(f"Cliente {request.sid} desconectado")
        del clients[request.sid]

@socketio.on('gps_data')
def handle_gps_data(data):
    try:
        if isinstance(data, str):
            data = json.loads(data)
        gps_id = data.get('id')
        if gps_id in gps_data:
            gps_data[gps_id]["data"] = {
                "alt": data.get("alt"),
                "fix_quality": data.get("fix_quality"),
                "hdop": data.get("hdop"),
                "lat": data.get("lat"),
                "lon": data.get("lon"),
                "num_sats": data.get("num_sats"),
                "pdop": data.get("pdop"),
                "speed_kmh": data.get("speed_kmh"),
                "speed_ms": data.get("speed_ms"),
                "time": data.get("time"),
                "vdop": data.get("vdop"),
            }
            gps_data[gps_id]["last_seen"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            gps_data[gps_id]["status"] = "online"
        else:
            print(f"ID GPS no reconocido: {gps_id}")
    except Exception as e:
        print(f"Error procesando datos: {e}")

# ==============================
# LIMPIEZA GPS OFFLINE
# ==============================
def clean_old_data():
    while True:
        current_time = time.time()
        for gps_id, info in gps_data.items():
            last_seen_time = datetime.strptime(info["last_seen"], "%Y-%m-%d %H:%M:%S").timestamp()
            if current_time - last_seen_time > 10:
                gps_data[gps_id]["status"] = "offline"
                gps_data[gps_id]["data"] = None
        time.sleep(10)

threading.Thread(target=clean_old_data, daemon=True).start()

# ==============================
# MAIN
# ==============================
if __name__ == '__main__':
    threading.Thread(target=start_ws, daemon=True).start()
    app.run(host=HOST, port=REST_PORT)  # REST API en puerto 5000
