from flask import Flask, jsonify, request
from flask_socketio import SocketIO
import threading
import json
import time
from datetime import datetime
from geopy.distance import geodesic  # Para calcular distancias geográficas
import xml.etree.ElementTree as ET  # Para procesar archivos GPX
from scipy.spatial import cKDTree
import numpy as np


# Configuración del servidor
HOST = "0.0.0.0"
PORT = 10009

app = Flask(__name__)
socketio = SocketIO(app)

# Lista de IDs de GPS
gps_ips = [
    '10.147.17.11', '10.147.17.12', '10.147.17.13', '10.147.17.14',
    '10.147.17.15', '10.147.17.16', '10.147.17.17', '10.147.17.18',
    '10.147.17.19', '10.147.17.20', '10.147.17.30'
]

# Diccionario inicial de datos GPS
gps_data = {
    gps_id: {
        "data": None,
        "last_seen": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "status": "offline"
    } for gps_id in gps_ips
}

# Variable global para almacenar los puntos del recorrido
route_points = []  # [(lat, lon, km_acumulados), ...]
# Variable global para el árbol k-d
route_kdtree = None
route_points_array = None


def load_gpx_optimized(file_path):
    global route_points, route_kdtree, route_points_array
    route_points = []
    tree = ET.parse(file_path)
    root = tree.getroot()

    namespace = {'gpx': 'http://www.topografix.com/GPX/1/1'}
    trkpts = root.findall(".//gpx:trkpt", namespace)

    previous_point = None
    total_distance = 0.0
    coordinates = []  # Para construir el k-d tree

    for pt in trkpts:
        lat = float(pt.get('lat'))
        lon = float(pt.get('lon'))
        current_point = (lat, lon)

        # Calcular distancia desde el punto anterior
        if previous_point:
            total_distance += geodesic(previous_point, current_point).kilometers
        previous_point = current_point

        # Añadir el punto a la lista con la distancia acumulada
        route_points.append((lat, lon, total_distance))
        coordinates.append((lat, lon))

    # Construir el k-d tree para búsquedas rápidas
    route_points_array = np.array(coordinates)  # Matriz de coordenadas (lat, lon)
    route_kdtree = cKDTree(route_points_array)

load_gpx_optimized('test_motx.gpx')  # Reemplazar por la ruta real al archivo GPX

# Verifica los resultados
# if route_points and route_kdtree and route_points_array is not None:
#     print("Puntos procesados:")
#     for point in route_points:
#         print(f"Lat: {point[0]}, Lon: {point[1]}, Distancia acumulada: {point[2]:.2f} km")
#
#     print("\nEstructura del k-d Tree construida correctamente.")
#     print("Array de puntos para k-d Tree:")
#     print(route_points_array)
# else:
#     print("Hubo un error al procesar el archivo GPX.")

