import React, { useState, useEffect } from "react";
import "./Perfil.css";
import { useWebSocketData } from "../WebSocketProvider";
import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

const Perfil = ({ show }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { rawData } = useWebSocketData();
  const trackGpx = rawData?.data_all?.curses[rawData?.current_race]?.track;
  const [loadedTrack, setLoadedTrack] = useState(null); // para no recargar cada segundo

    useEffect(() => {
        if (show) {
        setIsVisible(true);
        } else {
        // Delay of 1 second before hiding the component
        const timeoutId = setTimeout(() => {
            setIsVisible(false);
        }, 1000); // 1 second delay for exit animation

        return () => clearTimeout(timeoutId); // Cleanup timeout on unmount or show change
        }
        console.log(data)

    }, [show]);

  useEffect(() => {
    if (!trackGpx || trackGpx === loadedTrack) return;

    setLoadedTrack(trackGpx);
    setLoading(true);
    setError("");
    setData([]);

    console.log("Carregant GPX:", trackGpx);

    fetch("/" + trackGpx)
      .then((res) => {
        if (!res.ok) throw new Error("Fitxer no trobat a /public/" + trackGpx);
        return res.text();
      })
      .then((xmlString) => parseGPX(xmlString))
      .catch((err) => {
        console.error("Error carregant GPX:", err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [trackGpx, loadedTrack]);

  const parseGPX = (xmlString) => {
    try {
      const parser = new DOMParser();
      const xml = parser.parseFromString(xmlString, "application/xml");
      const points = Array.from(xml.getElementsByTagName("trkpt")).map((pt) => ({
        lat: parseFloat(pt.getAttribute("lat")),
        lon: parseFloat(pt.getAttribute("lon")),
        ele: parseFloat(pt.getElementsByTagName("ele")[0]?.textContent || 0),
      }));

      console.log("Punts GPX llegits:", points.length);

      if (points.length === 0) {
        setError("El GPX no conté punts de track vàlids.");
        return;
      }

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

      console.log("Punts per mostrar:", perfil.length);
      setData(perfil);
    } catch (e) {
      console.error("Error processant GPX:", e);
      setError("Error processant GPX: " + e.message);
    }
  };

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


  return (
    isVisible && (
    <div className="perfil-container">
      {data.length > 0 && !loading && !error && (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <YAxis hide={true} domain={['dataMin', 'dataMax']} />
          <Area
            type="monotone"
            dataKey="ele"
            stroke="#000000"
            fill="#000000ff"
            fillOpacity={0.3}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
      )}
    </div>
    )
  );
};

export default Perfil;
