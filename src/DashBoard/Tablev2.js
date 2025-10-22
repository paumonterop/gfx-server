import React, { useState, useEffect } from "react";
import axios from "axios";
import { useWebSocketData } from "../WebSocketProvider";
import { SERVER_IP } from "../global";
import { height } from "@mui/system";
import { io } from "socket.io-client";


const DarkTable = () => {
  const { rawData } = useWebSocketData();
  const curses = rawData?.data_all?.curses || {};
  const allRaceDetails = rawData?.data_all?.raceDetails || [];

  const [cursaSeleccionada, setCursaSeleccionada] = useState(rawData?.current_race || "");
  const [activeTab, setActiveTab] = useState("men_clas");
  const [selectedRow, setSelectedRow] = useState(null);
  const [activePointIndex, setActivePointIndex] = useState('0');

  const currentRaceId = curses[cursaSeleccionada]?.id;
  const currentRace = allRaceDetails.find((r) => r.id === currentRaceId);
  const currentRacePoints = currentRace?.points || [];

  useEffect(() => {
    if (rawData?.current_race) {
      setCursaSeleccionada(rawData.current_race);
    }
  }, [rawData]);

  const cambiarCursa = async (cursaKey) => {
    try {
      setCursaSeleccionada(cursaKey);
      const res = await axios.post(`http://${SERVER_IP.server_ip2}/api/change_route`, {
        cursa: cursaKey,
      });
      console.log(res.data.message);
    } catch (err) {
      console.error("Error al cambiar cursa:", err.response?.data || err.message);
    }
  };

  const getTabData = (tab, rawData) => {
    if (!rawData || !rawData?.raceClasifications) return [];

    const clasification = rawData?.raceClasifications?.find(
    (r) => r.id === currentRaceId
    ) || {};

    switch (tab) {
      case "men_clas":
        return clasification?.clasification?.final_men?.slice(0, 18) || [];
      case "women_clas":
        return clasification?.clasification?.final_women?.slice(0, 18) || [];
      case "men_head":
        return clasification?.provisional?.provisional_men?.slice(0, 10) || [];
      case "women_head":
        return clasification?.provisional?.provisional_women?.slice(0, 10) || [];
      case "men_points":
        return clasification?.clasification_points?.men[activePointIndex].slice(0, 15) || [];
      case "women_points":
        return clasification?.clasification_points?.women[activePointIndex].slice(0, 15) || [];
      default:
        return [];
    }
  };

// Función para manejar la selección de fila
  const handleRowClick = (row) => {
    setSelectedRow(row); // Guarda la fila seleccionada
    console.log(row)
  
    let dataChyronRunner = {
      class: " ", atleta: " ", dorsal: " ", equip: " ", tipus: " ",
      pais: " ", percent: " ", toFinish: " ", gap: " "
    };
  
    if (row) {
        const temps = row.ecart 
          ? (row.ecart === "00:00:00" ? row.tiempo : row.ecart) 
          : " ";

        dataChyronRunner = {
          class: '',
          atleta: formatNomICognom(row.nombre) || "",
          dorsal: row.doss || "",
          equip: row.club || " ",
          tipus: currentRace?.title,
          temps: formatTimeTour(temps) || "N/A",
          pais: row.pais || 'es',
          gap: '',
        };
    }

    if (Object.keys(dataChyronRunner).length > 0) {
      localStorage.setItem("runnerSelected", JSON.stringify(dataChyronRunner));
    }
  
    const socket = io("http://localhost:10011");
  
    socket.on("connect", () => {
      console.log("Conectado al servidor de Socket.IO");
      socket.emit("dataChyronRunner", dataChyronRunner);
    });
  
    socket.on("connect_error", (err) => {
      console.error("Error de conexión con el servidor de Socket.IO:", err.message);
    });
  };

  const timeToSeconds = (time) => {
    if (!time) return 0;
    const [h, m, s] = time.split(":").map(Number);
    return h * 3600 + m * 60 + s;
  };

  const formatTimeTour = (time) => {
    if (!time) return "";
    const [hours, minutes, seconds] = time.split(':').map(Number);

    // Si todo es cero, no mostrar nada
    if (hours === 0 && minutes === 0 && seconds === 0) return '';

    const formattedHours = String(hours).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(seconds).padStart(2, '0');

    // Si horas y minutos son 0, solo mostrar segundos
    if (hours === 0 && minutes === 0) {
      return `${formattedSeconds}''`;
    }

    // Si horas son 0, omitirlas
    if (hours === 0) {
      return `${formattedMinutes}'${formattedSeconds}''`;
    }

    // Si hay horas, mostrar todo
    return `${formattedHours}h${formattedMinutes}'${formattedSeconds}''`;
  };

  const secondsToTime = (seconds) => {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

  const formatNomICognom = (nombre) => {
    if (!nombre) return "";
    
    const parts = nombre.trim().split(/\s+/);
    if (parts.length === 0) return "";
    
    // Tomar el primer nombre y el primer apellido (si existe)
    const firstName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
    const firstSurname = parts[1] 
      ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1).toLowerCase() 
      : "";

    return `${firstName} ${firstSurname}`.trim();
  };

  return (
    <div style={styles.cont}>
    <div style={styles.container}>
        {/* Botones de selección de carrera */}
        {Object.keys(curses).length > 0 ? (
        Object.entries(curses).map(([key, c]) => (
            <button
            key={key}
            onClick={() => cambiarCursa(key)}
            style={{
                fontSize: "20px",
                fontWeight: "bold",
                backgroundColor: cursaSeleccionada === key ? "#3b68ff" : "",
                margin: "5px",
            }}
            >
            {c.cursa}
            </button>
        ))
        ) : (
        <p>Carregant curses...</p>
        )}

      {/* Tabs */}
      <div style={styles.tabsContainer}>
        {[
          { id: "men_clas", label: "MEN CLASIFICATION" },
          { id: "women_clas", label: "WOMEN CLASIFICATION" },
          { id: "men_head", label: "MEN HEAD" },
          { id: "women_head", label: "WOMEN HEAD" },
          { id: "men_points", label: "MEN HEAD POINTS" },
          { id: "women_points", label: "WOMEN HEAD POINTS" },
        ].map((tab) => (
          <div
            key={tab.id}
            style={activeTab === tab.id ? styles.activeTab : styles.tab}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </div>
        ))}
      </div>

    {/* Combo box visible solo en men_points / women_points */}
    {(activeTab === "men_points" || activeTab === "women_points") && (
    <div style={styles.comboContainer}>
        <label style={{ marginRight: "10px", fontWeight: "bold" }}>
        Selecciona punt de control:
        </label>
        <select
        style={styles.select}
        value={activePointIndex} // ahora guarda el idpt
        onChange={(e) => setActivePointIndex(e.target.value)} // guardamos el idpt seleccionado
        >
        {currentRacePoints && currentRacePoints.length > 0 ? (
            currentRacePoints.map((punto) => (
            <option key={punto.idpt} value={punto.idpt}>
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
    )}

      {/* Tabla */}
      <div style={styles.tabsContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.headerRow}>
              <th style={styles.firstColumn}>POS</th>
              <th>DORSAL</th>
              <th>NOM</th>
              <th>COGNOMS</th>
              <th>CLUB</th>
              <th>PAIS</th>
              <th>TEMPS</th>
              <th style={styles.lastColumn}>GAP</th>
            </tr>
          </thead>
          <tbody>
            {getTabData(activeTab, rawData?.data_all).map((row, index, arr) => {
              const firstTime = arr[0]?.timepo ? timeToSeconds(arr[0].timepo) : 0;
              const rowTime = row.tiempo ? timeToSeconds(row.tiempo) : 0;
              const gap = rowTime - firstTime;

              return (
                <tr
                  key={index}
                  onClick={() => handleRowClick(row)}
                  style={
                    selectedRow === row
                      ? { ...styles.row, ...styles.selectedRow }
                      : styles.row
                  }
                >
                  <td>{index + 1}</td>
                  <td>{row.doss || "-"}</td>
                  <td>{row.nombre?.split(" ")[0] || "-"}</td>
                  <td>{row.nombre?.split(" ").slice(1).join(" ") || "-"}</td>
                  <td>{row.club || "-"}</td>
                  <td>{row.nacio || "-"}</td>
                  <td>{row.tiempo || row.tps || "-"}</td>
                  <td>{row.ecart || secondsToTime(gap) || "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
};

// Estilos
const styles = {

  cont:{
    width: "1000px",
    height: "1000px"
  },

  container: {
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#282c34",
    color: "#fff",
    fontFamily: "Arial, sans-serif",
    padding: "20px",
    width: "900px",
    height: "100%"
  },
  comboContainer: {
    margin: "10px 0",
    display: "flex",
    alignItems: "center",
  },
  select: {
    padding: "8px",
    fontSize: "16px",
    backgroundColor: "#444",
    color: "#fff",
    borderRadius: "6px",
    border: "1px solid #666",
  },
  tabsContainer: {
    display: "flex",
    flexWrap: "wrap",
    marginBottom: "10px",
  },
  tab: {
    cursor: "pointer",
    padding: "10px",
    backgroundColor: "#444",
    color: "#fff",
    borderRadius: "5px",
    margin: "5px",
  },
  activeTab: {
    cursor: "pointer",
    padding: "10px",
    backgroundColor: "#3b68ff",
    color: "#fff",
    borderRadius: "5px",
    margin: "5px",
  },
  tableContainer: {
  maxHeight: "600px", // 👈 controla el alto del área visible
  overflowY: "auto",  // 👈 activa el scroll vertical
  overflowX: "hidden",
  border: "1px solid #444",
  borderRadius: "6px",
},
table: {
  width: "100%",
  borderCollapse: "collapse",
},
  headerRow: {
    backgroundColor: "#121212",
    color: "#00c756",
    height: "50px",
  },
  row: {
    textAlign: "center",
    borderBottom: "1px solid #444",
    backgroundColor: "#272c30",
    height: "40px",
  },
  selectedRow: {
    backgroundColor: "#3b68ff",
  },
  firstColumn: { paddingLeft: "10px" },
  lastColumn: { paddingRight: "10px" },
};

export default DarkTable;
