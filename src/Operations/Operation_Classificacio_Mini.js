import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { useWebSocketData } from "../WebSocketProvider";

const formatInicialCognom = (nombre) => {
  if (!nombre) return "";
  
  const parts = nombre.trim().split(" ");
  if (parts.length === 1) return parts[0]; // Solo un nombre

  const firstNameInitial = parts[0][0].toUpperCase() + ".";
  const firstSurname = parts[1].charAt(0).toUpperCase() + parts[1].slice(1).toLowerCase();

  return `${firstNameInitial} ${firstSurname}`;
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

const styles = {
  clas_container: {
    height: "220px",
    width: "600px",
    backgroundColor: "#272c36",
    padding: "10px",
  },
  tab: {
    cursor: "pointer",
    padding: "10px",
    backgroundColor: "#444",
    color: "#fff",
    textAlign: "center",
    borderRadius: "5px",
    width: "33%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  activeTab: {
    cursor: "pointer",
    padding: "10px",
    backgroundColor: "#3b68ff",
    color: "#fff",
    textAlign: "center",
    borderRadius: "5px",
    width: "33%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
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
  comboContainer: {
    marginTop: "10px",
    marginBottom: "10px",
    display: "flex",
    alignItems: "center",
  },
  select: {
    padding: "5px",
    borderRadius: "5px",
  },
};

const Operation_Classificacio = () => {
  // States
  const [selectedClas, setSelectedClas] = useState("top10Men");
  const [showClas, setShowClas] = useState(false);
  const [autoShowClas, setAutoShowClas] = useState(false);
  const [liveTabStyle, setLiveTabStyle] = useState(styles.liveTab);
  const [activePointIndex, setActivePointIndex] = useState("0");

  const { rawData } = useWebSocketData();
  const curses = rawData?.data_all?.curses || {};
  const allRaceDetails = rawData?.data_all?.raceDetails || [];
  const currentRaceId = rawData?.current_race ? curses[rawData.current_race]?.id : null;
  const currentRace = allRaceDetails.find((r) => r.id === currentRaceId);
  const currentRacePoints = currentRace?.points || [];

  // Socket único
  const [socket, setSocket] = useState(null);
  useEffect(() => {
    const s = io("http://localhost:10011");
    setSocket(s);

    s.on("connect", () => {
      console.log("Conectado a Socket.IO");
    });

    s.on("connect_error", (err) => {
      console.error("Error Socket.IO:", err.message);
    });

    return () => s.disconnect();
  }, []);

  // Funciones
  const setAutoShowClasButton = () => setAutoShowClas(!autoShowClas);

  const showClasButton = (bool) => {
    setShowClas(bool);
    setLiveTabStyle({ ...styles.liveTab, opacity: bool ? 1 : 0 });

    if (!socket) return;

    if (["top10MenProv", "top10WomenProv"].includes(selectedClas)) {
      socket.emit(bool ? "showClassificacioProvOn" : "showClassificacioProvOff", bool);
    } else if (
      ["top10Men", "top10Women", "top10MenPoint", "top10WomenPoint"].includes(selectedClas)
    ) {
      socket.emit(bool ? "showClassificacioMiniOn" : "showClassificacioMiniOff", bool);
    }
  };

  const getTabData = (tab) => {
    if (!rawData?.data_all.raceClasifications) return [];

    const clasification = rawData.data_all.raceClasifications.find((r) => r.id === currentRaceId) || {};

    switch (tab) {
      case "top10Men":
        return clasification?.clasification?.final_men?.slice(0, 10) || [];
      case "top10Women":
        return clasification?.clasification?.final_women?.slice(0, 10) || [];
      case "top10MenProv":
        return clasification?.provisional?.provisional_men?.slice(0, 10) || [];
      case "top10WomenProv":
        return clasification?.provisional?.provisional_women?.slice(0, 10) || [];
      case "top10MenPoint":
        return clasification?.clasification_points?.men[Number(activePointIndex)]?.slice(0, 10) || [];
      case "top10WomenPoint":
        return clasification?.clasification_points?.women[Number(activePointIndex)]?.slice(0, 10) || [];
      default:
        return [];
    }
  };

  const formatDataForSocket = (rows) =>
    rows.map((r, i) => ({
      class: i + 1,
      atleta: formatInicialCognom(r.nombre),
      dorsal: r.doss || "-",
      equip: r.club || "-",
      temps: formatTimeTour(r.tiempo) || r.tps || "-",
      pais: r.nacio || "-",
      gap: formatTimeTour(r.ecart) || "-",
    }));

  const emitClasData = (tabId = selectedClas) => {
    if (!socket) return;
    const data = getTabData(tabId);
    const dataClassificacio = formatDataForSocket(data);

    const dataTitolClassificacio = {
      top: ["Men", "top10Men", "top10MenProv", "top10MenPoint"].includes(tabId)
        ? "Top 3 Masculí -"
        : "Top 3 Femení -",
      cursa: currentRace?.title || " ",
      classificacio: ["top10MenPoint", "top10WomenPoint"].includes(tabId)
        ? currentRacePoints.find(p => p.idpt === activePointIndex)?.n?.toUpperCase() || "PUNT"
        : ["top10MenProv", "top10WomenProv"].includes(tabId)
          ? "CLASSIFICACIÓ PROVISIONAL"
          : "CLASSIFICACIÓ FINAL",
      leader: dataClassificacio[0]?.atleta || "",
    };

    socket.emit("dataClassificacioMini", dataClassificacio);
    socket.emit("dataTitolClassificacioMini", dataTitolClassificacio);
  };


  // Render
  return (
    <div style={styles.clas_container}>
      <div style={{ display: "flex", flexDirection: "row", alignItems: "center", padding: "10px" }}>
        <h2 style={{ justifyContent: "flex-start" }}>CLASSIFICACIÓ_MINI</h2>
        <label>
          <input
            type="checkbox"
            style={{ marginLeft: "10px" }}
            checked={autoShowClas}
            onChange={setAutoShowClasButton}
          />
        </label>
        <div style={liveTabStyle}>LIVE</div>
        <div style={styles.inTab} onClick={() => showClasButton(true)} className="button-in">
          IN
        </div>
        <div style={styles.outTab} onClick={() => showClasButton(false)} className="button-out">
          OUT
        </div>
      </div>

      {/* Combo visible solo en tabs de puntos */}
        <div style={styles.comboContainer}>
          <label style={{ marginRight: "10px", fontWeight: "bold" }}>Selecciona punt de control:</label>
          <select
            style={styles.select}
            value={activePointIndex}
            onChange={(e) => setActivePointIndex(e.target.value)}
          >
            {currentRacePoints && currentRacePoints.length > 0 ? (
              currentRacePoints.map((punto) => (
                <option key={punto.idpt} value={punto.idpt}>
                  {punto.n ? `${punto.n} (${parseFloat(punto.km).toFixed(2)} km)` : `Punt ${punto.idpt}`}
                </option>
              ))
            ) : (
              <option value="">No hi ha punts disponibles</option>
            )}
          </select>
        </div>

      {/* Tabs */}
      <div style={{ display: "flex", padding: "10px", justifyContent: "space-between" }}>
        {[
          { id: "top10Men", label: "TOP 3 MEN" },
          { id: "top10Women", label: "TOP 3 WOMEN" },
          { id: "top10MenProv", label: "TOP 3 MEN PROV" },
          { id: "top10WomenProv", label: "TOP 3 WOMEN PROV" },
          { id: "top10MenPoint", label: "TOP 3 MEN POINT" },
          { id: "top10WomenPoint", label: "TOP 3 WOMEN POINT" },
        ].map((tab) => (
          <div
            key={tab.id}
            style={selectedClas === tab.id ? styles.activeTab : styles.tab}
            onClick={() => {
              setSelectedClas(tab.id);
              emitClasData(tab.id);
            }}
            className={tab.id}
          >
            {tab.label}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Operation_Classificacio;
