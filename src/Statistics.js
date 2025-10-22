import React, { useState, useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { gpx as gpxToGeoJSON } from "@tmcw/togeojson";
import { useWebSocketData } from "./WebSocketProvider";
import "./App.css";
import { BBX_MAP } from "./global";


const gpsIPs = Object.values(BBX_MAP);

const gpsIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [25, 25],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const startIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/190/190411.png",
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
});

const endIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/190/190422.png",
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
});

// -----------------------------
// Utils
// -----------------------------
function parseCoordinate(input) {
  if (input == null) return null;
  const numeric = Number(input);
  if (!Number.isNaN(numeric) && Math.abs(numeric) <= 180) return numeric;
  const s = String(input).trim().toUpperCase();
  let m = s.match(/^(\d{1,3})(\d{2}\.\d+)\s*([NSWE])$/);
  if (!m) return null;
  let dec = parseInt(m[1],10) + parseFloat(m[2])/60;
  if (m[3]==="S"||m[3]==="W") dec*=-1;
  return dec;
}

function formatLastSeen(ts) {
  if (!ts) return "N/A";
  const ms = String(ts).length <= 10 ? Number(ts) * 1000 : Number(ts);
  const d = new Date(ms);
  if (isNaN(d.getTime())) return "N/A";
  return d.toLocaleString();
}

// -----------------------------
// Hook GPX dinámico desde currentRoute
// -----------------------------
function useGpxSelection(curses, currentRoute) {
  const [coords, setCoords] = useState([]);
  const [selectedGpxId, setSelectedGpxId] = useState(null);
  const cacheRef = useRef(new Map());

  useEffect(() => {
    if (!curses || !currentRoute) {
      setCoords([]);
      setSelectedGpxId(null);
      return;
    }

    const selected = Object.values(curses).find(c => c.id === currentRoute);
    if (!selected) {
      setCoords([]);
      setSelectedGpxId(null);
      return;
    }

    setSelectedGpxId(selected.id);

    if (!selected.track) {
      setCoords([]);
      return;
    }

    const gpxPath = `/${selected.track}`;
    console.log("Fetching GPX:", gpxPath); // <-- Aquí se debe ver la ruta GPX

    if (cacheRef.current.has(selected.id)) {
      setCoords(cacheRef.current.get(selected.id));
      return;
    }

    let aborted = false;

    (async () => {
      try {
        const res = await fetch(gpxPath, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const str = await res.text();
        const gpxXml = new window.DOMParser().parseFromString(str, "text/xml");
        const geoJsonData = gpxToGeoJSON(gpxXml);
        const coordinates = geoJsonData.features
          .filter(f => f.geometry?.type === "LineString")
          .flatMap(f => f.geometry.coordinates)
          .map(([lon, lat]) => [lat, lon]);

        if (!aborted) {
          cacheRef.current.set(selected.id, coordinates);
          setCoords(coordinates);
        }
      } catch (e) {
        console.error("GPX error:", e);
        if (!aborted) setCoords([]);
      }
    })();

    return () => { aborted = true; };
  }, [curses, currentRoute]);

  return { coords, selectedGpxId };
}

// -----------------------------
// Componente principal
// -----------------------------
export default function Statistics() {
  const { rawData } = useWebSocketData();
  const data_all = rawData?.data_all;
  const gpsStatus = data_all?.gps_statistics || {};
  const curses = data_all?.curses || {};
  const currentRoute = rawData?.current_race || null;
  const activeVmix = rawData?.data_all?.vmix_status?.active;

  const { coords: gpxCoords } = useGpxSelection(curses, currentRoute);
  const mapRef = useRef(null);

  const markersLocal = useMemo(() => {
    return Object.entries(gpsStatus)
      .map(([ip, gpsData]) => {
        if (gpsData.gps_info?.status !== "online" || !gpsData.gps_info?.data) return null;
        const lat = parseCoordinate(gpsData.gps_info.data.lat);
        const lon = parseCoordinate(gpsData.gps_info.data.lon);
        if (lat == null || lon == null) return null;
        return { ip, lat, lon, data: gpsData.gps_info.data, comparisons: gpsData.comparisons || [] };
      })
      .filter(Boolean);
  }, [gpsStatus, rawData]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const points = [...markersLocal.map(m=>[m.lat,m.lon]), ...gpxCoords];
    if (points.length>0) {
      const bounds = L.latLngBounds(points);
      if (bounds.isValid()) map.fitBounds(bounds.pad(0.1));
    }
  }, [markersLocal, gpxCoords]);

  const renderGpsBox = (ip, index) => {
    const gpsData = gpsStatus[ip] || { gps_info: { status: "offline", data: null }, comparisons: [] };
    return (
      <div key={ip} 
        className={`gps-box ${
          (activeVmix?.ip === ip)
            ? "active"
            : gpsData?.gps_info.status === "online"
              ? "online"
              : "offline"
        }`}
      >
        <h3>{Object.keys(BBX_MAP)[index]}</h3>
        <h3>{ip}</h3>
        <p>Last seen: {formatLastSeen(gpsData.gps_info.last_seen)}</p>
        {gpsData.gps_info.status==="online" && gpsData.gps_info.data ? (
          <>
            {gpsData.progress && (
              <>
                <p>GPX Completat: {gpsData.progress.percentatge_completat.toFixed(2) ?? "N/A"} %</p>
                <p>Km restants: {gpsData.progress.km_restants.toFixed(2) ?? "N/A"} km</p>
                <p>Km acumulats: {gpsData.progress.km_recorreguts.toFixed(2) ?? "N/A"} km</p>
              </>
            )}
            <p>Speed: {gpsData.gps_info.data.speed_kmh.toFixed(2) ?? "N/A"} km/h</p>
            {gpsData.comparisons?.length>0 && (
              <div style={{ marginTop: 6 }}>
                <strong>Comparisons:</strong>
                <ul style={{ fontSize: "12px", paddingLeft: 16 }}>
                  {gpsData.comparisons.map((c,i)=>(
                    <li key={i}>{c.other_gps}: {c.distance_km.toFixed(3)} km, Δt: {c.time_difference}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (<p>No data available</p>)}
      </div>
    );
  };

  return (
    <div className="App" style={{ backgroundColor: "black", marginLeft: "-20px" }}>
      <div style={{ color: "white", marginBottom: 10 }}>
        <h2>Current Route: {currentRoute ?? "N/A"}</h2>
      </div>

      <div className="gps-container" style={{ color:"white" }}>
        {gpsIPs.map((ip,index)=>renderGpsBox(ip,index))}
      </div>

      <MapContainer
        center={[41.39,2.17]}
        zoom={10}
        whenCreated={map=>mapRef.current=map}
        style={{ height:"1050px", width:"100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />

        {markersLocal.map(m=>(
          <Marker key={m.ip} position={[m.lat,m.lon]} icon={gpsIcon}>
            <Popup>
              <div>
                <h3>{m.ip}</h3>
                <p>Lat: {m.lat.toFixed(6)}, Lon: {m.lon.toFixed(6)}</p>
                <p>Alt: {m.data.alt ?? "N/A"}, Speed: {m.data.speed_kmh ?? "N/A"} km/h</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {gpxCoords.length>0 && (
          <>
            <Marker position={gpxCoords[0]} icon={startIcon}><Popup>Start</Popup></Marker>
            <Marker position={gpxCoords[gpxCoords.length-1]} icon={endIcon}><Popup>End</Popup></Marker>
            <Polyline positions={gpxCoords} pathOptions={{ color:"dodgerblue", weight:3, opacity:0.8 }} />
          </>
        )}
      </MapContainer>
    </div>
  );
}
