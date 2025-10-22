import React, { useState, useEffect, useMemo } from "react";
import "./Cursa.css";

const PERFIL_WIDTH = 1250;
const PERFIL_HEIGHT = 250;
const LABEL_OFFSET_PX = 100;

const Cursa = ({ data, show }) => {
  const [isVisible, setIsVisible] = useState(show);
  const [gpxData, setGpxData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadedTrack, setLoadedTrack] = useState(null);
  const [pointPositions, setPointPositions] = useState([]);

  const trackGpx = data?.track;
  const racePoints = data?.points;

  // visibilidad con retraso al ocultar
  useEffect(() => {
    if (show) {
      setIsVisible(true);
    } else {
      const t = setTimeout(() => setIsVisible(false), 1000);
      return () => clearTimeout(t);
    }
  }, [show]);

  // parse GPX y genera gpxData { dist, ele }
  useEffect(() => {
    if (!trackGpx || trackGpx === loadedTrack) return;

    setLoadedTrack(trackGpx);
    setLoading(true);
    setError("");
    setGpxData([]);

    fetch("/" + trackGpx)
      .then((res) => {
        if (!res.ok) throw new Error("Fitxer no trobat a /public/" + trackGpx);
        return res.text();
      })
      .then((xmlString) => {
        const parser = new DOMParser();
        const xml = parser.parseFromString(xmlString, "application/xml");
        const points = Array.from(xml.getElementsByTagName("trkpt")).map(
          (pt) => ({
            lat: parseFloat(pt.getAttribute("lat")),
            lon: parseFloat(pt.getAttribute("lon")),
            ele: parseFloat(pt.getElementsByTagName("ele")[0]?.textContent || 0),
          })
        );

        if (points.length === 0) {
          setError("El GPX no conté punts de track vàlids.");
          return;
        }

        // reducir densidad y calcular dist acumulada
        let totalDist = 0;
        const perfil = points
          .filter((_, i) => i % 10 === 0)
          .map((p, i, arr) => {
            if (i > 0) {
              const prev = arr[i - 1];
              totalDist += haversineDistance(prev.lat, prev.lon, p.lat, p.lon);
            }
            return { dist: parseFloat(totalDist.toFixed(2)), ele: p.ele };
          });

        setGpxData(perfil);
      })
      .catch((err) => {
        console.error("Error carregant GPX:", err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [trackGpx, loadedTrack]);

    // calcula posiciones por porcentaje, evitando solapes verticales
  useEffect(() => {
    if (!racePoints || racePoints.length === 0 || gpxData.length === 0) {
      setPointPositions([]);
      return;
    }

    const totalKm = parseFloat(racePoints[racePoints.length - 1].km);
    const minEle = Math.min(...gpxData.map((d) => d.ele));
    const maxEle = Math.max(...gpxData.map((d) => d.ele));
    const range = Math.max(maxEle - minEle, 10);

    // Paso 1: calcular posiciones base
    const basePositions = racePoints.map((p) => {
      const km = parseFloat(p.km);
      const percent = Math.min((km / totalKm) * 100, 100);
      const xPx = (percent / 100) * PERFIL_WIDTH;

      // Buscar punto GPX más cercano por distancia
      const targetDist = (percent / 100) * gpxData[gpxData.length - 1].dist;
      const gpxPoint = gpxData.reduce(
        (prev, curr) =>
          Math.abs(curr.dist - targetDist) < Math.abs(prev.dist - targetDist)
            ? curr
            : prev,
        gpxData[0]
      );

      const yPx =
        PERFIL_HEIGHT -
        ((gpxPoint.ele - minEle) / range) * PERFIL_HEIGHT;

      return {
        ...p,
        xPx,
        yPx,
        percent,
        gpxPoint,
      };
    });

    // Paso 2: ajustar Y si hay solapes horizontales
    const adjusted = basePositions.map((curr, i, arr) => {
      let adjustedYPx = curr.yPx;

      // buscar si hay puntos cercanos en el eje X
      for (let j = 0; j < i; j++) {
        const prev = arr[j];
        const dx = Math.abs(curr.xPx - prev.xPx);
        const dy = Math.abs(curr.yPx - prev.yPx);
        if (dx < 10) {
          adjustedYPx = 0;
        }else if (dx < 100){
          adjustedYPx = Math.max(curr.yPx - 40, -90);
        }
      }

      return {
        ...curr,
        yPx: adjustedYPx,
      };
    });

    setPointPositions(adjusted);
  }, [racePoints, gpxData]);


  // helper haversine
  const haversineDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // Genera la ruta SVG del perfil
  const perfilPath = useMemo(() => {
    if (!gpxData || gpxData.length === 0) return "";
    const minEle = Math.min(...gpxData.map((d) => d.ele));
    const maxEle = Math.max(...gpxData.map((d) => d.ele));
    const totalDist = gpxData[gpxData.length - 1].dist || 1;

    const d = gpxData
      .map((pt, i) => {
        const x = (pt.dist / totalDist) * PERFIL_WIDTH;
        const y =
          PERFIL_HEIGHT - ((pt.ele - minEle) / (maxEle - minEle || 1)) * PERFIL_HEIGHT;
        return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(" ");

    const closed = `${d} L ${PERFIL_WIDTH} ${PERFIL_HEIGHT} L 0 ${PERFIL_HEIGHT} Z`;
    return { strokePath: d, closedPath: closed };
  }, [gpxData]);

  if (!isVisible) return null;

  return (
    <div style={styles.container}>
      <div
        className="classificacio-patrocinador"
        style={{
          animation: `${show ? `CursaSlideLeftTitol 0.5s ease-in-out forwards` : `CursaSlideRightClas 0.5s ease-in-out forwards`}`,
          backgroundImage: `url(/vera2__.png)`,
        }}
      ></div>

      <div
        style={{
          ...styles.title_container,
          animation: `${show ? "CursaSlideLeftTitol 0.5s ease-in-out forwards" : "CursaSlideRightClas 0.5s ease-in-out forwards"}`,
        }}
      >
        <div style={styles.title}>{data?.title}</div>
      </div>

      <div
        style={{
          ...styles.subtitle_container,
          animation: `${show ? "CursaSlideLeftTitol 0.5s ease-in-out forwards" : "CursaSlideRightClas 0.5s ease-in-out forwards"}`,
        }}
      >
        <div style={styles.subtitle}>{data?.subtitle}</div>
      </div>

      <div style={styles.perfilContainer}>
        {/* SVG perfil */}
        <svg
          viewBox={`0 0 ${PERFIL_WIDTH} ${PERFIL_HEIGHT}`}
          width="100%"
          height="100%"
          style={{ position: "absolute", left: 0, top: 0 }}
        >
          {perfilPath?.closedPath && (
            <path d={perfilPath.closedPath} fill="#000000c1" stroke="none" />
          )}
          {perfilPath?.strokePath && (
            <path
              d={perfilPath.strokePath}
              fill="none"
              stroke="#000000ff"
              strokeWidth={2}
            />
          )}
        </svg>

        {/* Overlay HTML */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: PERFIL_WIDTH,
            height: PERFIL_HEIGHT,
            pointerEvents: "none",
          }}
        >
          {pointPositions.map((p) => {
            const labelY = Math.max(p.yPx - LABEL_OFFSET_PX, 0);
            const textWidth = Math.min(200, p.n.length * 10);
            const rectLeft = Math.min(
              Math.max(p.xPx - textWidth / 2, 0),
              PERFIL_WIDTH - textWidth
            );

            return (
              <div key={p.idpt || p.n} style={{ position: "absolute" }}>
                {/* línea */}
                <div
                  style={{
                    position: "absolute",
                    left: `${p.xPx}px`,
                    top: `${p.yPx - 100}px`,
                    width: 3,
                    height: `${PERFIL_HEIGHT - p.yPx + 110}px`,
                    background: "#e80b28",
                    transform: "translateX(-1px)",
                  }}
                />
                {/* etiqueta */}
                <div
                  style={{
                    position: "absolute",
                    left: `${p.xPx}px`,
                    top: `${p.yPx -100}px`,
                    height: "34px",
                    width: `fit-content`,
                    paddingLeft: "10px",
                    paddingRight: "10px",
                    background: "#e80b28",
                    borderRadius: 3,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 999,
                  }}
                >
                  <span
                    style={{
                      color: "white",
                      fontWeight: "700",
                      fontSize: 30,
                      fontFamily: "Medium, sans-serif",
                      whiteSpace: "nowrap",
                      pointerEvents: "none",
                    }}
                  >
                    {p.n}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    height: "800px",
    width: "1600px",
    position: "absolute",
    marginLeft: "170px",
    marginTop: "150px",
  },
  title_container: {
    width: "fit-content",
    height: "60px",
    backgroundColor: "#e80b28",
    marginLeft: "163px",
    marginTop: "10px",
    display: "flex",
    alignItems: "center",
    marginRight: "40px",
    paddingRight: "20px",
  },
  title: {
    fontFamily: "Medium, sans-serif",
    fontSize: "60px",
    color: "#ffffff",
    marginLeft: "10px",
    marginTop: "2px",
  },
  subtitle_container: {
    width: "fit-content",
    height: "60px",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    marginLeft: "250px",
    marginTop: "7px",
    display: "flex",
    alignItems: "center",
    paddingRight: "20px",
  },
  subtitle: {
    fontFamily: "Medium, sans-serif",
    fontSize: "60px",
    color: "#ffffff",
    marginLeft: "22px",
  },
  perfilContainer: {
    marginLeft: "170px",
    marginTop: "190px",
    width: `${PERFIL_WIDTH}px`,
    height: `${PERFIL_HEIGHT}px`,
    padding: "10px",
    borderRadius: "12px",
    position: "relative",
    backgroundColor: "rgba(0, 0, 0, 0)",
  },
};

export default Cursa;
