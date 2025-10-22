import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { useWebSocketData } from "../WebSocketProvider";




const Operation_Cursa = () => {
    const [autoShowClas, setAutoShowClas] = useState(false);
    const [liveTabStyle, setLiveTabStyle] = useState(styles.liveTab);

    const { rawData } = useWebSocketData();
    const curses = rawData?.data_all?.curses || {};
    const allRaceDetails = rawData?.data_all?.raceDetails || [];
    const currentRaceId = rawData?.current_race ? curses[rawData.current_race]?.id : null;
    const currentRace = allRaceDetails.find((r) => r.id === currentRaceId);
    const trackGpx = rawData?.data_all?.curses[rawData?.current_race]?.track;
    //console.log(currentRace?.title)
    //console.log(currentRace?.startInfo?.dtdep)
    //const hora_inici = currentRace?.startInfo?.dtdep?.split(" ")[1] || ""; 

  
    const setAutoShowClasButton = () => {
      setAutoShowClas(!autoShowClas);
      };
  
    const showClasButton = (bool) => {
      const updatedStyle = { ...styles.liveTab, opacity: bool ? 1 : 0 };
      setLiveTabStyle(updatedStyle);
      // Crear conexión con el servidor de Socket.IO
      const socket = io("http://localhost:10011");
      
      // Manejar la conexión y enviar los datos
      socket.on("connect", () => {
        console.log("Conectado al servidor de Socket.IO - SHOW CLAS PROV");
        if (bool) {
          const currentRaceWithTrack = {
            ...currentRace,   // copia todos los campos existentes de currentRace
            track: trackGpx   // añade la propiedad track
          };
          socket.emit("dataCursa", currentRaceWithTrack);
          socket.emit("showCursaOn", true); // Emitir los datos formateados
        } else {
          socket.emit("showCursaOff", false); // Emitir los datos formateados
        }
      });
    
      // Manejar errores de conexión
      socket.on("connect_error", (err) => {
        console.error("Error de conexión con el servidor de Socket.IO:", err.message);
      });
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
            <h2 style={{ justifyContent: "flex-start" }}>CURSA_INFO</h2>
            <label>
              <input
                type="checkbox"
                style={{ marginLeft: "10px" }}
                checked={autoShowClas}
                onChange={setAutoShowClasButton}
              />
            </label>

            <div style={liveTabStyle}>LIVE</div>
            <div
              style={styles.inTab}
              onClick={() => showClasButton(true)}
              className="button-in"
            >
              IN
            </div>
            <div
              style={styles.outTab}
              onClick={() => showClasButton(false)}
              className="button-out"
            >
              OUT
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
  
  export default Operation_Cursa;