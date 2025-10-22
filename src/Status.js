import React, { useState, useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.Default.css";
import "./App.css";
import MarkerClusterGroup from "react-leaflet-cluster";
import { gpx as gpxToGeoJSON } from "@tmcw/togeojson";
import { SERVER_IP } from "./global";
import { BBX_MAP } from "./global";
import { active } from "d3";

// -----------------------------
// Configuración inicial
// -----------------------------
const gpsIPs = Object.values(BBX_MAP);

// Colores de marcadores
const COLOR_LOCAL = "#2ecc71"; // verde
const COLOR_API = "#3498db";   // azul

function makeCircleIcon(color) {
  const size = 18;
  const border = 2;
  const html = `
    <div style="
      width:${size}px;
      height:${size}px;
      background:${color};
      border:${border}px solid #fff;
      border-radius:50%;
      box-shadow:0 0 4px rgba(0,0,0,0.5);
    "></div>
  `;
  return L.divIcon({
    className: "",
    html,
    iconSize: [size + border * 2, size + border * 2],
    iconAnchor: [(size + border * 2) / 2, (size + border * 2) / 2],
    popupAnchor: [0, -10],
  });
}

const localIcon = makeCircleIcon(COLOR_LOCAL);
const apiIcon = makeCircleIcon(COLOR_API);

// -----------------------------
// Utils
// -----------------------------
function parseCoordinate(input) {
  if (input == null) return null;
  const numeric = Number(input);
  if (!Number.isNaN(numeric) && Math.abs(numeric) <= 180) return numeric;
  const s = String(input).trim().toUpperCase();
  let m = s.match(/^(\d{1,3})(\d{2}\.\d+)\s*([NSWE])$/);
  if (m) {
    const deg = parseInt(m[1], 10);
    const min = parseFloat(m[2]);
    const dir = m[3];
    let dec = deg + min / 60;
    if (dir === "S" || dir === "W") dec *= -1;
    return dec;
  }
  m = s.match(/^(\d{1,3})[^\d]+(\d{1,2}(?:\.\d+)?)\s*([NSWE])?$/);
  if (m) {
    const deg = parseInt(m[1], 10);
    const min = parseFloat(m[2]) || 0;
    const dir = m[3];
    let dec = deg + min / 60;
    if (dir === "S" || dir === "W") dec *= -1;
    return dec;
  }
  return null;
}

function formatLastSeen(ts) {
  if (!ts) return "N/A";
  const ms = String(ts).length <= 10 ? Number(ts) * 1000 : Number(ts);
  const d = new Date(ms);
  if (isNaN(d.getTime())) return "N/A";
  return d.toLocaleString();
}

function normalize(str) {
  return (str ?? "").toString().toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

// -----------------------------
// Hook WS backend
// -----------------------------
export function useStatusWebSocket(enabled) {
  const [gpsData, setGpsData] = useState({});
  const [apiParticipants, setApiParticipants] = useState([]);
  const [raceInfo, setRaceInfo] = useState({ race_id: null, race_name: null });
  const [curses, setCurses] = useState({});
  const [error, setError] = useState(null);
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);
  const [currentRoute, setCurrentRoute] = useState();
  const [activeVmix, setActiveVmix] = useState(null);

  useEffect(() => {
    if (!enabled) return;
    let retry = 0;
    const connect = () => {
      setError(null);
      const proto = "ws://";
      const host =
        (import.meta?.env?.VITE_WS_HOST) ||
        process.env.REACT_APP_WS_HOST ||
        SERVER_IP.server_ip;
      const url = `${proto}${host}`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        retry = 0;
        try {
          ws.send(JSON.stringify({ type: "status" }));
        } catch (e) {
          console.error("WS send error:", e);
        }
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload?.vmix_status){
            const active = payload?.vmix_status['active']
            setActiveVmix(active)
          }
          if (payload?.gps_status?.gps_data) {
            setGpsData(payload.gps_status.gps_data);
            if (payload.gps_status.curses) {
              setCurses(payload.gps_status.curses);
              setCurrentRoute(payload?.current_race || null)
            }
          }
          if (payload?.gps_status?.APItracmove) {
            const api = payload.gps_status.APItracmove;
            setApiParticipants(Array.isArray(api.participants) ? api.participants : []);
            setRaceInfo({
              race_id: api.race_id ?? null,
              race_name: api.race_name ?? null,
            });
          }
        } catch (e) {
          console.error("WS JSON parse error:", e);
        }
      };

      ws.onerror = (e) => {
        console.error("WebSocket error:", e);
        setError("WebSocket error");
      };

      ws.onclose = () => {
        const delay = Math.min(30000, 1000 * Math.pow(2, retry++));
        reconnectRef.current = setTimeout(connect, delay);
      };
    };
    connect();
    return () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      if (wsRef.current && wsRef.current.readyState <= 1) {
        wsRef.current.close();
      }
    };
  }, [enabled]);

  return { gpsData, apiParticipants, raceInfo, curses, error, activeVmix};
}

