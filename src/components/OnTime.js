import React, { useState, useEffect } from 'react';
import './OnTime.css';
import { useWebSocketData } from "../WebSocketProvider";

const OnTime = ({ data, show, showDifferenceUp }) => {
  const [isVisible, setIsVisible] = useState(show);
  const [elapsedTime, setElapsedTime] = useState('');

  const { rawData } = useWebSocketData();
  const curses = rawData?.data_all?.curses || {};
  const allRaceDetails = rawData?.data_all?.raceDetails || [];
  const currentRaceId = rawData?.current_race ? curses[rawData.current_race]?.id : null;
  const currentRace = allRaceDetails?.find((r) => r.id === currentRaceId);

  // ✅ Extrae solo la hora de inicio
  const hora_inici = currentRace?.startInfo?.dtdep?.split(" ")[1] || "";

  const getStartTime = () => {
    if (!hora_inici) return new Date(); // fallback por seguridad

    const today = new Date();
    const [h, m, s] = hora_inici.split(':').map(Number);

    const start = new Date(today);
    start.setHours(h);
    start.setMinutes(m);
    start.setSeconds(s);

    return start;
  };

  const calculateElapsedTime = () => {
    const now = new Date();
    const start = getStartTime();
    const diff = now - start;

    if (diff < 0) {
      setElapsedTime(`00h00'00''`);
      return;
    }

    const hours = String(Math.floor(diff / 3600000)).padStart(2, '0');
    const minutes = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
    const seconds = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
    setElapsedTime(`${hours}h${minutes}'${seconds}''`);
  };

  useEffect(() => {
    let intervalId;

    if (show) {
      setIsVisible(true);
      calculateElapsedTime();
      intervalId = setInterval(calculateElapsedTime, 1000);
    } else {
      const timeoutId = setTimeout(() => setIsVisible(false), 1000);
      return () => clearTimeout(timeoutId);
    }

    return () => clearInterval(intervalId);
  }, [show, hora_inici]);

  return (
    isVisible && (
      <div
        className="on-time-container"
          style={{
            transform: showDifferenceUp ? 'translateY(0)' : 'translateY(110px)', // posición inicial correcta
            animation: `${
              showDifferenceUp
                ? 'slideDownOnTime 0.3s ease-in-out forwards'
                : 'slideUpOnTime 0.8s ease-in-out 2.5s forwards'
            }`,
          }}
      >
        <div
          className="circle"
          style={{
            animation: `${
              show
                ? 'slideLeftOnTime 0.8s ease-in-out forwards'
                : 'slideRightOnTime 0.8s ease-out forwards'
            }`,
          }}
        >
          <img src="/icons/crono.png" alt="crono" className="on-time-icon" />
        </div>
        <div
          className="on-time-rect"
          style={{
            animation: `${
              show
                ? 'slideLeftOnTime 0.8s ease-in-out forwards'
                : 'slideRightOnTime 0.8s ease-out forwards'
            }`,
          }}
        >
          <div className="on-time-text">{elapsedTime}</div>
        </div>
      </div>
    )
  );
};

export default OnTime;
