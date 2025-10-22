import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";

const Operation_ChyronRunner = () => {
  const [position, setPosition] = useState('');
  const [showPerfil, setShowPerfil] = useState(false);
  const [liveTabStyle, setLiveTabStyle] = useState(styles.liveTab);
  const [customValue, setCustomValue] = useState('');


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
    const updatedStyle = { ...styles.liveTab, opacity: bool ? 1 : 0 };
    setLiveTabStyle(updatedStyle);
    setShowPerfil(bool);
    // Emitir el cambio en la velocidad
    if (bool) {
      socket.emit("showChyronRunnerOn", true); // Emitir datos para activar la velocidad
    } else {
      socket.emit("showChyronRunnerOff", false); // Emitir datos para desactivar la velocidad
    }
  };



  const handleInputChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      setCustomValue(value);
      setPosition(value);
      socket.emit("positionChyronRunner", value);
    } else {
      setCustomValue('');
      setPosition(null);
    }
  };
  
  const handleButtonClick = (num) => {
    setPosition(num);
    setCustomValue('');
    socket.emit("positionChyronRunner", num);

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
        <h2 style={{ justifyContent: "flex-start" }}>CHYRON RUNNER</h2>
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

      <div style={{ display: 'flex', gap: '10px', marginTop: '-15px', marginLeft:'10px'}}>
      <div style={{fontSize: '20px'}}>Select position:</div>
      {[1, 2, 3, 4, 5].map((num) => (
        <button
          key={num}
          onClick={() => handleButtonClick(num)}
          style={{
            alignItems: "flex-start",
            justifyContent: 'center',
            fontFamily: 'Bold',
            width:'30px',
            height: '30px',
            fontSize: '20px',
            backgroundColor: position === num ? '#00cb7a' : '#eee',
            color: position === num ? '#fff' : '#000',
            border: '1px solid #ccc',
            borderRadius: '2px',
            cursor: 'pointer',
          }}
        >
          {num}
        </button>
      ))}

      <input
        type="number"
        placeholder=" "
        value={customValue}
        onChange={handleInputChange}
        style={{
          width:'60px',
          height: '26px',          
          fontSize: '20px',
          border: '1px solid #ccc',
          borderRadius: '6px',
          backgroundColor: position > 5 ? '#00cb7a' : '#fff',
          color: position > 3 ? '#fff' : '#000',
        }}
      />
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
    height: "150px",
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

export default Operation_ChyronRunner;
