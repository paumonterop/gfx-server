import React, { useState, useEffect } from 'react';
import './Footer.css';

const DobleChyronRunner = ({ data, show }) => {
    const [animate, setAnimate] = useState(Array(data.length).fill(false));
    const [isVisible, setIsVisible] = useState(show);

    console.log(data)

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
        console.log(data)

    }, [show, data]);

    function formatPosition(position) {
        if (position === 1) return '1r';
        if (position === 2) return '2n';
        if (position === 3) return '3r';
        if (position === 4) return '4t';
        return `${position}è`;
      }

return (
  isVisible && (
    <div className="chyron-runner-container2">
      {data.map((runner, index) => {
        if (!runner.data) return null;

        // Animaciones
        const slideMain = show
          ? "slideLeftChyron 0.7s ease-in-out forwards"
          : "slideRightChyron 0.7s ease-in-out forwards";

        const slideInfo = show
          ? "slideLeftChyron 1s ease-in-out forwards"
          : "slideRightChyron 1s ease-in-out forwards";

        return (
          <div key={index} style={{ marginLeft: index === 1 ? "980px" : "0",  marginTop: index === 1 ? "-114px" : "0", marginBottom: "20px" }}>
            {/* Bloque dorsal + nombre */}
            <div style={{ display: "flex", animation: slideMain }}>
              <div className="chyron-runner-dorsal-container">
                <div className="chyron-runner-dorsal-text">{runner.data.dorsal}</div>
              </div>
              <div className="chyron-runner-nom-container">
                <div className="chyron-runner-nom-text">{runner.data.atleta}&nbsp;</div>
              </div>
            </div>

            {/* Bloque posición + tipo */}
            <div style={{ display: "flex", marginTop: "10px", animation: slideInfo }}>
              <div
                className="chyron-runner-dorsal-container"
                style={{ backgroundColor: "rgba(0,0,0,0)", color: "rgba(0,0,0,0)" }}
              >
                <div
                  className="chyron-runner-dorsal-text"
                  style={{ backgroundColor: "rgba(0,0,0,0)", color: "rgba(0,0,0,0)" }}
                >
                  {runner.data.dorsal}
                </div>
              </div>

              <div className="chyron-runner-posicio-container">
                <div className="chyron-runner-posicio-text">{formatPosition(runner.position)}</div>
              </div>

              <div className="chyron-runner-cursa-container">
                <div className="chyron-runner-cursa-text">
                  {runner.data.tipus === "Matxos" ? "P.C.D. Matxos" : runner.data.tipus}&nbsp;
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  )
);

};

export default DobleChyronRunner;
