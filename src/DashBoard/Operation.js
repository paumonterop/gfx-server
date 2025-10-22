import React, { useState } from "react";
import Operation_Classificacio from "../Operations/Operation_Classificacio";
import Operation_Classificacio_Mini from "../Operations/Operation_Classificacio_Mini";
import Operation_Footer from "../Operations/Operation_Footer";
import Operation_Velocitat from "../Operations/Operation_Velocitat";
import Operation_Perfil from "../Operations/Operation_Perfil";
import Operation_ChyronRunner from "../Operations/Operation_ChyronRunner";
import Operation_OnTime from "../Operations/Operation_OnTime";
import Operation_Diference from "../Operations/Operation_Diference";
import Operation_Cursa from "../Operations/Operation_Cursa";
import Operation_Punts from "../Operations/Operation_Punts";

import Operation_DobleChyronRunner from "../Operations/Operation_DobleChyronRunner";


const Operation = () => {
  // Estado para controlar la pestaña activa
  const [activeTab, setActiveTab] = useState("FULLSCREEN");

  return (
    <div style={styles.container}>
      {/* Tabs */}
      <div style={styles.tabsContainer}>
        <div
          style={activeTab === "FULLSCREEN" ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab("FULLSCREEN")}
        >
          FULLSCREEN
        </div>
        <div
          style={activeTab === "1-A-1" ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab("1-A-1")}
        >
          1-A-1
        </div>
        <div
          style={activeTab === "BIG-SMALL" ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab("BIG-SMALL")}
        >
          BIG-SMALL
        </div>
      </div>

      {/* Contenido dinámico */}
      <div style={styles.tabContent}>
      {activeTab === "FULLSCREEN" && (
        <div style={{ display: 'flex'}}>
          <div>
            <Operation_Classificacio />
            <Operation_Classificacio_Mini />
            <Operation_Diference />
          </div>
          <div>
            <Operation_Cursa />
            <Operation_Punts />
            <Operation_Perfil />
            <Operation_ChyronRunner />
            <Operation_Footer />
            <Operation_Velocitat />
            <Operation_OnTime />          
          
          </div>
        </div>

        )}
              {activeTab === "1-A-1" && (
        <div style={{ display: 'flex'}}>
          <div>
            <Operation_DobleChyronRunner />
          
            </div>
        </div>

        )}
        {activeTab === "BIG-SMALL"}
      </div>
    </div>
  );
};

const styles = {
  container: {
    margin: "0px auto",
    backgroundColor: "#2c313c",
    color: "#fff",
    fontFamily: "Arial, sans-serif",
    padding: "20px",
    height: "990px",
    width: "82%",
    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.3)",
  },
  tabsContainer: {
    display: "flex",
    justifyContent: "space-around",
    alignItems: "center",
    marginBottom: "20px",
    backgroundColor: "#282c34",
    padding: "10px",
    borderRadius: "10px",
  },
  tab: {
    cursor: "pointer",
    padding: "10px 20px",
    backgroundColor: "#444",
    color: "#fff",
    textAlign: "center",
    borderRadius: "5px",
    flex: 1,
    margin: "0 10px",
    textAlign: "center",
  },
  activeTab: {
    cursor: "pointer",
    padding: "10px 20px",
    backgroundColor: "#3b68ff",
    color: "#fff",
    textAlign: "center",
    borderRadius: "5px",
    flex: 1,
    margin: "0 10px",
    textAlign: "center",
    fontWeight: "bold",
    boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.2)",
  },
  tabContent: {
    marginTop: "20px",
    padding: "20px",
    backgroundColor: "#3a3f47",
    borderRadius: "10px",
    height: "810px",
  },
};

export default Operation;
