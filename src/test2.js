import React, { useState, useEffect } from 'react';
import './Perfil.css';
import { useWebSocketData } from "../WebSocketProvider";


const Perfil = ({ data, show }) => {
  const [isVisible, setIsVisible] = useState(show);

  const { rawData } = useWebSocketData();
  const trackGpx = rawData?.data_all?.curses[rawData?.current_race].track //nom de track gpx situat a public
  const curses = rawData?.data_all?.curses || {};
  const allRaceDetails = rawData?.data_all?.raceDetails || [];
  const currentRaceId = rawData?.current_race ? curses[rawData.current_race]?.id : null;
  const currentRace = allRaceDetails?.find((r) => r.id === currentRaceId);


 

  return (
    isVisible && (

  );
};

export default Perfil;
