import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Link, Routes, useLocation } from "react-router-dom"; // Importamos useLocation

import Status from './Status';  // Importa la página de Status
import Statistics from './Statistics';  // Importa la página de Statistics
import Dashboard from './Dashboard';
import Output from './Output';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  // Cargar estado de autenticación al montar el componente
  useEffect(() => {
    const storedAuth = localStorage.getItem("isAuthenticated");
    if (storedAuth === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = () => {
    if (username === "admin" && password === "admin") {
      setIsAuthenticated(true);
      localStorage.setItem("isAuthenticated", "true"); // Guardar autenticación
    } else {
      alert("Credenciales incorrectas");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("isAuthenticated"); // Eliminar autenticación
  };

  // La comprobación de autenticación solo debe ocurrir fuera de Router
  if (!isAuthenticated) {
    return (
      <div className="login-container">
        <h1>Iniciar sesión</h1>
        <input
          type="text"
          placeholder="Usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={handleLogin}>Entrar</button>
      </div>
    );
  }

  return (
    // El Router debe envolver toda la aplicación
    <Router>
      <div className="App">
        <Navigation handleLogout={handleLogout} />
        <Routes>
          <Route path="/status" element={<Status />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/Dashboard" element={<Dashboard />} />
          <Route path="/Output" element={<Output />} />
        </Routes>
      </div>
    </Router>
  );
}

const Navigation = ({ handleLogout }) => {
  const location = useLocation();  // Hook useLocation dentro del Router

  return (
    <div>
      {/* Ocultar los botones de navegación si estamos en Output */}
      {location.pathname !== "/Output" && (
        <div style={{ display: "flex", justifyContent: "space-between", width: '102%', height: '30px', alignItems: 'center', backgroundColor: 'black', marginLeft: '-20px', marginTop: '-20px', paddingRight: '10px'}}>
          <h1 style={{ height: '30px', marginLeft: '20px', fontSize: '25px' }}>GPS & GFX DASHBOARD</h1>
          <div className="navigation-buttons" style={{ display: "flex", justifyContent: "flex-end" }}>
            <Link to="/status">
              <button style={{ fontSize: '20px' }}>Status</button>
            </Link>
            <Link to="/statistics">
              <button style={{ fontSize: '20px' }}>Statistics</button>
            </Link>
            <Link to="/Dashboard">
              <button style={{ fontSize: '20px' }}>Dashboard</button>
            </Link>
            {/* Cambiar a un Link con target="_blank" para abrir en una nueva pestaña */}
            <Link to="/Output" target="_blank">
              <button style={{ fontSize: '20px' }}>Output</button>
            </Link>
            <button onClick={handleLogout} style={{ fontSize: '20px', marginLeft: '30px', color: 'red' }}>Tancar sessió</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
