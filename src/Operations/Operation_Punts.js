import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { useWebSocketData } from "../WebSocketProvider";


const Operation_Punts = () => {
  const [autoShowClas, setAutoShowClas] = useState(false);
  const [liveTabStyle, setLiveTabStyle] = useState(styles.liveTab);
  const [activePointIndex, setActivePointIndex] = useState("0");
  const [showVelo, setShowVelo] = useState(false);
  

  const { rawData } = useWebSocketData();
  const curses = rawData?.data_all?.curses || {};
  const allRaceDetails = rawData?.data_all?.raceDetails || [];
  const currentRaceId = rawData?.current_race ? curses[rawData.current_race]?.id : null;
  const currentRace = allRaceDetails.find((r) => r.id === currentRaceId);
  const trackGpx = rawData?.data_all?.curses[rawData?.current_race]?.track;
  const currentRacePoints = currentRace?.points || [];


  const socket = io("http://localhost:10011");

  useEffect(() => {
    // Manejar la conexión y emitir eventos cuando sea necesario
    socket.on("connect", () => {
      console.log("Conectado al servidor de Socket.IO");
    });

    socket.on("connect_error", (err) => {
      console.error("Error de conexión con el servidor de Socket.IO:", err.message);
    });


    // Limpiar la conexión al desmontar el componente
    return () => {
      socket.disconnect();
    };
  }, []);

    const setAutoShowClasButton = () => setAutoShowClas(!autoShowClas);

    const showVeloButton = (bool) => {
      setShowVelo(bool);
      // Emitir el cambio en la velocidad
      if (bool) {
        socket.emit("dataInfoPunt", {
          currentRace: currentRace,
          currentPoint: currentRacePoints[activePointIndex]
        });
        socket.emit("showInfoPuntOn", true); // Emitir datos para activar la velocidad
      } else {
        socket.emit("showInfoPuntOff", false); // Emitir datos para desactivar la velocidad
      }
    };

    return (
    <div style={styles.clas_container}>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          padding: "10px",
          alignContent: "center",
          alignItems: "center",
        }}
      >
        <h2 style={{ justifyContent: "flex-start" }}>CONTROLS</h2>
        <label>
          <input
            type="checkbox"
            style={{ marginLeft: "10px" }}
            checked={autoShowClas}
            onChange={setAutoShowClasButton}
          />
        </label>
        <div style={liveTabStyle}>LIVE</div>
        <div style={{ display: "flex", padding: "10px" }}>
        <div>
        {/* Combo visible solo en tabs de puntos */}
        <div style={styles.comboContainer}>
          <label style={{ marginRight: "10px", fontWeight: "bold" }}>
            Selecciona punt de control:
          </label>
          <select
            style={styles.select}
            value={activePointIndex}
            onChange={(e) => setActivePointIndex(Number(e.target.value))} // guarda índice
          >
            {currentRacePoints && currentRacePoints.length > 0 ? (
              currentRacePoints.map((punto, index) => (
                <option key={punto.idpt} value={index}> {/* value = índice */}
                  {punto.n
                    ? `${punto.n} (${parseFloat(punto.km).toFixed(2)} km)`
                    : `Punt ${punto.idpt}`}
                </option>
              ))
            ) : (
              <option value="">No hi ha punts disponibles</option>
            )}
          </select>
        </div>

      </div>
        <div
          style={styles.inTab}
          onClick={() => showVeloButton(true)}
          className="button-in"
        >
          IN
        </div>
        <div
          style={styles.outTab}
          onClick={() => showVeloButton(false)}
          className="button-out"
        >
          OUT
        </div>
      </div>
    </div>
    </div>
  );
};

const styles = {
  container: {
    marginLeft: "10px",
    display: "flex",
    backgroundColor: "#2c313c",
    color: "#fff",
    fontFamily: "Arial, sans-serif",
    padding: "20px",
    height: "900px",
    width: "1250px",
  },
  clas_container: {
    height: "90px",
    width: "600px",
    backgroundColor: "#272c36",
    marginLeft: '10px',
    marginTop: '10px'
  },
  tab: {
    cursor: "pointer",
    padding: "10px",
    backgroundColor: "#444",
    color: "#fff",
    textAlign: "center",
    borderRadius: "5px",
    width: "33%",
  },
  activeTab: {
    cursor: "pointer",
    padding: "10px",
    backgroundColor: "#3b68ff",
    color: "#fff",
    textAlign: "center",
    borderRadius: "5px",
    width: "33%",
  },
  inTab: {
    cursor: "pointer",
    fontWeight: "bold",
    padding: "10px",
    backgroundColor: "#02cb48",
    color: "#fff",
    textAlign: "center",
    borderRadius: "5px",
    width: "33%",
    height: "70%",
    transition: "background-color 0.3s, transform 0.3s",
  },
  outTab: {
    cursor: "pointer",
    fontWeight: "bold",
    padding: "10px",
    backgroundColor: "#fa3b48",
    color: "#fff",
    textAlign: "center",
    borderRadius: "5px",
    width: "33%",
    height: "70%",
    transition: "background-color 0.3s, transform 0.3s",
  },
  liveTab: {
    cursor: "pointer",
    fontWeight: "bold",
    padding: "10px",
    backgroundColor: "#fab300",
    color: "#fff",
    textAlign: "center",
    borderRadius: "5px",
    width: "33%",
    height: "70%",
    marginLeft: "70px",
    marginRight: "70px",
    opacity: 0,
    transition: "opacity 0.3s ease",
  },
};

export default Operation_Punts;
