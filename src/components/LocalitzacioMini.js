import React, { useState, useEffect } from 'react';
import './Perfil.css';

const LocalitzacioMini = ({ data, show }) => {
  const [isVisible, setIsVisible] = useState(show);
  const [dataFromXML, setDataFromXML] = useState(null);


  // Realizar un GET cada segundo para obtener el XML
  useEffect(() => {
    const fetchXMLData = async () => {
      try {
        const response = await fetch('http://192.168.1.29:8088/API'); // Cambia esta URL por la correcta
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const text = await response.text(); // Lee el XML como texto
        setDataFromXML(text);
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "application/xml");
    
        // Ejemplo: Obtener el valor del nodo <active>
        const active = xmlDoc.querySelector('active')?.textContent;
        console.log('Valor de active:', active);
        if (active === '3'){
            setIsVisible(true)
        } else {
            setIsVisible(false)
        }
        
      } catch (error) {
        setIsVisible(false)
        console.error('Error fetching the XML:', error);
      }
    };

    // Llama a la función fetch cada segundo
    const intervalId = setInterval(fetchXMLData, 500);

    // Cleanup para evitar fugas de memoria
    return () => clearInterval(intervalId);
  }, []);

  return (
    isVisible && (
      <div style={styles.containermain}>
        <div
          style={{
            ...styles.container,
            animation: `${
                isVisible
                ? 'slideLeftLoca 0.7s ease-in-out forwards'
                : 'slideRightLoca 0.5s ease-in-out forwards'
            }`,
          }}
        >
          <div style={styles.text}>Arribada, Bellmunt</div>
        </div>
      </div>
    )
  );
};

// Estilos en objeto para aplicar de forma dinámica
const styles = {
  containermain: {
    position: 'relative',
  },
  container: {
    display: 'flex',
    position: 'absolute', // Corregido: 'absolut' → 'absolute'
    width: '380px',
    height: '60px',
    backgroundColor: '#e80b2a',
    transform: 'skewX(16deg)',
    marginLeft: '1550px',
    marginTop: '850px',
    alignItems: 'center', // Cambiado a camelCase
  },
  text: {
    fontFamily: 'Medium, sans-serif', // Fuente correctamente definida
    fontWeight: 'bold', // Definimos el peso de la fuente como 'bold'
    fontSize: '30px', // Las unidades están correctas, pero las comillas no son necesarias
    color: '#ffffff', // El color está correctamente definido, pero las comillas no son necesarias
    marginLeft: '20px', // Igual que con fontSize, no uses comillas aquí
    transform: 'skewX(-16deg)',

  },
  
};

export default LocalitzacioMini;
