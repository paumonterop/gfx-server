import React, { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./App.css";

const gpsIPs = [
  "10.147.17.11",
  "10.147.17.12",
  "10.147.17.13",
  "10.147.17.14",
  "10.147.17.15",
  "10.147.17.16",
  "10.147.17.17",
  "10.147.17.18",
  "10.147.17.19",
  "10.147.17.20",
  "10.147.17.30",
];

const gpsIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [25, 25],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [gpsStatus, setGpsStatus] = useState({});

  // Cargar estado de autenticación al montar el componente
  useEffect(() => {
    const storedAuth = localStorage.getItem("isAuthenticated");
    if (storedAuth === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const ws = new WebSocket("ws://178.249.12.177:10008");

      ws.onmessage = (event) => {
        const updatedData = JSON.parse(event.data);
        setGpsStatus(updatedData);
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      ws.onclose = () => {
        console.log("WebSocket connection closed");
      };

      return () => ws.close();
    }
  }, [isAuthenticated]);

  const convertToDecimal = (dms) => {
    const parts = dms.match(/(\d+)(\d{2}\.\d+)\s*([NSWE])/);
    if (!parts) return null;
    const degrees = parseFloat(parts[1]);
    const minutes = parseFloat(parts[2]) / 60;
    const direction = parts[3];

    let decimal = degrees + minutes;
    if (direction === "S" || direction === "W") {
      decimal *= -1;
    }
    return decimal;
  };

  const handleLogin = () => {
    if (username === "admin" && password === "Calamar200!.") {
      setIsAuthenticated(true);
      localStorage.setItem("isAuthenticated", "true"); // Guardar autenticación
    } else {
      alert("Credenciales incorrectas");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("isAuthenticated"); // Eliminar autenticación
  };

  const renderGpsBox = (ip, index) => {
    const gpsData = gpsStatus[ip] || { status: "offline", data: null };

    return (
      <div
        key={ip}
        className={`gps-box ${gpsData.status === "online" ? "online" : "offline"}`}
      >
      <h3>{`BBX${(index + 1).toString().padStart(2, "0")}`}</h3> {/* BBX01, BBX02, etc. */}
      <h3>{ip}</h3>
        <p>Last seen: {gpsData.last_seen}</p>
        {gpsData.status === "online" && gpsData.data ? (
          <div>
            <p>Latitude: {gpsData.data.lat || "N/A"}</p>
            <p>Longitude: {gpsData.data.lon || "N/A"}</p>
            <p>Altitude: {gpsData.data.alt || "N/A"}</p>
            <p>Satellites: {gpsData.data.num_sats || "N/A"}</p>
            <p style={{ fontSize: "20px" }}>
              Speed: {gpsData.data.speed_kmh || "N/A"} km/h
            </p>
          </div>
        ) : (
          <p>No data available</p>
        )}
      </div>
    );
  };

  const renderMarkers = () => {
    return Object.entries(gpsStatus).map(([ip, gpsData]) => {
      if (gpsData.status === "online" && gpsData.data) {
        const lat = convertToDecimal(gpsData.data.lat);
        const lon = convertToDecimal(gpsData.data.lon);

        if (lat === null || lon === null) {
          console.error(`Invalid coordinates for IP: ${ip}`);
          return null;
        }

        return (
          <Marker key={ip} position={[lat, lon]} icon={gpsIcon}>
            <Popup>
              <div>
                <h3>{ip}</h3>
                <p>Latitude: {lat.toFixed(6)}</p>
                <p>Longitude: {lon.toFixed(6)}</p>
                <p>Altitude: {gpsData.data.alt || "N/A"}</p>
                <p>Speed: {gpsData.data.speed_kmh || "N/A"} km/h</p>
              </div>
            </Popup>
          </Marker>
        );
      }
      return null;
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="login-container">
        <h1>Iniciar sessió</h1>
        <input
          type="text"
          placeholder="Usuari"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Contrasenya"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={handleLogin}>Entrar</button>
      </div>
    );
  }

  return (
    <div className="App">
      <h1>GPS Status Dashboard</h1>
      <button onClick={handleLogout}>Tancar sessió</button>
      <div className="gps-container">
      {gpsIPs.map((ip, index) => renderGpsBox(ip, index))}
      </div>
      <MapContainer
        center={[41.9, 2.1738]}
        zoom={8}
        style={{ height: "1050px", width: "100%", marginTop: "20px" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {renderMarkers()}
      </MapContainer>
    </div>
  );
}

export default App;
