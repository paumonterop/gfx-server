import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { REQUEST_IP } from "../global";


const Operation_Footer = () => {
    const [selectedClas, setSelectedClas] = useState("top10Men");
    const [showClas, setShowClas] = useState(false);
    const [autoShowClas, setAutoShowClas] = useState(false);
    const [liveTabStyle, setLiveTabStyle] = useState(styles.liveTab);
    const [cursa, setCursa] = useState({race: 'Matxos', abr: 'MAT', url: 'https://api.matxos.cat/api/ranking/races/matxos25/all'});
    
    const cambiarCursa = (tipo) => {
      let url = '';
      let abr = '';
      if (tipo === 'Matxos') {
        url = REQUEST_IP.matxos;
        abr = 'MAT';
      } else if (tipo === 'Tastet') {
        url = REQUEST_IP.tastet;
        abr = 'TAST';
      }    
      // Actualizamos el estado 'cursa'
      setCursa({ race: tipo, abr: abr, url: url });
    };

    const setAutoShowClasButton = () => {
      setAutoShowClas(!autoShowClas);
      };
  
    const showClasButton = (bool) => {
      setShowClas(bool);
      const updatedStyle = { ...styles.liveTab, opacity: bool ? 1 : 0 };
      setLiveTabStyle(updatedStyle);
      // Crear conexión con el servidor de Socket.IO
      const socket = io("http://localhost:10011");
      
      // Manejar la conexión y enviar los datos
      socket.on("connect", () => {
        console.log("Conectado al servidor de Socket.IO - SHOW CLAS PROV");
        if (bool) {
          socket.emit("showFooterOn", true); // Emitir los datos formateados
        } else {
          socket.emit("showFooterOff", false); // Emitir los datos formateados
        }
      });
    
      // Manejar errores de conexión
      socket.on("connect_error", (err) => {
        console.error("Error de conexión con el servidor de Socket.IO:", err.message);
      });
    };

    const formatNomCognom = (nomComplet) => {
      if (!nomComplet) return "-";
      let cognom = ''
      const parts = nomComplet.trim().split(" ");
      const nom = parts[0] || "-";
      if (parts[1] === ''){
        cognom = parts[2] || "";
      } else { 
        cognom = parts[1] || "";
      }
      // Capitalizar nombre y primer apellido
      const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
      return `${cap(nom)} ${cap(cognom)}`;
    };

    const formatInicialCognom = (nomComplet) => {
      if (!nomComplet) return "-";
      
      let cognom_1 = '';
      const parts = nomComplet.trim().split(" ");
      const inicial = parts[0]?.charAt(0).toUpperCase() || "-";
      if (parts[1] === ''){
        cognom_1 = parts[2] || "";
      } else { 
        cognom_1 = parts[1] || "";
      }
      const cognom = cognom_1
        ? cognom_1.charAt(0).toUpperCase() + cognom_1.slice(1).toLowerCase()
        : "-";
    
      return `${inicial}. ${cognom}`;
    };
    
    const timeToSeconds = (time) => { // per caluclar la diferencia de hores HH:MM:SS - HH:MM:SS
      const [hours, minutes, seconds] = time.split(':').map(Number);
      return hours * 3600 + minutes * 60 + seconds;
    };
    
    // Convierte segundos de vuelta a formato HH:MM:SS
    const secondsToTime = (seconds) => {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const formatTimeTour = (time) => {
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
  
    const loadDataClas = async (key) => {
      // Mapa de configuraciones basadas en el key
      let titol = '';
      if (cursa.race === 'Matxos'){
        titol = 'PELS CAMINS DELS MATXOS'
      } else if (cursa.race === 'Tastet'){
        titol = 'TASTET DE MATXOS'
      }

      let dataClassificacio = [];
      let dataFooter = [];
    
      try {
        const response = await fetch(cursa.url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
    
        // Filtrar topMen y topWomen una sola vez
        const topMen = result.filter(participant => participant.g === 'M' && participant.ro === cursa.abr);
        const topWomen = result.filter(participant => participant.g === 'F' && participant.ro === cursa.abr);
    
        // Lógica para 'top10Men' y 'top10Women'
        const getTopGroup = (group, key) => {
          return group.slice(0, 10).map((participant, index) => {
            const rowTimeInSeconds = participant.s ? timeToSeconds(participant.s) : 0;
            const firstTimeInSeconds = group[0]?.s ? timeToSeconds(group[0].s) : 0;
            let gapInSeconds = 0
            if (index === 0){
              gapInSeconds = rowTimeInSeconds;
            } else {
              gapInSeconds = rowTimeInSeconds - firstTimeInSeconds;
            }
            return {
              class: index + 1,
              atleta: formatInicialCognom(participant.n),
              dorsal: participant.b || "",
              equip: participant.club || " ",
              checkpoint: participant.lc || "",
              temps: participant.s || "N/A",
              pais: participant.nacio || "Sense país",
              gap: formatTimeTour(secondsToTime(gapInSeconds)) || '',
            };
          });
        };
    
        if (key === 'top10Men' || key === 'top10Women') {
          const topGroup = key === 'top10Men' ? topMen : topWomen;
          dataClassificacio = getTopGroup(topGroup, key);

        }

      const top3 = dataClassificacio
        .slice(0, 3)
        .map(p => `${p.atleta} (${p.gap})`);

      const classifications = {
        top10Men: { 
          titular: 'Top Masculí', 
          title: titol, 
          pos1: top3[0] || '', 
          pos2: top3[1] || '', 
          pos3: top3[2] || '' 
        },
        top10Women: { 
          titular: 'Top Femení', 
          cursa: titol, 
          pos1: top3[0] || '', 
          pos2: top3[1] || '', 
          pos3: top3[2] || '' 
        },
        top10MenPoint: { 
          titular: 'Top Masculí', 
          cursa: titol,
          pos1: top3[0] || '', 
          pos2: top3[1] || '', 
          pos3: top3[2] || '' 
        },
        top10WomenPoint: { 
          titular: 'Top Femení', 
          cursa: titol, 
          pos1: top3[0] || '', 
          pos2: top3[1] || '', 
          pos3: top3[2] || '' 
        }
      };
    
      //const dataFooter = classifications[key] || {};
      const dataFooter = classifications
    
      } catch (err) {
        console.log('Error', err);
      }

      // Crear conexión con el servidor de Socket.IO
      const socket = io("http://localhost:10011");

      // Manejar la conexión y enviar los datos
      socket.on("connect", () => {
        console.log("Conectado al servidor de Socket.IO");
        socket.emit("dataFooter", dataFooter); // Emitir los datos formateados
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
            <h2 style={{ justifyContent: "flex-start" }}>FOOTER</h2>
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
          <div style={{ display: "flex", padding: "10px" }}>
            <div
              style={selectedClas === "top10Men" ? styles.activeTab : styles.tab}
              onClick={() => {
                setSelectedClas("top10Men");
                loadDataClas("top10Men");
              }}
              className="top10Men"
            >
              TOP 10 MEN
            </div>
            <div
              style={selectedClas === "top10Women" ? styles.activeTab : styles.tab}
              onClick={() => {
                setSelectedClas("top10Women");
                loadDataClas("top10Women");
              }}
              className="top10Women"
            >
              TOP 10 WOMEN
            </div>
            <div
              style={selectedClas === "top10MenProv" ? styles.activeTab : styles.tab}
              onClick={() => {
                setSelectedClas("top10MenProv");
                loadDataClas("tableDataTop10MenProv");
              }}
              className="top10MenProv"
            >
              TOP 10 MEN PROV
            </div>
            <div
              style={selectedClas === "top10WomenProv" ? styles.activeTab : styles.tab}
              onClick={() => {
                setSelectedClas("top10WomenProv");
                loadDataClas("tableDataTop10WomenProv");
              }}
              className="top10WomenProv"
            >
              TOP 10 WOMEN PROV
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
      height: "160px",
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
  
  export default Operation_Footer;