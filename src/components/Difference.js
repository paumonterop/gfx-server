import React, { useEffect, useState } from "react";
import './Difference.css';
import { useWebSocketData } from "../WebSocketProvider";

const DifferenceUp = ({ show, data }) => {
  const { rawData } = useWebSocketData();
  const [dataDiference, setDataDiference] = useState([]);
  const [rows, setRows] = useState([]);
  const [animate, setAnimate] = useState([]);
  const [isVisible, setIsVisible] = useState(false);

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
    motx12: '10.147.17.31',

  };

  useEffect(() => {
    if (data && data.length > 0) {
      setRows(data);
      setAnimate(Array(data.length).fill(false));
    }
  }, [data]);

  useEffect(() => {
    let timeouts = [];
    if (show) {
      setIsVisible(true);
      rows.forEach((_, index) => {
        const t = setTimeout(() => {
          setAnimate(prev => {
            const newAnimate = [...prev];
            newAnimate[index] = true;
            return newAnimate;
          });
        }, index * 600);
        timeouts.push(t);
      });
    } else {
      rows.forEach((_, i) => {
        const index = rows.length - 1 - i;
        const t = setTimeout(() => {
          setAnimate(prev => {
            const newAnimate = [...prev];
            newAnimate[index] = false;
            return newAnimate;
          });
        }, i * 600);
        timeouts.push(t);
      });
      const hideTimeout = setTimeout(() => setIsVisible(false), rows.length * 500 + 800);
      timeouts.push(hideTimeout);
    }
    return () => timeouts.forEach(t => clearTimeout(t));
  }, [show, rows]);

  useEffect(() => {
    if (!rawData || rows.length === 0) return;
    const ipAddress = ipMap[rows[0]?.selectedMotx] || '10.147.17.11';

    let km1 = 0, km2 = 0, km3 = 0;
    let gap1 = '0:0:0', gap2 = '0:0:0', gap3 = '0:0:0';

    if (rawData?.data_all?.gps_statistics[ipAddress]) {
      if (rows[1]?.active) {
        const comp = rawData?.data_all?.gps_statistics[ipAddress]?.comparisons?.find(
          c => c.other_gps === ipMap[rows[1].selectedMotx]
        );
        if (comp) { km1 = parseFloat(comp.distance_km); gap1 = comp.time_difference; }
      }
      if (rows[2]?.active) {
        const comp = rawData?.data_all?.gps_statistics[ipAddress]?.comparisons?.find(
          c => c.other_gps === ipMap[rows[2].selectedMotx]
        );
        if (comp) { km2 = parseFloat(comp.distance_km); gap2 = comp.time_difference; }
      }
      if (rows[3]?.active) {
        const comp = rawData?.data_all?.gps_statistics[ipAddress]?.comparisons?.find(
          c => c.other_gps === ipMap[rows[3].selectedMotx]
        );
        if (comp) { km3 = parseFloat(comp.distance_km); gap3 = comp.time_difference; }
      }

      const progres = rawData?.data_all?.gps_statistics[ipAddress]?.progress?.km_restants || 0;

      setDataDiference([
        { distance: progres, gap: '-' },
        { distance: km1, gap: gap1 },
        { distance: km2, gap: gap2 },
        { distance: km3, gap: gap3 },
      ]);
    }
  }, [rawData, rows]);

  const formatTimeTour = (time) => {
    const [hours, minutes, seconds] = time.split(':').map(Number);
    if (hours === 0 && minutes === 0 && seconds === 0) return '';
    const h = String(hours).padStart(2,'0');
    const m = String(minutes).padStart(2,'0');
    const s = String(seconds).padStart(2,'0');
    if (hours === 0 && minutes === 0) return `${m}'${s}''`;
    if (hours === 0) return `${m}'${s}''`;
    return `${h}h${m}'${s}''`;
  };

  if (!isVisible) return null;

  return (
    <div style={{ display:'flex', justifyContent:'flex-start', overflow:'visible', width: '100%' }}>
      {rows.map((row, index) => 
        row.active && (
          <div
            key={index}
            className="on-time-container-dif"
            style={{
              width:'305px', height:'100px',
              marginLeft: index===1 ? '305px' : index===2 ? '610px' : index===3 ? '915px' : '0px',
              zIndex: rows.length - index,
              overflow:'visible',
              opacity: animate[index] ? 1 : 0, // controla aparición sin parpadeo
              transform: animate[index] ? 'translateX(0)' : 'translateX(-100%)', // desde izquierda
              transition: 'transform 0.8s ease-in-out, opacity 0.8s ease-in-out',
            }}
          >
            <div className="on-time-rect-nom-dif" style={{marginTop:'36px'}}>
              <div className="on-time-text-nom-dif">{row?.position ?? '-'}</div>
              <div className="on-time-text-nom-dif" style={{marginLeft:'20px'}}>{row?.athlete ?? '-'}</div>
            </div>

            <div className="on-time-rect-dif" style={{marginTop:'36px'}}>
              <div className="on-time-text-dif">
                {index===0
                  ? (dataDiference[index]?.distance ?? 0).toFixed(2)+' km'
                  : formatTimeTour(dataDiference[index]?.gap ?? '0:0:0')}
              </div>
            </div>

            <div className="circle-dif">
              {index===0
                ? <img src="/icons/finish_flag.png" alt="crono" className="on-time-icon-dif"/>
                : <img src="/icons/flechas.png" alt="crono" className="on-time-icon-dif"/>}
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default DifferenceUp;
