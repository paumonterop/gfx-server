from flask import Flask, jsonify, request
from flask_socketio import SocketIO, emit
import threading, json, time, asyncio, websockets, subprocess, os, sys
from datetime import datetime
from geopy.distance import geodesic
from scipy.spatial import cKDTree
import numpy as np
import requests
from contextlib import suppress
import xml.etree.ElementTree as ET
from flask_cors import CORS
from geopy.distance import geodesic
from collections import defaultdict


# ==============================
# CONFIGURACIÓ CURSES
# ==============================
curses = {
    "TRAIL": {"cursa": "EL PUTU TRAIL", "abreviacio": "El Puto Trail", "id": "trail", "subtitle": "39km / 2300m+", "track": "el-putu-trail-del-bisaura-2025.gpx"},
    "MITJA": {"cursa": "LA MITJA I PICO", "abreviacio": "La Mitja i Pico", "id": "mitja", "subtitle": "25km / 1500m+", "track": "trail-del-bisaura-la-mitja-i-pico-2025.gpx"},
    "CURTA": {"cursa": "LA NO TANT CURTA", "abreviacio": "La No Tant Curta", "id": "curta", "subtitle": "14km / 700m+", "track": "la-no-tant-curta-trail-del-bisaura-2025.gpx"}
}


# ==============================
# RUTES GPX
# ==============================
route_points, route_kdtree, route_points_array = [], None, None
current_route = "TRAIL"

# ==============================
# CONFIGURACIÓN GENERAL
# ==============================
HOST = "0.0.0.0"
WS_PORT = 5000
REST_PORT = 10009
VMIX_HOST = "http://192.168.10.254:8088/api"

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="eventlet")
CORS(app)  # o CORS(app, origins=["http://localhost:10010"])


# ==============================
# GPS DATA
# ==============================
gps_ips = [f"10.147.17.{i}" for i in range(11, 21)] + ["10.147.17.30", "10.147.17.31"]
gps_data = {gps_id: {"data": None, "last_seen": datetime.now().strftime("%Y-%m-%d %H:%M:%S"), "status": "offline"} for gps_id in gps_ips}

ipMap = {
    "BBX 01": "10.147.17.11",
    "BBX 02": "10.147.17.12",
    "BBX 03": "10.147.17.13",
    "BBX 04": "10.147.17.14",
    "BBX 05": "10.147.17.15",
    "BBX 06": "10.147.17.16",
    "BBX 07": "10.147.17.17",
    "BBX 08": "10.147.17.18",
    "BBX 09": "10.147.17.19",
    "BBX 10": "10.147.17.20",
    "BBX 11": "10.147.17.21",
    "BBX 12": "10.147.17.22",
    "BBX 21": "10.147.17.30",
    "BBX 22": "10.147.17.31",
}

ipMap2 = {

}

# ==============================
# FUNCIONES AUXILIARES
# ==============================
def load_current_gpx():
    """Carga el GPX correspondiente a la cursa actual."""
    global route_points, route_kdtree, route_points_array
    cursa_info = curses.get(current_route)
    if not cursa_info:
        print(f"Cursa '{current_route}' no encontrada")
        return

    file_path = cursa_info["track"]
    route_points.clear()

    import xml.etree.ElementTree as ET
    tree = ET.parse(file_path)
    root = tree.getroot()
    ns = {'gpx': 'http://www.topografix.com/GPX/1/1'}
    trkpts = root.findall(".//gpx:trkpt", ns)

    prev = None
    total_dist, coords = 0.0, []
    for pt in trkpts:
        lat, lon = float(pt.get('lat')), float(pt.get('lon'))
        if prev:
            total_dist += geodesic(prev, (lat, lon)).kilometers
        prev = (lat, lon)
        route_points.append((lat, lon, total_dist))
        coords.append((lat, lon))

    route_points_array = np.array(coords)
    route_kdtree = cKDTree(route_points_array)
    print(f"Cursa '{cursa_info['cursa']}' cargada correctamente")


load_current_gpx()


def calculate_progress_optimized(lat_str, lon_str):

    if not lat_str or not lon_str:
        return {"error": "GPS coordinates missing"}
    
    if lat_str == '' or lon_str == '':
        return {"error": "GPS coordinates missing"}

    """Calcula progreso a lo largo del track."""
    lat_str, lon_str = lat_str[:-2], lon_str[:-2]
    d, m = divmod(float(lat_str), 100)
    gps_lat = int(d) + (m / 60)
    d, m = divmod(float(lon_str), 100)
    gps_lon = int(d) + (m / 60)

    if not route_kdtree or not route_points:
        return {"error": "No route loaded"}

    dist, idx = route_kdtree.query(np.array([gps_lat, gps_lon]))
    p = route_points[idx]
    km_tot = route_points[-1][2]
    km_rec = p[2]
    perc = (km_rec / km_tot) * 100 if km_tot > 0 else 0

    return {
        "gps_data": {"lat_gps": gps_lat, "lon_gps": gps_lon},
        "closest_point": {"lat": p[0], "lon": p[1], "km_acumulats": p[2]},
        "km_recorreguts": km_rec,
        "km_restants": km_tot - km_rec,
        "percentatge_completat": round(perc, 2),
        "closest_distance_to_route": round(dist, 3)
    }


