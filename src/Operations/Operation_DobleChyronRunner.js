import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";

const Operation_ChyronRunner = () => {
  const [runners, setRunners] = useState([
    { position: null, customValue: "", data: [] },
    { position: null, customValue: "", data: [] },
  ]);

  const [showPerfil, setShowPerfil] = useState(false);
  const [liveTabStyle, setLiveTabStyle] = useState(styles.liveTab);

  const socket = io("http://localhost:10011");

  useEffect(() => {
    socket.on("connect", () => {
      console.log("Conectado al servidor de Socket.IO");
    });

    socket.on("connect_error", (err) => {
      console.error("Error de conexión con el servidor de Socket.IO:", err.message);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const showPerfilButton = (bool) => {
    setLiveTabStyle({ ...styles.liveTab, opacity: bool ? 1 : 0 });
    setShowPerfil(bool);

    if (bool) {
      socket.emit("dataDobleChyronRunner", runners);
      socket.emit("showDobleChyronRunnerOn", true);
    } else {
      socket.emit("showDobleChyronRunnerOff", false);
    }
  };

  const handleButtonClick = (index, num) => {
    const updated = [...runners];
    updated[index].position = num;
    updated[index].customValue = "";
    setRunners(updated);
    socket.emit("positionChyronRunner", num);
  };

  const handleInputChange = (index, e) => {
    const value = parseInt(e.target.value, 10);
    const updated = [...runners];
    if (!isNaN(value)) {
      updated[index].position = value;
      updated[index].customValue = value;
      socket.emit("positionChyronRunner", value);
    } else {
      updated[index].position = null;
      updated[index].customValue = "";
    }
    setRunners(updated);
  };

  const handleTake = (index) => {
    const savedData = localStorage.getItem("runnerSelected");
    const runnerSelected = savedData ? JSON.parse(savedData) : null;
    const updated = [...runners];
    updated[index].data = runnerSelected;
    setRunners(updated);
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
          marginTop: "10px",
        }}
      >
        <h2 style={{ justifyContent: "flex-start" }}>CHYRON RUNNER</h2>
        <label>
          <input type="checkbox" style={{ marginLeft: "10px" }} />
        </label>
        <div style={liveTabStyle}>LIVE</div>
        <div style={styles.inTab} onClick={() => showPerfilButton(true)} className="button-in">
          IN
        </div>
        <div style={styles.outTab} onClick={() => showPerfilButton(false)} className="button-out">
          OUT
        </div>
      </div>

        {runners.map((runner, index) => (
        <div key={index} style={{ marginBottom: "15px" }}>
            {/* Bloque de botones e input */}
            <div
            style={{
                backgroundColor: index === 0 ? "blue" : "orange",
                display: "flex",
                gap: "10px",
                marginTop: "10px",
                marginLeft: "10px",
                alignItems: "center",
                padding: "5px",
                borderRadius: "5px",
            }}
            >
            {index === 0 ? "LEFT:" : "RIGHT:"}

            <button
                onClick={() => handleTake(index)}
                style={{
                width: "70px",
                height: "30px",
                fontSize: "20px",
                borderRadius: "2px",
                cursor: "pointer",
                }}
            >
                TAKE
            </button>

            <div style={{ fontSize: "20px" }}>Select position:</div>

            {[1, 2, 3, 4, 5].map((num) => (
                <button
                key={num}
                onClick={() => handleButtonClick(index, num)}
                style={{
                    width: "30px",
                    height: "30px",
                    fontSize: "20px",
                    backgroundColor: runner.position === num ? "#00cb7a" : "#eee",
                    color: runner.position === num ? "#fff" : "#000",
                    border: "1px solid #ccc",
                    borderRadius: "2px",
                    cursor: "pointer",
                }}
                >
                {num}
                </button>
            ))}

            <input
                type="number"
                placeholder=" "
                value={runner.customValue}
                onChange={(e) => handleInputChange(index, e)}
                style={{
                width: "60px",
                height: "26px",
                fontSize: "20px",
                border: "1px solid #ccc",
                borderRadius: "6px",
                backgroundColor: runner.position > 5 ? "#00cb7a" : "#fff",
                color: runner.position > 3 ? "#fff" : "#000",
                }}
            />
            </div>

            {/* Mostrar datos debajo */}
            <div style={{ fontSize: "25px", marginLeft: "10px", marginTop: "5px" }}>
            {runner.position}-{runner.data?.atleta}-{runner.data?.tipus}
            </div>
        </div>
        ))}

    </div>
  );
};

const styles = {
  clas_container: {
    height: "320px",
    width: "650px",
    backgroundColor: "#272c36",
    marginLeft: "10px",
    padding: "10px",
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
    marginLeft: "10px",
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
    marginLeft: "10px",
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
