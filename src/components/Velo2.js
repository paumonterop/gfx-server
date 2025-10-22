import React, { useState, useEffect, useRef } from "react";
import "./Velo2.css";
import { useWebSocketData } from "../WebSocketProvider";
import { BBX_MAP } from "../global";


const Velo2 = ({ show, data }) => {
  const { rawData } = useWebSocketData();
  const animationClass = show ? "fadeInText" : "fadeOutText";
  const animationBars = show ? "fadeInBars" : "fadeOutBars";
  const [isVisible, setIsVisible] = useState(show);
  const [speed, setSpeed] = useState(0);
  const [animatedBars, setAnimatedBars] = useState(0);
  const maxSpeed = 18;
  const totalBars = 40;
  console.log(data)

  const buffer = [];
  const bufferSize = 5;

  const dataRef = useRef(data);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const updateSpeedKmh = (newSpeed) => {
    if (newSpeed !== undefined && newSpeed !== null) {
      buffer.push(newSpeed);
      if (buffer.length > bufferSize) buffer.shift();
      const averageSpeed =
        buffer.reduce((acc, val) => acc + val, 0) / buffer.length;
      return averageSpeed;
    }
    return 0;
  };

  const interpolateColor = (color1, color2, factor) => {
    const c1 = parseInt(color1.slice(1), 16);
    const c2 = parseInt(color2.slice(1), 16);

    const r1 = (c1 >> 16) & 0xff,
      g1 = (c1 >> 8) & 0xff,
      b1 = c1 & 0xff;
    const r2 = (c2 >> 16) & 0xff,
      g2 = (c2 >> 8) & 0xff,
      b2 = c2 & 0xff;

    const r = Math.round(r1 + (r2 - r1) * factor);
    const g = Math.round(g1 + (g2 - g1) * factor);
    const b = Math.round(b1 + (b2 - b1) * factor);

    return `rgb(${r},${g},${b})`;
  };

  const getColor = (index, totalBars) => {
    const percentage = (index / totalBars) * 100;

    const colors = [
      { stop: 0, color: "#006400" },
      { stop: 30, color: "#008000" },
      { stop: 50, color: "#90ee90" },
      { stop: 70, color: "#ffff00" },
      { stop: 85, color: "#ff8c00" },
      { stop: 100, color: "#ff0000" },
    ];

    for (let i = 0; i < colors.length - 1; i++) {
      const c1 = colors[i];
      const c2 = colors[i + 1];
      if (percentage >= c1.stop && percentage <= c2.stop) {
        const factor = (percentage - c1.stop) / (c2.stop - c1.stop);
        return interpolateColor(c1.color, c2.color, factor);
      }
    }

    return colors[colors.length - 1].color;
  };

  // Calcular velocidad
  useEffect(() => {
    if (!rawData) return;

    const ipAddress = BBX_MAP[dataRef.current];
    const rawData2 = rawData?.data_all?.gps_statistics;

    console.log(ipAddress)
    console.log(rawData)
    console.log(rawData2)

    if (!ipAddress || !rawData2 || !rawData2[ipAddress]) {
      setSpeed(0);
      return;
    }

    const speedKmh = rawData2[ipAddress]?.gps_info?.data?.speed_kmh ?? 0;

    if (speedKmh < 1) {
      setSpeed(0);
    } else {
      const avgSpeed = updateSpeedKmh(speedKmh);
      setSpeed(Number(avgSpeed.toFixed(2)));
    }
  }, [rawData]);

  // Mostrar / ocultar
  useEffect(() => {
    if (show) {
      setIsVisible(true);
    } else {
      const timeoutId = setTimeout(() => setIsVisible(false), 100);
      return () => clearTimeout(timeoutId);
    }
  }, [show]);

  // Animación de barras
  useEffect(() => {
    if (!show) return;

    const timeoutId = setTimeout(() => {
      setAnimatedBars(0);
      const interval = setInterval(() => {
        setAnimatedBars((prev) => {
          if (prev < totalBars) return prev + 1;
          clearInterval(interval);
          return prev;
        });
      }, 15);
      return () => clearInterval(interval);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [show, totalBars]);

  const activeBars = Math.floor((speed / maxSpeed) * totalBars);

  return (
    isVisible && (
      <>
        <div
          style={{
            position: "relative",
            top: "840px",
            left: "1680px",
            width: "200px",
            height: "200px",
            animation: `${
              show
                ? `FadeInVelo 0.7s ease-in-out forwards`
                : `FadeOutVelo 0.7s ease-in-out forwards`
            }`,
          }}
        >
          <svg width="180" height="180" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="90" fill="#333" opacity={0.9} />

            {Array.from({ length: totalBars }).map((_, index) => {
              const angle = (index / totalBars) * 300 - 55;
              const isActive = index < activeBars;
              const isVisibleBar = index < animatedBars;
              const x1 = 100 + 75 * Math.cos((angle * Math.PI) / 180);
              const y1 = 100 + 75 * Math.sin((angle * Math.PI) / 180);
              const x2 = 100 + 85 * Math.cos((angle * Math.PI) / 180);
              const y2 = 100 + 85 * Math.sin((angle * Math.PI) / 180);

              return (
                <line
                  key={index}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={
                    isVisibleBar
                      ? isActive
                        ? getColor(index, totalBars)
                        : "#555"
                      : "none"
                  }
                  opacity={0}
                  strokeWidth="4"
                  className={animationBars}
                />
              );
            })}

            <text
              x="100"
              y="100"
              fill="#fff"
              fontSize="55"
              fontWeight="bold"
              textAnchor="middle"
              dominantBaseline="middle"
              opacity={0}
              className={animationClass}
            >
              {speed <= 1 || speed > 250 ? " " : speed.toFixed(1)}
            </text>

            <text
              x="100"
              y="145"
              fill="#fff"
              fontSize="25"
              textAnchor="middle"
              opacity={0}
              dominantBaseline="middle"
              className={animationClass}
            >
              km/h
            </text>
          </svg>
        </div>

        <div
          className="icon"
          style={{
            position: "absolute",
            top: "830px",
            left: "2px",
            width: "50px",
            height: "50px",
            backgroundImage: `url(/icons/speed.png)`,
            backgroundSize: "contain",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            zIndex: 9999,
            animation: `${
              show
                ? `FadeInVelo 1s ease-in-out forwards`
                : `FadeOutVelo 0.7s ease-in-out forwards`
            }`,
          }}
        />
      </>
    )
  );
};

export default Velo2;