def calculate_distance_and_time_between(km1, km2, v1, v2):
    """Calcula distancia y diferencia de tiempo estimada."""
    d = abs(km1 - km2)
    if v1 <= 0.3 or v2 <= 0.3:
        return d, "N/A"
    td = abs((d / v1) - (d / v2)) * 3600
    return d, time.strftime('%H:%M:%S', time.gmtime(int(td)))


def load_local_jsons():
    base = os.path.join(os.path.dirname(__file__), "REQUESTS_CRONO_scripts")
    out = {"raceDetails": {}, "raceClasifications": {}}
    for key in out.keys():
        path = os.path.join(base, f"{key}.json")
        with suppress(Exception):
            with open(path, "r", encoding="utf-8") as f:
                out[key] = json.load(f)
    return out


def get_tracmove_data():
    url = "https://app.tracmove.io/api/race/642"
    try:
        r = requests.get(url, timeout=5)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        return {"error": "No se pudo obtener APItracmove", "details": str(e)}
    



# ==============================
# FUNCIONES DE DATOS
# ==============================
def get_gps_data_only():
    return {"gps_data": gps_data}


def get_gps_data_dict():
    return {"curses": curses, "gps_data": gps_data, "APItracmove": get_tracmove_data(), "vmix_status": get_vmix_status()}


def get_all_gps_info_dict():
    tracmove = get_tracmove_data()
    local = load_local_jsons()

    response = {"APItracmove": tracmove, "curses": curses}
    response["gps_statistics"] = {}
    for gps_id, info in gps_data.items():
        data = info.get("data")
        if not data or not data.get("lat") or not data.get("lon"):
            continue

        prog = calculate_progress_optimized(data["lat"], data["lon"])
        comps = []

        for other_id, other_info in gps_data.items():
            if other_id == gps_id or other_info["status"] != "online" or not other_info.get("data"):
                continue

            odata = other_info["data"]
            if not odata.get("lat") or not odata.get("lon"):
                continue

            op = calculate_progress_optimized(odata["lat"], odata["lon"])
            dist, tdiff = calculate_distance_and_time_between(
                prog["closest_point"]["km_acumulats"],
                op["closest_point"]["km_acumulats"],
                data.get("speed_kmh", 0),
                odata.get("speed_kmh", 0)
            )
            comps.append({"other_gps": other_id, "distance_km": dist, "time_difference": tdiff})

        response["gps_statistics"][gps_id] = {"gps_info": info, "progress": prog, "comparisons": comps}

    # ✅ Incluir correctamente los JSON locales en la respuesta
    response["raceDetails"] = local.get("raceDetails", {})
    response["raceClasifications"] = local.get("raceClasifications", {})
    response["vmix_status"] = get_vmix_status()

    return response

def get_all_gps_info_dict2():
    tracmove = get_tracmove_data()
    local = load_local_jsons()

    response = {"APItracmove": tracmove, "curses": curses}
    response["gps_statistics"] = {}


    # ✅ Incluir correctamente los JSON locales en la respuesta
    response["raceDetails"] = local.get("raceDetails", {})"gps_data": gps_data,
    response["raceClasifications"] = local.get("raceClasifications", {})

    return response



# ==============================
# API REST
# ==============================
@app.route('/api/gps_only')
def api_gps_only(): return jsonify(get_gps_data_only())

@app.route('/api/gps')
def api_gps(): return jsonify(get_gps_data_dict())

@app.route('/api/all')
def api_gps_all(): return jsonify(get_all_gps_info_dict2())


@app.route('/api/change_route', methods=['POST'])
def change_route():
    global current_route
    data = request.json
    name = data.get("cursa")
    if name not in curses:
        return jsonify({"error": "Cursa no válida"}), 400
    current_route = name
    load_current_gpx()
    return jsonify({"message": f"Cursa cambiada a '{curses[name]['cursa']}'"})


# ==============================
# WEBSOCKETS
# ==============================
connected_status_clients, connected_statistics_clients = set(), set()

