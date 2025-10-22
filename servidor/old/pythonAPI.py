from flask import Flask, jsonify
from flask_socketio import SocketIO
import threading
import json
import time
from datetime import datetime

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


# API REST para obtener datos GPS
@app.route('/api/gps', methods=['GET'])
def get_gps_data():
    return jsonify(gps_data)


# Manejar mensajes WebSocket
@socketio.on('connect')
def handle_connect():
    print("Cliente conectado.")


@socketio.on('gps_data')
def handle_message(data):
    try:
        # Convertir los datos recibidos a un diccionario
        if isinstance(data, str):
            data = json.loads(data)

        gps_id = data.get('id')
        if gps_id in gps_data:
            # Actualizar los datos del GPS
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


# Limpiar datos antiguos (marcar offline después de 60 segundos sin actualizar)
def clean_old_data():
    while True:
        current_time = time.time()
        for gps_id, info in gps_data.items():
            last_seen_time = datetime.strptime(info["last_seen"], "%Y-%m-%d %H:%M:%S").timestamp()
            if current_time - last_seen_time > 10:  # Si pasan 10 segundos
                gps_data[gps_id]["status"] = "offline"
                gps_data[gps_id]["data"] = None
        time.sleep(10)


if __name__ == '__main__':
    cleaner_thread = threading.Thread(target=clean_old_data)
    cleaner_thread.daemon = True
    cleaner_thread.start()
    socketio.run(app, host=HOST, port=PORT)
