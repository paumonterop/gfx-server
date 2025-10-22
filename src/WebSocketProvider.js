import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { SERVER_IP } from "./global";


const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const [rawData, setRawData] = useState(null);
  const wsRef = useRef(null);

  useEffect(() => {
    let intervalId = null;
    const connect = () => {
      const ws = new WebSocket(`ws://${SERVER_IP.server_ip}`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connected");
        ws.send(JSON.stringify({ type: "statistics" }));
      };

      ws.onmessage = (event) => {
        try {
          const api = JSON.parse(event.data);
          setRawData(api);
          console.log(api)
        } catch (err) {
          console.error("Error parsing WS data:", err);
        }
      };

      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
      };

      ws.onclose = () => {
        console.log("WebSocket closed, reconnecting in 3s...");
        clearInterval(intervalId);
        setTimeout(connect, 1000); // Reconectar después de 3 segundos
      };
    };

    connect();

    return () => {
      if (wsRef.current) wsRef.current.close();
      clearInterval(intervalId);
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ rawData }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocketData = () => useContext(WebSocketContext);
