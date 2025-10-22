import React, { useState, useEffect } from 'react';
import './ClassificacioMini.css';
//import ImageWithBorder from './ImageWithBorder';


const ClassificacioMini = ({ data, show, dataTitol }) => {
    const [animate, setAnimate] = useState(Array(data.length).fill(false));
    const [isVisible, setIsVisible] = useState(show);
    const [dataLiveH, setDataLiveH] = useState(null);
    const [dataLiveF, setDataLiveF] = useState(null);
    const [dataLive, setDataLive] = useState(null);

    //console.log(data)
    //console.log(show)
    //console.log(dataTitol)


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
                  }, 400); // Espera 1 segundo antes de la salida
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
        isVisible &&(<div className="classificacio-container-mini">
            {(
              
              <div style={{ marginTop: '750px' }}>
                <div className='classificacio-top-mini' style={{
                  animation: `${show ? `slideLeftTitol 0.7s ease-in-out forwards` : `slideRightClas 0.7s ease-in-out forwards`}`,
                }}><div className='classificacio-top-text-mini'>{`${dataTitol.cursa}`}&nbsp;</div></div>
                <div className='classificacio-cursa-mini' style={{
                  animation: `${show ? `slideLeftTitol 0.7s ease-in-out forwards` : `slideRightClas 0.7s ease-in-out forwards`}`,
                }}><div className='classificacio-cursa-text-mini'>
                  {dataTitol.top}&nbsp; {dataTitol.classificacio}&nbsp;
              </div>
              </div>
                
                    <div className="classificacio-taula-container-mini" style={{
                        animation: `${show ? `` : `slideRightClas 0.7s ease-in-out forwards`}`,
                        }}>
                        {data.slice(0, 3).map((item, index) => (
                            <div
                                key={index}
                                className={`classificacio-taula-rows-mini ${animate[index] ? 'visible2' : 'invisible2'}`}
                                style={{
                                    backgroundColor: index === 0 ? 'rgb(0, 203, 122)' : 'rgba(0, 0, 0, 0.8)',
                                    // backgroundColor: index === 0 ? 'rgb(0, 203, 122)' : undefined,
                                    // backgroundImage: index !== 0 ? 'linear-gradient(to right,rgb(0,0,0) 45%, rgb(255, 255, 255) 50%)' : undefined,
                                    color: index === 0 ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)',
                                    opacity: animate[index] ? 1 : 0, // Controlar la opacidad para la animación
                                    transition: 'opacity 0.3s ease-in-out', // Transición suave
                                    animation: `${animate[index] ? `slideLeftClas 0.7s ease-in-out ${index * 0.15}s forwards` : `slideLeftClas 0.7s ease-in-out 0.5s forwards`}`,
                                }}
                            >
                                <div className="classificacio-taula-posicio-mini">
                                    <div className="classificacio-taula-posicio-text-mini" style={{color: index === 0 ? 'rgb(255, 255, 255)' : 'rgb(255, 255, 255)'}}>{item.class}</div>
                                </div>
                                <div className="classificacio-taula-nom-mini">{item.atleta}</div>
                                <div className="classificacio-taula-gap-mini"
                                    style={{
                                        //color: 'rgb(0, 0, 0)',
                                      }}>
                                  {index !== 0 && `+${item.gap}`}
                                  {index === 0 && item.temps}
                                </div>
                                {/*<div className="classificacio-taula-checkpoint">{item.checkpoint}</div>*/}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
        )
    );
};

export default ClassificacioMini;
