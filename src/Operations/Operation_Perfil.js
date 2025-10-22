import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";

const Operation_Perfil = () => {
  const [selectedMotx, setSelectedMotx] = useState('');
  const [showPerfil, setShowPerfil] = useState(false);
  const [liveTabStyle, setLiveTabStyle] = useState(styles.liveTab);

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

  const showPerfilButton = (bool) => {
    setShowPerfil(bool);
    // Emitir el cambio en la velocidad
    if (bool) {
      socket.emit("showPerfilOn", true); // Emitir datos para activar la velocidad
    } else {
      socket.emit("showPerfilOff", false); // Emitir datos para desactivar la velocidad
    }
  };

  const selectedMotxFunction = (event) => {
    const key = event.target.value;
    setSelectedMotx(key);
    // Emitir el dato seleccionado a través de Socket.IO
    socket.emit("dataPerfil", key);
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
          marginTop: '10px',
        }}
      >
        <h2 style={{ justifyContent: "flex-start" }}>PERFIL</h2>
        <label>
          <input
            type="checkbox"
            style={{ marginLeft: "10px" }}
            //checked={}
            //onChange={}
          />
        </label>
        <div style={liveTabStyle}>LIVE</div>
        <div style={{ display: "flex", padding: "10px" }}>
        <div>
          <select style={{fontSize: '28px'}}
            id="comboBox"
            value={selectedMotx}
            onChange={selectedMotxFunction}
          >
            <option value="motx1">BBX 01</option>
            <option value="motx2">BBX 02</option>
            <option value="motx3">BBX 03</option>
            <option value="motx4">BBX 04</option>
            <option value="motx5">BBX 05</option>
            <option value="motx6">BBX 06</option>
            <option value="motx7">BBX 07</option>
            <option value="motx8">BBX 08</option>
            <option value="motx9">BBX 09</option>
            <option value="motx10">BBX 10</option>          
            <option value="motx11">BBX 11</option>
          </select>
        </div>
      </div>
        <div
          style={styles.inTab}
          onClick={() => showPerfilButton(true)}
          className="button-in"
        >
          IN
        </div>
        <div
          style={styles.outTab}
          onClick={() => showPerfilButton(false)}
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
    marginLeft: '10px'

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

export default Operation_Perfil;