def calculate_progress_optimized(gps_lat, gps_lon):
    gps_lat = gps_lat[:-2]
    gps_lon = gps_lon[:-2]

    degrees_minutes = float(gps_lat)
    degrees = int(degrees_minutes // 100)  # Parte de los grados
    minutes = degrees_minutes % 100       # Parte de los minutos
    gps_lat = degrees + (minutes / 60)

    degrees_minutes = float(gps_lon)
    degrees = int(degrees_minutes // 100)  # Parte de los grados
    minutes = degrees_minutes % 100       # Parte de los minutos
    gps_lon = degrees + (minutes / 60)

    if not route_kdtree or not route_points:
        return {"error": "No route loaded"}

    gps_point = np.array([gps_lat, gps_lon])

    # Encontrar el índice del punto más cercano usando el k-d tree
    dist, index_closest = route_kdtree.query(gps_point)
    closest_point = route_points[index_closest]

    # Calcular métricas
    km_recorridos = closest_point[2]
    km_totales = route_points[-1][2]
    km_restantes = km_totales - km_recorridos
    porcentaje = (km_recorridos / km_totales) * 100 if km_totales > 0 else 0

    return {
        "gps_data": {
            "lat_gps": gps_lat,
            "lon_gps": gps_lon
        },
        "closest_point": {
            "lat": closest_point[0],
            "lon": closest_point[1],
            "km_acumulats": closest_point[2]
        },
        "km_recorreguts": km_recorridos,
        "km_restants": km_restantes,
        "percentatge_completat": round(porcentaje, 2),
        "closest_distance_to_route": round(dist, 3)  # Distancia al punto más cercano
    }

def calculate_distance_and_time_between(km1, km2, speed1, speed2):
    """
    Calcula la distancia en km y la diferencia de tiempo estimada entre dos puntos del recorrido.

    :param km1: Distancia acumulada en el recorrido del primer GPS (en km).
    :param km2: Distancia acumulada en el recorrido del segundo GPS (en km).
    :param speed1: Velocidad actual del primer GPS (en km/h).
    :param speed2: Velocidad actual del segundo GPS (en km/h).
    :return: Una tupla (distance_km, time_diff_str) con la distancia en km y el tiempo de diferencia en formato HH:MM.
    """
    # Calcular distancia absoluta entre los puntos
    distance_km = abs(km1 - km2)

    # Si alguna velocidad es 0, asumimos que el tiempo no puede calcularse
    if speed1 <= 0.3 or speed2 <= 0.3:
        return distance_km, "N/A"

    # Calcular el tiempo necesario para recorrer la distancia para cada GPS
    # Tiempo = Distancia / Velocidad
    time1 = distance_km / speed1  # Tiempo en horas para GPS1
    time2 = distance_km / speed2  # Tiempo en horas para GPS2

    # Diferencia de tiempo entre ambos GPS
    time_diff_hours = abs(time1 - time2)  # Diferencia en horas
    time_diff_seconds = int(time_diff_hours * 3600)  # Convertir a segundos

    # Convertir tiempo a formato HH:MM:SS
    time_diff_str = time.strftime('%H:%M:%S', time.gmtime(time_diff_seconds))

    return distance_km, time_diff_str


# API REST para obtener datos GPS
@app.route('/api/gps', methods=['GET'])
def get_gps_data():
    return jsonify(gps_data)


@app.route('/api/gps_all', methods=['GET'])
def get_all_gps_info():
    if not gps_data:
        return jsonify({"error": "No GPS data available"}), 404

    response = {}

    # Recorrer todos los GPS y construir la estructura
    for gps_id, gps_info in gps_data.items():
        if not gps_info.get("data"):
            continue  # Ignorar GPS sin datos

        # Extraer coordenadas
        gps_lat = gps_info["data"].get("lat")
        gps_lon = gps_info["data"].get("lon")

        # Calcular progreso si hay coordenadas válidas
        progress = calculate_progress_optimized(gps_lat, gps_lon) if gps_lat and gps_lon else None

        # Comparaciones del GPS actual con los demás
        comparisons = []
        for other_id, other_info in gps_data.items():
            if other_id == gps_id or not other_info.get("data") or other_info["status"] != "online":
                continue  # Ignorar si es el mismo GPS o no está operativo

            # Coordenadas del otro GPS
            other_lat = other_info["data"].get("lat")
            other_lon = other_info["data"].get("lon")

            # Progreso del otro GPS
            other_progress = calculate_progress_optimized(other_lat, other_lon) if other_lat and other_lon else None

            if progress and other_progress:
                # Calcular distancia y tiempo entre los dos GPS
                distance_km, time_diff = calculate_distance_and_time_between(
                    progress["closest_point"]["km_acumulats"],
                    other_progress["closest_point"]["km_acumulats"],
                    gps_info["data"].get("speed_kmh"),
                    other_info["data"].get("speed_kmh"),
                )

                comparisons.append({
                    "other_gps": other_id,
                    "distance_km": distance_km,
                    "time_difference": time_diff,
                })

        # Agregar la información del GPS actual al resultado
        response[gps_id] = {
            "gps_info": gps_info,
            "progress": progress,
            "comparisons": comparisons
        }

    return jsonify(response)




# Manejar mensajes WebSocket
@socketio.on('connect')
def handle_connect():
    print("Cliente conectado.")


@socketio.on('gps_data')
def handle_message(data):
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
            print(f"Datos actualizados para {gps_id}: {gps_data[gps_id]}")
        else:
            print(f"ID GPS no reconocido: {gps_id}")
    except Exception as e:
        print(f"Error procesando datos: {e}")


# Limpiar datos antiguos
def clean_old_data():
    while True:
        current_time = time.time()
        for gps_id, info in gps_data.items():
            last_seen_time = datetime.strptime(info["last_seen"], "%Y-%m-%d %H:%M:%S").timestamp()
            if current_time - last_seen_time > 10:
                gps_data[gps_id]["status"] = "offline"
                gps_data[gps_id]["data"] = None
        time.sleep(10)


if __name__ == '__main__':
    cleaner_thread = threading.Thread(target=clean_old_data)
    cleaner_thread.daemon = True
    cleaner_thread.start()
    socketio.run(app, host=HOST, port=PORT, allow_unsafe_werkzeug=True)
