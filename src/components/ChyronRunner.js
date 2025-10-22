import React, { useState, useEffect } from 'react';
import './Footer.css';

const ChyronRunner = ({ data, position, show }) => {
    const [animate, setAnimate] = useState(Array(data.length).fill(false));

    const [isVisible, setIsVisible] = useState(show);

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
    }, [show, data, position]);

    function formatPosition(position) {
        if (position === 1) return '1r';
        if (position === 2) return '2n';
        if (position === 3) return '3r';
        if (position === 4) return '4t';
        return `${position}è`;
      }

    return (
        isVisible && (<div className="chyron-runner-container">
            <div style={{display: 'flex',
                        animation: `${show ? `slideLeftChyron 0.7s ease-in-out forwards` : `slideRightChyron 0.7s ease-in-out forwards`}`,
            }}>
            <div className="chyron-runner-dorsal-container">
                <div className="chyron-runner-dorsal-text">
                {data.dorsal}
                </div>
            </div>
            <div className="chyron-runner-nom-container">
                <div className="chyron-runner-nom-text">
                {data.atleta}&nbsp;
                </div>
               </div>
            </div>
            <div style={{display: 'flex', marginTop: '10px',
                        animation: `${show ? `slideLeftChyron 1s ease-in-out forwards` : `slideRightChyron 1s ease-in-out forwards`}`,

            }}>
            <div className="chyron-runner-dorsal-container" style={{backgroundColor: 'rgba(0,0,0,0)', color: 'rgba(0,0,0,0)'}}>
                <div className="chyron-runner-dorsal-text" style={{backgroundColor: 'rgba(0,0,0,0)', color: 'rgba(0,0,0,0)'}}>
                {data.dorsal}
                </div>
            </div>

            <div className="chyron-runner-posicio-container">
                <div className="chyron-runner-posicio-text">
                    {formatPosition(position)}
                </div>
            </div>
            <div className="chyron-runner-cursa-container">
                <div className="chyron-runner-cursa-text">
                    {data.tipus === 'Matxos' ? 'P.C.D. Matxos' : data.tipus}&nbsp;
                </div>
               </div>
            </div>

        </div>
        )
    );
};

export default ChyronRunner;