// -----------------------------
// GPX hook (dinámico)
// -----------------------------
function useGpxSelection(curses, defaultId = "none") {
  const gpxFiles = useMemo(() => {
    if (!curses || typeof curses !== "object") return [{ id: "none", label: "Ninguno", path: null }];
    return [
      { id: "none", label: "Ninguno", path: null },
      ...Object.entries(curses).map(([key, c]) => ({
        id: c.id,
        label: c.cursa || key,
        path: c.track ? `./${c.track}` : null,
      })),
    ];
  }, [curses]);

  const [selectedGpxId, setSelectedGpxId] = useState(defaultId);
  const [coords, setCoords] = useState([]);
  const [error, setError] = useState(null);
  const cacheRef = useRef(new Map());

  useEffect(() => {
    const selected = gpxFiles.find(g => g.id === selectedGpxId);
    if (!selected || !selected.path) {
      setCoords([]);
      setError(null);
      return;
    }
    if (cacheRef.current.has(selected.id)) {
      setCoords(cacheRef.current.get(selected.id));
      setError(null);
      return;
    }
    let aborted = false;
    (async () => {
      try {
        setError(null);
        const res = await fetch(selected.path, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status} (${selected.path})`);
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
        if (!aborted) {
          setError(e.message || String(e));
          setCoords([]);
        }
      }
    })();
    return () => { aborted = true; };
  }, [selectedGpxId, gpxFiles]);

  return { gpxFiles, selectedGpxId, setSelectedGpxId, coords, error };
}

// -----------------------------
// Componente principal
// -----------------------------

export default function Status() {
  // Fuente de datos: "local" | "api" | "both"
  const [dataSource, setDataSource] = useState("local");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Filtros API
  const [selectedCategories, setSelectedCategories] = useState(new Set());
  const [nameFilter, setNameFilter] = useState("");
  const [bibFilter, setBibFilter] = useState("");

  const mapRef = useRef(null);

  // Auth inicial
  useEffect(() => {
    const storedAuth = localStorage.getItem("isAuthenticated");
    setIsAuthenticated(storedAuth === "true");
  }, []);

  const { gpsData, apiParticipants, raceInfo, curses, error: wsError, activeVmix } = useStatusWebSocket(
    isAuthenticated && (dataSource === "local" || dataSource === "api" || dataSource === "both")
  );

  useEffect(() => {
    console.log("activeVmix actualizado:", activeVmix);
  }, [activeVmix]);


  const {
    gpxFiles,
    selectedGpxId,
    setSelectedGpxId,
    coords: gpxCoords,
    error: gpxError
  } = useGpxSelection(curses);

  // Preparar marcadores locales a partir de gpsData
  const markersLocal = useMemo(() => {
    return Object.entries(gpsData || {})
      .map(([ip, entry]) => {
        const gpsEntry = entry || {};
        if (gpsEntry?.status !== "online" || !gpsEntry?.data) return null;

        const lat = parseCoordinate(gpsEntry.data.lat);
        const lon = parseCoordinate(gpsEntry.data.lon);
        if (
          lat == null || lon == null ||
          Math.abs(lat) > 90 || Math.abs(lon) > 180
        ) return null;

        return { key: ip, ip, lat, lon, data: gpsEntry.data, last_seen: gpsEntry.last_seen };
      })
      .filter(Boolean);
  }, [gpsData]);

  // Categorías disponibles (API)
  const categories = useMemo(() => {
    const set = new Set(
      (apiParticipants || [])
        .map((p) => (p?.category || "").trim())
        .filter(Boolean)
    );
    return Array.from(set).sort();
  }, [apiParticipants]);

  // Inicializar/ajustar selección de categorías cuando cambian
  useEffect(() => {
    if ((dataSource === "api" || dataSource === "both") && categories.length > 0) {
      if (selectedCategories.size === 0) {
        setSelectedCategories(new Set(categories)); // por defecto todas
      } else {
        const next = new Set(
          [...selectedCategories].filter((c) => categories.includes(c))
        );
        if (next.size !== selectedCategories.size) {
          setSelectedCategories(next);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories, dataSource]);

  // Preparar marcadores API + filtros (categoría, nombre, dorsal)
  const {
    markersApiFiltered,
    totalApiWithCoords
  } = useMemo(() => {
    const normalizedName = normalize(nameFilter);
    const normalizedBib = normalize(bibFilter);

    const withCoords = (apiParticipants || [])
      .filter((p) => p?.position && typeof p.position.latitude === "number" && typeof p.position.longitude === "number");

    const filtered = withCoords
      .filter((p) => {
        // Filtro por categoría
        const cat = (p.category || "").trim();
        if (selectedCategories.size > 0 && !selectedCategories.has(cat)) return false;

        // Filtro por nombre
        if (normalizedName) {
          const full = normalize(p.full_name || "");
          if (!full.includes(normalizedName)) return false;
        }

        // Filtro por dorsal
        if (normalizedBib) {
          const bibStr = String(p.bib ?? "").toLowerCase();
          if (!bibStr.includes(normalizedBib)) return false;
        }

        return true;
      })
      .map((p) => ({
        key: `api-${p.device_id}`,
        device_id: p.device_id,
        full_name: p.full_name,
        bib: p.bib,
        category: (p.category || "").trim(),
        nacionality: p.nacionality,
        battery_level: p.battery_level,
        last_active: p.last_active,
        lat: p.position.latitude,
        lon: p.position.longitude,
        position: p.position,
      }));

    return {
      markersApiFiltered: filtered,
      totalApiWithCoords: withCoords.length,
    };
  }, [apiParticipants, selectedCategories, nameFilter, bibFilter]);

  // Fit bounds al cambiar datos visibles
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const includeLocal = dataSource === "local" || dataSource === "both";
    const includeApi = dataSource === "api" || dataSource === "both";

    const points = [
      ...(includeLocal ? markersLocal.map(m => [m.lat, m.lon]) : []),
      ...(includeApi ? markersApiFiltered.map(m => [m.lat, m.lon]) : []),
      ...gpxCoords,
    ];

    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      if (bounds.isValid()) {
        map.fitBounds(bounds.pad(0.1), { animate: true });
      }
    }
  }, [dataSource, markersLocal, markersApiFiltered, gpxCoords]);

  // -----------------------------
  // UI: Selector de fuente + Leyenda + GPX + Filtros API
  // -----------------------------
  const SourceSelector = () => (
    <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "10px 12px", flexWrap: "wrap" }}>
      <button
        onClick={() => setDataSource("local")}
        style={{ backgroundColor: dataSource === "local" ? COLOR_LOCAL : "#444", color: "white", border: "none", padding: "8px 12px", borderRadius: 6, cursor: "pointer" }}
      >
        Motxilles
      </button>
      <button
        onClick={() => setDataSource("api")}
        style={{ backgroundColor: dataSource === "api" ? COLOR_API : "#444", color: "white", border: "none", padding: "8px 12px", borderRadius: 6, cursor: "pointer" }}
      >
        API Tracmove
      </button>
      <button
        onClick={() => setDataSource("both")}
        style={{ backgroundColor: dataSource === "both" ? "#8e44ad" : "#444", color: "white", border: "none", padding: "8px 12px", borderRadius: 6, cursor: "pointer" }}
      >
        Todos
      </button>

      <div style={{ marginLeft: "auto", display: "flex", gap: 16, alignItems: "center", color: "#ddd" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 12, height: 12, borderRadius: "50%", background: COLOR_LOCAL, display: "inline-block", border: "2px solid #fff" }} />
          Motxilles
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 12, height: 12, borderRadius: "50%", background: COLOR_API, display: "inline-block", border: "2px solid #fff" }} />
          API Tracmove
        </span>
      </div>

      {/* Selector de GPX */}
      <div style={{ width: "100%", color: "#eee", marginTop: 8 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <label htmlFor="gpxSelect" style={{ fontSize: 12, opacity: 0.8 }}>Ruta GPX</label>
            <select
              id="gpxSelect"
              value={selectedGpxId}
              onChange={(e) => setSelectedGpxId(e.target.value)}
              style={{ padding: "6px 8px", borderRadius: 4, border: "1px solid #555", background: "#222", color: "#eee", minWidth: 220 }}
            >
              {gpxFiles.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ opacity: 0.9 }}>
            {gpxError ? (
              <span style={{ color: "tomato" }}>Error GPX: {gpxError}</span>
            ) : (
              <span>Pts: {gpxCoords.length}</span>
            )}
          </div>
        </div>
      </div>

      {/* Filtros API (visibles si hay API en pantalla) */}
      {(dataSource === "api" || dataSource === "both") && (
        <div style={{ width: "100%", color: "#eee", marginTop: 8 }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <label htmlFor="nameFilter" style={{ fontSize: 12, opacity: 0.8 }}>Nombre</label>
              <input
                id="nameFilter"
                type="text"
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                placeholder="Buscar por nombre…"
                style={{ padding: "6px 8px", borderRadius: 4, border: "1px solid #555", background: "#222", color: "#eee", minWidth: 220 }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              <label htmlFor="bibFilter" style={{ fontSize: 12, opacity: 0.8 }}>Dorsal</label>
              <input
                id="bibFilter"
                type="text"
                value={bibFilter}
                onChange={(e) => setBibFilter(e.target.value)}
                placeholder="Ej: 5"
                style={{ padding: "6px 8px", borderRadius: 4, border: "1px solid #555", background: "#222", color: "#eee", minWidth: 120 }}
              />
            </div>

            <div style={{ marginLeft: "auto", opacity: 0.9 }}>
              Results: {markersApiFiltered.length}/{totalApiWithCoords}
            </div>
          </div>

          {categories.length > 0 && (
            <>
              <div style={{ marginTop: 10, marginBottom: 6, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <strong>Categorías:</strong>
                <button
                  onClick={() => setSelectedCategories(new Set(categories))}
                  style={{ background: "#555", color: "#fff", border: "none", padding: "4px 8px", borderRadius: 4, cursor: "pointer" }}
                >
                  Seleccionar totes
                </button>
                <button
                  onClick={() => setSelectedCategories(new Set())}
                  style={{ background: "#555", color: "#fff", border: "none", padding: "4px 8px", borderRadius: 4, cursor: "pointer" }}
                >
                  Netejar
                </button>
                <span style={{ opacity: 0.75 }}>
                  ({selectedCategories.size}/{categories.length} seleccionadas)
                </span>
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {categories.map((cat) => {
                  const checked = selectedCategories.has(cat);
                  return (
                    <label key={cat} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          const next = new Set(selectedCategories);
                          if (checked) next.delete(cat);
                          else next.add(cat);
                          setSelectedCategories(next);
                        }}
                      />
                      {cat || "(sin categoría)"}
                    </label>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <div className="App" style={{ backgroundColor: "black", marginLeft: "-20px" }}>
      <SourceSelector />

      {/* Panel: Mis GPS */}
      {(dataSource === "local" || dataSource === "both") && (
        <div className="gps-container" style={{ color: "white" }}>
          {gpsIPs.map((ip, index) => {
            const item = gpsData?.[ip];
            return (
              <div
                key={ip}
                className={`gps-box ${
                  (activeVmix?.ip === ip)
                    ? "active"
                    : item?.status === "online"
                      ? "online"
                      : "offline"
                }`}
              >
                <h3>{Object.keys(BBX_MAP)[index]}</h3>
                <h3>{ip}</h3>
                <p>Last seen: {item?.last_seen || "N/A"}</p>
                {item?.status === "online" && item?.data ? (
                  <div>
                    <p>Latitude: {item.data.lat ?? "N/A"}</p>
                    <p>Longitude: {item.data.lon ?? "N/A"}</p>
                    <p>Altitude: {item.data.alt ?? "N/A"}</p>
                    <p>Satellites: {item.data.num_sats ?? "N/A"}</p>
                    <p style={{ fontSize: "20px" }}>
                      Speed: {item.data.speed_kmh ?? "N/A"} km/h
                    </p>
                    {item.data.on_time_speed_kmh != null && (
                      <p style={{ fontSize: "20px" }}>
                        On time Speed: {item.data.on_time_speed_kmh} km/h
                      </p>
                    )}
                  </div>
                ) : (
                  <p>No data available</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Panel: API */}
      {(dataSource === "api" || dataSource === "both") && (
        <div className="gps-container" style={{ color: "white" }}>
          <div className="gps-box online" style={{ minWidth: 280 }}>
            <h3>API Tracmove</h3>
            {wsError && <p style={{ color: "tomato" }}>WS: {wsError}</p>}
            <p>Participants (filtrats): {markersApiFiltered.length} / {totalApiWithCoords}</p>
            <p>Cursa: {raceInfo.race_name ?? "-"} (ID {raceInfo.race_id ?? "-"})</p>
          </div>
        </div>
      )}

      <MapContainer
        center={[41.39, 2.17]} // por defecto; luego hacemos fitBounds
        zoom={8}
        whenCreated={(map) => { mapRef.current = map; }}
        style={{ height: "1050px", width: "100%", marginTop: "20px" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        {/* Marcadores: Mis GPS (sin clustering) */}
        {(dataSource === "local" || dataSource === "both") &&
          markersLocal.map(({ key, ip, lat, lon, data, last_seen }) => (
            <Marker key={key} position={[lat, lon]} icon={localIcon}>
              <Popup>
                <div>
                  <h3>{ip}</h3>
                  <p>Latitude: {lat.toFixed(6)}</p>
                  <p>Longitude: {lon.toFixed(6)}</p>
                  <p>Altitude: {data.alt ?? "N/A"}</p>
                  <p>Speed: {data.speed_kmh ?? "N/A"} km/h</p>
                  <p>Last seen: {last_seen ?? "N/A"}</p>
                </div>
              </Popup>
            </Marker>
          ))
        }

        {/* Marcadores: API (con clustering SOLO para API) */}
        {(dataSource === "api" || dataSource === "both") && (
          <MarkerClusterGroup chunkedLoading maxClusterRadius={60} disableClusteringAtZoom={15}>
            {markersApiFiltered.map((p) => (
              <Marker key={p.key} position={[p.lat, p.lon]} icon={apiIcon}>
                <Popup>
                  <div>
                    <h3>{p.full_name}</h3>
                    <p>Dorsal: {p.bib}</p>
                    <p>Categoría: {p.category || "-"}</p>
                    <p>Nacionalidad: {p.nacionality || "-"}</p>
                    <p>Velocidad: {p.position?.speed ?? "N/A"} km/h</p>
                    <p>Altitud: {p.position?.altitude ?? "N/A"} m</p>
                    <p>Batería: {p.battery_level ?? "N/A"}%</p>
                    <p>Last active: {formatLastSeen(p.last_active)}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
        )}

        {/* GPX seleccionado */}
        {gpxCoords.length > 0 && (
          <Polyline
            pathOptions={{ color: "dodgerblue", weight: 3, opacity: 0.8 }}
            positions={gpxCoords}
          />
        )}
      </MapContainer>
    </div>
  );
}
