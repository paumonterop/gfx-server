import React, { useState, useEffect } from 'react';
import './Top3.css'



const Top3 = ({ data, show, dataTitol}) => {
    const [animate, setAnimate] = useState(Array(data.length).fill(false));
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

    useEffect(() => {
        if (show) {
        setIsVisible(true);
        } else {
        // Delay of 1 second before hiding the component
        const timeoutId = setTimeout(() => {
            setIsVisible(false);
        }, 1000); // 1 second delay for exit animation

        return () => clearTimeout(timeoutId); // Cleanup timeout on unmount or show change
        }
    }, [show]);

    useEffect(() => {
      let timeouts = []; // Para limpiar los temporizadores
      if (show === true) {
          // Mostrar contenido con animación de entrada
          data.forEach((_, index) => {
              const timeoutId = setTimeout(() => {
                  setAnimate(prevAnimate => {
                      const newAnimate = [...prevAnimate];
                      newAnimate[index] = true; // Activa la animación de entrada
                      return newAnimate;
                  });
              }, index * 150); // Ajusta el tiempo de retraso de entrada
              timeouts.push(timeoutId); // Almacenar los temporizadores
          });
      } else if (show === false) {
          // Animaciones de salida
          data.forEach((_, index) => {
              const timeoutId = setTimeout(() => {
                  // Esperar 1 segundo antes de cambiar a invisible (animación de salida)
                  const exitTimeoutId = setTimeout(() => {
                      setAnimate(prevAnimate => {
                          const newAnimate = [...prevAnimate];
                          newAnimate[index] = false; // Desactiva la animación de salida
                          return newAnimate;
                      });
                  }, 500); // Espera 1 segundo antes de la salida
                  timeouts.push(exitTimeoutId); // Almacenar el temporizador de salida
              }, index * 150); // Ajusta el tiempo de retraso de salida
              timeouts.push(timeoutId); // Almacenar los temporizadores
          });
  
          // Desactivar todas las animaciones después de 1 segundo + el tiempo de retraso
          const hideTimeoutId = setTimeout(() => {
              setAnimate(Array(data.length).fill(false)); // Desactiva todas las animaciones
          }, 100 + data.length * 150); // Tiempo total para la salida
          timeouts.push(hideTimeoutId);
      }
  
      // Limpiar temporizadores cuando el efecto o el componente se desmonte
      return () => {
          timeouts.forEach(timeoutId => clearTimeout(timeoutId));
      };
  }, [show, data]);

    return (
        isVisible &&(<div className="top3-container">
            <div className="top3-capcelera">
                <div className="top3-rect" style={{
                    animation: `${show ? `slideLeftTop3 0.7s ease-in-out forwards` : `slideRightTop3 0.7s ease-in-out forwards`}`,
                }}></div>
                <div className="top3-lletres" style={{
                    animation: `${show ? `slideLeftTop3 0.7s ease-in-out forwards` : `slideRightTop3 0.7s ease-in-out forwards`}`,
                }}>
                    <div className="top3-top">
                        <div className="top3-top-text">{dataTitol.top}</div>
                    </div>
                    <div className="top3-cursa">
                        <div className="top3-cursa-text">{dataTitol.cursa}</div>
                    </div>
                </div>
            </div>
            
                <div className="top3-taula-container" style={{
                    animation: `${show ? `` : `slideRightClas 0.7s ease-in-out forwards`}`,
                    }}>
                    <div className="top3-taula-firstrow" style={{
                        animation: `${show ? `slideDown 0.7s ease-in-out forwards` : `slideRightClas 0.7s ease-in-out forwards`}`,
                    }}>
                        <div className="top3-taula-firstrow-atleta">ATLETA</div>
                        <div className="top3-taula-firstrow-dorsal">DORSAL</div>
                        <div className="top3-taula-firstrow-equip">EQUIP</div>
                        <div className="top3-taula-firstrow-checkpoint">KM</div>
                        <div className="top3-taula-firstrow-temps">GAP</div>
                    </div>
                    {data.map((item, index) => (
                        <div
                            key={index}
                            className={`top3-taula-rows ${animate[index] ? 'visible2' : 'invisible2'}`}
                            style={{
                                backgroundColor: item.follow === "1" ? 'rgb(0, 203, 123)' : 'rgb(0,0,0)',
                                color: item.follow === "1" ? '#000000' : '#ffffff',
                                animation: `${show ? `slideLeftClas 0.7s ease-in-out ${index * 0.15}s forwards` : `slideLeftClas 0.7s ease-in-out 0.5s forwards`}`,
                            }}
                        >
                            <div className="top3-taula-posicio">
                                <div className="top3-taula-posicio-text">{item.class}</div>
                            </div>
                            <div
                                className="top3-taula-pais"
                                style={{
                                    backgroundImage: `url(${require(`../images/flags/${item.pais}.png`)})`
                                }}
                            ></div>
                            <div className="top3-taula-nom">{item.atleta}</div>
                            <div className="top3-taula-dorsal">{item.dorsal}</div>
                            <div className="top3-taula-equip">{item.equip}</div>
                            <div className="top3-taula-checkpoint">{item.checkpoint}</div>
                            <div className="top3-taula-temps">{item.temps}</div>
                        </div>
                        ))}
                    </div>

        </div>
        )
    );
};
export default Top3;