async def ws_handler(ws, path):
    print("Cliente conectado")
    try:
        async for msg in ws:
            try:
                data = json.loads(msg)
                if data.get("type") == "status":
                    connected_status_clients.add(ws)
                elif data.get("type") == "statistics":
                    connected_statistics_clients.add(ws)
            except Exception as e:
                # Ignora errores de parseo u otros errores menores
                print(f"Error procesando mensaje: {e}")
    except websockets.exceptions.ConnectionClosed:
        # Captura cualquier cierre de cliente (normal o abrupto)
        pass
    finally:
        connected_status_clients.discard(ws)
        connected_statistics_clients.discard(ws)
        print("Cliente desconectado")


async def broadcast_loop():
    while True:
        try:
            if connected_status_clients:
                gps_status = get_gps_data_dict()
                msg = json.dumps({"current_race": current_route, "gps_status": gps_status, "vmix_status": get_vmix_status()})
                await asyncio.gather(*(ws.send(msg) for ws in list(connected_status_clients)), return_exceptions=True)

            if connected_statistics_clients:
                gps_stats = get_all_gps_info_dict2()
                msg = json.dumps({"current_race": current_route, "data_all": gps_stats})
                await asyncio.gather(*(ws.send(msg) for ws in list(connected_statistics_clients)), return_exceptions=True)
        except Exception as e:
            print("Error en broadcast:", e)
        await asyncio.sleep(1)

# ==============================
# vMix STATUS
# ==============================

def get_vmix_status():
    """Consulta vMix y devuelve el input activo y en preview con su IP."""
    try:
        r = requests.get(VMIX_HOST, timeout=1)
        r.raise_for_status()
        xml_data = r.text
        root = ET.fromstring(xml_data)

        active_num = root.find("active").text
        preview_num = root.find("preview").text
        inputs = {i.get("number"): i.text.strip() for i in root.findall(".//input")}

        active_name = inputs.get(active_num, "Desconocido")
        preview_name = inputs.get(preview_num, "Desconocido")

        active_ip = ipMap.get(active_name, "N/A")
        preview_ip = ipMap.get(preview_name, "N/A")

        return {
            "active": {"num": active_num, "name": active_name, "ip": active_ip},
            "preview": {"num": preview_num, "name": preview_name, "ip": preview_ip}
        }
    except Exception as e:
        return {"error": str(e)}

def broadcast_vmix_status():
    """Envía el estado del vMix cada segundo a todos los GPS."""
    while True:
        try:
            status = get_vmix_status()
            socketio.emit("vmix_status", status)
        except Exception as e:
            print("Error enviando vmix_status:", e)
        time.sleep(1)


def start_ws():
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(asyncio.gather(websockets.serve(ws_handler, HOST, WS_PORT), broadcast_loop()))
    loop.run_forever()


# ==============================
# SOCKET.IO HANDLERS
# ==============================
@socketio.on('gps_data')
def handle_gps_data(data):
    try:
        if isinstance(data, str): data = json.loads(data)
        gps_id = data.get('id')
        if gps_id not in gps_data: return
        gps_data[gps_id]["data"] = {
            k: data.get(k) for k in ["alt", "fix_quality", "hdop", "lat", "lon", "num_sats", "pdop", "speed_kmh", "speed_ms", "time", "vdop"]
        }
        gps_data[gps_id]["last_seen"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        gps_data[gps_id]["status"] = "online"
    except Exception as e:
        print(f"Error procesando datos: {e}")


def clean_old_data():
    """Marca GPS como offline tras 10s sin señal."""
    while True:
        now = time.time()
        for gid, info in gps_data.items():
            if now - datetime.strptime(info["last_seen"], "%Y-%m-%d %H:%M:%S").timestamp() > 10:
                info.update({"status": "offline", "data": None})
        time.sleep(10)

threading.Thread(target=clean_old_data, daemon=True).start()


# ==============================
# MAIN
# ==============================
if __name__ == '__main__':
    script_dir = os.path.join(os.path.dirname(__file__), 'REQUESTS_CRONO_scripts')
    script_path = os.path.join(script_dir, 'LIVETRAIL_XML_requests.py')

    def run_livetrail_script():
        try:
            subprocess.run([sys.executable, script_path], check=True, cwd=script_dir, env={**os.environ, "PYTHONPATH": script_dir})
        except Exception as e:
            print(f"[ERROR] LIVETRAIL_XML_requests.py: {e}")

    threading.Thread(target=run_livetrail_script, daemon=True).start()
    #threading.Thread(target=broadcast_vmix_status, daemon=True).start()
    threading.Thread(target=start_ws, daemon=True).start()
    socketio.run(app, host=HOST, port=REST_PORT)
