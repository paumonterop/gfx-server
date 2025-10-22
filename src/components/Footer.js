import React, { useState, useEffect } from 'react';
import './Footer.css';

// Cronometro que inicia a las 6:30 cada día
const CronometreUltra = () => {
    const [hora, setHora] = useState('00h00\'00\'\'');
    const [isRunning, setIsRunning] = useState(false); // Controla cuándo debe comenzar el cronómetro

    // Función para obtener el tiempo actual formateado en HHhMM'MM''
    function obtenerTiempoFormateado(segundos) {
      const horas = Math.floor(segundos / 3600);
      const minutos = Math.floor((segundos % 3600) / 60);
      const seg = segundos % 60;
  
      const horasFormateadas = horas < 10 ? "0" + horas : horas;
      const minutosFormateados = minutos < 10 ? "0" + minutos : minutos;
      const segundosFormateados = seg < 10 ? "0" + seg : seg;
  
      return `${horasFormateadas}h${minutosFormateados}'${segundosFormateados}''`;
    }
  
    useEffect(() => {
      const iniciarCronometro = () => {
        const ahora = new Date();
        const horaInicio = 5;
        const minutoInicio = 30;
  
        // Crear la fecha de hoy a las 6:30
        const inicioHoy = new Date(
          ahora.getFullYear(),
          ahora.getMonth(),
          ahora.getDate(),
          horaInicio,
          minutoInicio,
          0
        );
  
        if (ahora >= inicioHoy) {
          setIsRunning(true);
          const segundosTranscurridos = Math.floor((ahora - inicioHoy) / 1000);
          setHora(obtenerTiempoFormateado(segundosTranscurridos));
        } else {
          // Si no es la hora aún, calcular el tiempo restante para las 6:30
          const msRestantes = inicioHoy - ahora;
          setTimeout(() => setIsRunning(true), msRestantes);
        }
      };
  
      iniciarCronometro();
  
      let intervalo;
      if (isRunning) {
        intervalo = setInterval(() => {
          setHora((prevHora) => {
            const [horas, minutos, segundos] = prevHora.match(/\d+/g).map(Number);
            const totalSegundos = horas * 3600 + minutos * 60 + segundos + 1;
            return obtenerTiempoFormateado(totalSegundos);
          });
        }, 1000);
      }
  
      return () => clearInterval(intervalo); // Limpiar el intervalo cuando el componente se desmonte
    }, [isRunning]);
  
    return (
      <div>
        <p>{hora}</p>
      </div>
    );
  };



  const Footer = ({ show = false, data}) => {
    const [participants, setParticipants] = useState([]);
    const [isVisible, setIsVisible] = useState(show);
  
    // Fetch de los datos de los participantes
    const fetchData = async () => {
      try {
        const response = await fetch(
          "https://www.9hsports.cat/api/cursa/classificacio_sub_cursa/1983/0"
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
  
        const participantsOrdenados = result.classificacio
          .sort((a, b) => a.posicio_general_cursa - b.posicio_general_cursa) // Ordenar por posición
          .map((participant) => ({
            posicio: participant.posicio_general_cursa || "-",
            atleta: `${participant.nom?.[0]?.toUpperCase() || ""}. ${participant.cognoms?.split(" ")[0] || "-"}`, // Inicial del nombre y primer apellido
            temps: participant.temps_arribada || "-",
          }));
  
        setParticipants(participantsOrdenados);
      } catch (err) {
        console.error("Error al obtener los datos:", err.message);
      }
    };
  
    useEffect(() => {
      // Llamar a fetchData al montar el componente
      fetchData();
  
      // Crear un intervalo que se ejecute cada 10 segundos
      const intervalId = setInterval(fetchData, 10000);
  
      // Limpiar el intervalo cuando el componente se desmonte
      return () => clearInterval(intervalId);
    }, []);
  
    useEffect(() => {
      if (show) {
        setIsVisible(true);
      } else {
        // Retardo de 1 segundo antes de ocultar el componente
        const timeoutId = setTimeout(() => {
          setIsVisible(false);
        }, 1000);
  
        return () => clearTimeout(timeoutId);
      }
    }, [show]);
  
    return (
      isVisible && (
        <div className="footer-container">
          <div>
            <div
              className="footer-rect-hora"
              style={{
                animation: `${show ? `slideRightFoot 0.7s ease-in-out forwards` : `slideDownFoot 0.7s ease-in-out forwards`}`,
              }}
            >
              <div className="footer-rect-hora-text">
                {/*<CronometreUltra />*/}
              </div>
            </div>
            <div
              className="footer-rect-left"
              style={{
                animation: `${show ? `slideRightFoot2 0.7s ease-in-out forwards` : `slideDownFoot2 0.7s ease-in-out forwards`}`,
              }}
            ></div>
            <div
              className="footer-rect-black"
              style={{
                animation: `${show ? `slideRightFoot3 0.7s ease-in-out forwards` : `slideDownFoot 0.7s ease-in-out forwards`}`,
              }}
            >
              <div className="ticker" style={{ animation: `moveTicker 1000s linear infinite` }}>
                {participants.map((item, index) => (
                  <div key={index} className="ticker-item">
                    <span className="text-light">{item.posicio}</span>
                    <span className="text-bold">{item.atleta}</span>
                    <span className="text-light">{item.temps}</span>
                    <span className="text-barra">|</span>
                  </div>
                ))}
              </div>
            </div>
            {/*<div
              className="footer-rect-right"
              style={{
                animation: `${show ? `slideRightFoot2 0.7s ease-in-out forwards` : `slideDownFoot2 0.7s ease-in-out forwards`}`,
              }}
            ></div>
            <div
              className="footer-rect-black-left"
              style={{
                animation: `${show ? `slideRightFoot4 0.7s ease-in-out forwards` : `slideDownFoot 0.7s ease-in-out forwards`}`,
                opacity: 0,
              }}
            ></div>*/}
          </div>
        </div>
      )
    );
  };
  
  export default Footer;
  