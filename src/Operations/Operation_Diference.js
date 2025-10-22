import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { useWebSocketData } from "../WebSocketProvider";


const Operation_Diference = () => {
    const { rawData } = useWebSocketData();
    const [selectedTime, setSelectedTime] = useState("Matxos");
    const [show, setShow] = useState(false);
    const [autoShowClas, setAutoShowClas] = useState(false);
    const [liveTabStyleUp, setLiveTabStyleUp] = useState(styles.liveTab);
    const [liveTabStyleDown, setLiveTabStyleDown] = useState(styles.liveTab);
    const [dataDiference, setDataDiference] = useState([{}])

    const gpsOptions = [
        { value: 'motx0', label: '-' },
        { value: 'motx1', label: 'BBX 01' },
        { value: 'motx2', label: 'BBX 02' },
        { value: 'motx3', label: 'BBX 03' },
        { value: 'motx4', label: 'BBX 04' },
        { value: 'motx5', label: 'BBX 05' },
        { value: 'motx6', label: 'BBX 06' },
        { value: 'motx7', label: 'BBX 07' },
        { value: 'motx8', label: 'BBX 08' },
        { value: 'motx9', label: 'BBX 09' },
        { value: 'motx10', label: 'BBX 10' },
        { value: 'motx11', label: 'BBX 11' },
        { value: 'motx12', label: 'BBX 12' },
      ];

      const [rows, setRows] = useState([
        { active: false, selectedMotx: '', position: 1, athlete: '-' },
        { active: false, selectedMotx: '', position: 2, athlete: '-' },
        { active: false, selectedMotx: '', position: 3, athlete: '-' },
        { active: false, selectedMotx: '', position: 4, athlete: '-' },
      ]);

      const difference_options = [
        "Cap de cursa",
        "Segon grup",
        "Perseguidors"
      ]

    const ipMap = { 
      motx1: '10.147.17.11', 
      motx2: '10.147.17.12', 
      motx3: '10.147.17.13', 
      motx4: '10.147.17.14', 
      motx5: '10.147.17.15', 
      motx6: '10.147.17.16', 
      motx7: '10.147.17.17', 
      motx8: '10.147.17.18', 
      motx9: '10.147.17.19', 
      motx10: '10.147.17.20', 
      motx11: '10.147.17.30', 
      motx12: '10.147.17.31', };



  useEffect(() => {
    //console.log(rawData)
    //if (!rows[0].active || !rawData) return;

    const ipAddress = ipMap[rows[0]?.selectedMotx];
    //console.log(ipAddress)
    //console.log(rows)
    if (!ipAddress || !rawData?.data_all?.gps_statistics[ipAddress]) return;

    const getComparison = (row) => {
      if (!row.active) return { distance: 0, gap: 0 };
      console.log('aixo si')
      const comp = rawData?.data_all?.gps_statistics[ipAddress]?.comparisons?.find(c => c.other_gps === ipMap[row.selectedMotx]);
      console.log(comp)
      return comp ? { distance: parseFloat(comp.distance_km), gap: comp.time_difference, motx: ipAddress } : { distance: 0, gap: 0 };
    };

    const progres = rawData?.data_all?.gps_statistics[ipAddress]?.progress?.km_restants || 0;
    console.log(rows[1])

    setDataDiference([
      { distance: progres, gap: '-' },
      getComparison(rows[1]),
      getComparison(rows[2]),
      getComparison(rows[3])
    ]);

    console.log(dataDiference)
  }, [rows, rawData]);

    
    const setAutoShowClasButton = () => {
      setAutoShowClas(!autoShowClas);
      };
  
    const showUp = (bool) => {
      setShow(bool);
      const updatedStyle = { ...styles.liveTab, opacity: bool ? 1 : 0 };
      setLiveTabStyleUp(updatedStyle);
      // Crear conexión con el servidor de Socket.IO
      const socket = io("http://localhost:10011");
      
      // Manejar la conexión y enviar los datos
      socket.on("connect", () => {
        console.log("Conectado al servidor de Socket.IO - SHOW CLAS PROV");
        if (bool) {
          socket.emit("showUpOn", true); // Emitir los datos formateados
        } else {
          socket.emit("showUpOff", false); // Emitir los datos formateados
        }
      });
    
      // Manejar errores de conexión
      socket.on("connect_error", (err) => {
        console.error("Error de conexión con el servidor de Socket.IO:", err.message);
      });
    };

    const showDown = (bool) => {
        setShow(bool);
        const updatedStyle = { ...styles.liveTab, opacity: bool ? 1 : 0 };
        setLiveTabStyleDown(updatedStyle);
        // Crear conexión con el servidor de Socket.IO
        const socket = io("http://localhost:10011");
        
        // Manejar la conexión y enviar los datos
        socket.on("connect", () => {
          console.log("Conectado al servidor de Socket.IO - SHOW CLAS PROV");
          if (bool) {
            socket.emit("showDownOn", true); // Emitir los datos formateados
          } else {
            socket.emit("showDownOff", false); // Emitir los datos formateados
          }
        });
      
        // Manejar errores de conexión
        socket.on("connect_error", (err) => {
          console.error("Error de conexión con el servidor de Socket.IO:", err.message);
        });
      };

      const handleActive = (index) => {
        setRows(prevRows =>
          prevRows.map((row, i) => 
            i === index ? { ...row, active: !row.active } : row
          )
        );
      };

      const handleTake = (index) => {
        const selected = JSON.parse(localStorage.getItem("runnerSelected"));
      
        setRows(prevRows =>
          prevRows.map((row, i) =>
            i === index
              ? { ...row, athlete: selected.atleta }
              : row
          )
        );
      };
      
      
      

      const handleComboChange = (index, value) => {
        setRows(prevRows => {
          const updatedRows = [...prevRows];
          updatedRows[index] = {
            ...updatedRows[index],
            selectedMotx: value,
          };
          return updatedRows;
        });
      };

    useEffect(() => {
      const socket = io("http://localhost:10011");

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

    const LoadData = () => {
      const socket = io("http://localhost:10011");
      socket.emit("dataDifference", rows);
    }

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
            <h2 style={{ justifyContent: "flex-start"}}>GPS_COMPARISONS</h2>
            <div>
                <div style={liveTabStyleUp}>LIVE TOP</div>
                <div style={{ ...liveTabStyleDown, marginTop: '5px' }}>LIVE BOTTOM</div>
                </div>
            <div>
                <div>TOP</div>
                <div style={{display: 'flex'}}>
                    <div
                    style={styles.inTab}
                    onClick={() => showUp(true)}
                    className="button-in"
                    >
                    IN
                    </div>
                    <div
                    style={styles.outTab}
                    onClick={() => showUp(false)}
                    className="button-out"
                    >
                    OUT
                    </div>
                    </div>
            </div>
            <div style={{marginLeft: '10px'}}>
                <div>BOTTOM</div>
                <div style={{display: 'flex'}}>
                    <div
                    style={styles.inTab}
                    onClick={() => showDown(true)}
                    className="button-in"
                    >
                    IN
                    </div>
                    <div
                    style={styles.outTab}
                    onClick={() => showDown(false)}
                    className="button-out"
                    >
                    OUT
                    </div>
                    </div>
            </div>
          </div>
          <table style={{ fontSize: '18px', width: '100%', padding:'5px' }}>
            <thead style={{backgroundColor: 'rgb(0,0,100)'}}>
                <tr>
                <th>Active</th>
                <th>GPS</th>
                <th>Pos.</th>
                <th>Athlete</th>
                <th>Dist.</th>
                <th>Gap</th>
                </tr>
            </thead>
            <tbody>
                {rows.map((row, index) => (
                        <tr style={{backgroundColor: row.active === true ? 'rgb(1, 77, 1)' : 'rgb(66, 1, 1)'}}>
                        <td>
                            <div>
                          <button 
                            style={{height: '20px', width: '20px', backgroundColor: row.active === true ? 'rgb(0,255,0)' : 'rgb(255,0,0)'}}
                            onClick={() => handleActive(index)}></button>
                          <button onClick={() => handleTake(index)}>Take</button>
                          </div>
                        </td>
                        <td>
                          <select
                            style={{ fontSize: '18px' }}
                            value={rows.selectedMotx}
                            onChange={(e) => handleComboChange(index, e.target.value)}
                          >
                            {gpsOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            type="number"
                            value={rows.position}
                            onChange={handleComboChange}
                            style={{ fontSize: '20px', width: '40px' }}
                          />
                        </td>
                        <td>
                          <label>{formatInicialCognom(row.athlete)}</label>
                        </td>
                        <td>
                        <label>
                          {dataDiference[index] && typeof dataDiference[index].distance === "number"
                            ? dataDiference[index].distance.toFixed(2)
                            : "-"} km
                        </label>                      
                          </td>
                        <td>
                        <label>
                          {dataDiference[index]
                            ? dataDiference[index].gap
                            : "-"}
                        </label>                             
                        </td>
                      </tr>
                ))}
            </tbody>
            </table>
            <button onClick={LoadData} style={{fontSize: '20px', marginTop: '10px'}}>Load Data</button>
            <select
              style={{ fontSize: '18px', marginLeft: '30px', height: '30px', width:'300px' }}
              value={rows.selectedMotx}
              onChange={(e) => handleComboChange(e.target.value)}
            >
              {difference_options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
        </div>
    );
  };
  
  const styles = {
    container: {
      display: "flex",
      backgroundColor: "#2c313c",
      color: "#fff",
      fontFamily: "Arial, sans-serif",
      padding: "20px",
      height: "900px",
      width: "1250px",
    },
    clas_container: {
      height: "297px",
      width: "600px",
      backgroundColor: "#272c36",
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
      padding: "5px",
      backgroundColor: "#fab300",
      color: "#fff",
      textAlign: "center",
      borderRadius: "5px",
      width: "109px",
      height: "20px",
      marginLeft: "10px",
      marginRight: "10px",
      opacity: 0,
      transition: "opacity 0.3s ease",
    },
  };
  
  export default Operation_Diference;