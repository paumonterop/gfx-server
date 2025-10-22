import React, { useState, useEffect } from 'react';
import socketIOClient from 'socket.io-client';

import backgroundclas from './images/vMix22.png';

import './components/Classificacio.css';
import Classificacio from './components/Classificacio';
import ClassificacioMini from './components/ClassificacioMini';
import Footer from './components/Footer';
import './components/Footer.css'
import Velo2 from './components/Velo2';
import './components/Velo2.css'
import Perfil from './components/Perfil';
import './components/Perfil.css'
import LocalitzacioMini from './components/LocalitzacioMini'
import ChyronRunner from './components/ChyronRunner';
import DobleChyronRunner from './components/DobleChyronRunner';
import './components/ChyronRunner.css';
import DifferenceUp from './components/Difference';
import './components/Difference.css';
import Cursa from './components/Cursa';
import Punts from './components/Punts';
/*import InfoRecorregut from './InfoRecorregut';
import './InfoRecorregut.css';
import InfoPunt from './InfoPunt';
import './InfoPunt.css';*/
import Top3 from './components/Top3';
import './components/Top3.css'
import OnTime from './components/OnTime';
/*import DobleChyronRunner from './DobleChyronRunner'*/




function App() {

  //////////////////////////////////////////////////////////////////////////////////////////////////////
  // CLASSIFICACIONS  
  //////////////////////////////////////////////////////////////////////////////////////////////////////

  /*const dataClassificacioProv1 = [
    {class: "1", atleta: 'COGNOM N.', dorsal: '123', equip: 'ABC', checkpoint: 'checkpoint', temps:"04h34'45''", pais: 'es'},
    {class: "2", atleta: 'COGNOM N.', dorsal: '123', equip: 'ABC', checkpoint: 'checkpoint', temps:"04h34'45''", pais: 'es'},
    {class: "3", atleta: 'COGNOM N.', dorsal: '123', equip: 'ABC', checkpoint: 'checkpoint', temps:"04h34'45''", pais: 'ad'},
    {class: "4", atleta: 'COGNOMMMMM N.', dorsal: '123', equip: 'ABC', checkpoint: 'checkpoint', temps:"04h34'45''", pais: 'es'},
    {class: "5", atleta: 'COGNOM N.', dorsal: '123', equip: 'ABC', checkpoint: 'checkpoint', temps:"04h34'45''", pais: 'pt'},
    {class: "6", atleta: 'COGNOM N.', dorsal: '123', equip: 'ABC', checkpoint: 'checkpoint', temps:"04h34'45''", pais: 'cc'},
    {class: "7", atleta: 'COGNOM N.', dorsal: '123', equip: 'ABC', checkpoint: 'checkpoint', temps:"04h34'45''", pais: 'it'},
    {class: "8", atleta: 'COGNOM N.', dorsal: '123', equip: 'ABC', checkpoint: 'checkpoint', temps:"04h34'45''", pais: 'cz'},
    {class: "9", atleta: 'COGNOM N.', dorsal: '123', equip: 'ABC', checkpoint: 'checkpoint', temps:"04h34'45''", pais: 'de'},
    {class: "10", atleta: 'COGNOM N.', dorsal: '123', equip: 'ABC', checkpoint: 'checkpoint', temps:"04h34'45''", pais: 'co'}
  ]

  const dataTitolClasificacioProv1 = {top: 'TOP 10 MASCULÍ', cursa: 'ULTRA', classificacio: 'CLASSIFICACIÓ PROVISIONAL', leader: "kilian_jornet"}
  */

  const [showClassificacioProv, setShowClassificacioProv] = useState(false);
  const [dataClassificacioProv, setDataClassificacioProv] = useState([]);
  const [dataTitolClasificacioProv, setDataTitolClasificacioProv] = useState([]);
  const [shouldRender, setShouldRender] = useState(false);

  const [showClassificacio, setShowClassificacio] = useState(false);
  const [dataClassificacio, setDataClassificacio] = useState([]);
  const [dataTitolClasificacio, setDataTitolClasificacio] = useState([]);

  const [showClassificacioMini, setShowClassificacioMini] = useState(false);
  const [dataClassificacioMini, setDataClassificacioMini] = useState([]);
  const [dataTitolClasificacioMini, setDataTitolClasificacioMini] = useState([]);

  //////////////////////////////////////////////////////////////////////////////////////////////////////
  // FOOTER  
  //////////////////////////////////////////////////////////////////////////////////////////////////////

  const [showFooter, setShowFooter] = useState(false);
  const [showFooter2, setShowFooter2] =useState(0)
  const [dataFooter, setDataFooter] = useState([]);
  /*const showFooter2 = {show2: 2}

  /*const dataFooter = {titular: "Lorem Ipsum es simplemente el texto de relleno de las imprentas y archivos de texto. Lorem Ipsum ha sido el texto de relleno estándar de las industrias desde el año 1500", title: "ULTRA - TOP 3 FEMENÍ", pos1: "Jornet K. (100km)", pos2: "Jornet K. (+16'34'')", pos3: "Jornet K. (+45'56'')"}*/
  
  //////////////////////////////////////////////////////////////////////////////////////////////////////
  // CHYRON RUNNER  
  //////////////////////////////////////////////////////////////////////////////////////////////////////

  const [showChyronRunner, setShowChyronRunner] = useState(false);
  const [dataChyronRunner, setDataChyronRunner] = useState([]);
  const [positionChyronRunner, setPositionChyronRunner] = useState([]);


  const [showDobleChyronRunner, setShowDobleChyronRunner] = useState(false);
  const [dataDobleChyronRunner, setDataDobleChyronRunner] = useState([]);
  const [position2ChyronRunner, setPosition2ChyronRunner] = useState([]);


  /*const dataChyronRunner = {class: "2", atleta: "Cognom N.", dorsal: "0000", equip: "ABCD", tipus: "ULTRA", pais: "es", percent: "55", toFinish: "45 km", gap: "GAP: +16'34''"}
  */
  //////////////////////////////////////////////////////////////////////////////////////////////////////
  // VELOCITAT
  //////////////////////////////////////////////////////////////////////////////////////////////////////

  const [showVelocitat, setShowVelocitat] = useState(false);
  const [dataVelocitat, setDataVelocitat] = useState([]);

  const [showDifferenceUp, setShowDifferenceUp] = useState(false);
  const [showDifferenceDown, setShowDifferenceDown] = useState(false);
  const [dataDifference, setDataDifference] = useState([]);

  /*const dataVelocitat = {atleta: "Cognom N.", ActMit: "VELOCITAT ACTUAL", tipPo: "2n (ULTRA)", percent: "55", velocitat: "10,3", tipus: "ULTRA"}
  */

    //////////////////////////////////////////////////////////////////////////////////////////////////////
  // PERFIL
  //////////////////////////////////////////////////////////////////////////////////////////////////////

  const [showPerfil, setShowPerfil] = useState(false);
  const [dataPerfil, setDataPerfil] = useState([]);

      //////////////////////////////////////////////////////////////////////////////////////////////////////
  // ON TIME
  //////////////////////////////////////////////////////////////////////////////////////////////////////

  const [showOnTime, setShowOnTime] = useState(false);
  const [dataOnTime, setDataOnTime] = useState({});

      //////////////////////////////////////////////////////////////////////////////////////////////////////
  // LOCALITZACIO MINI
  //////////////////////////////////////////////////////////////////////////////////////////////////////

  const [showLocaMini, setShowLocaMini] = useState(false);
  const [dataLocaMini, setDataLocaMini] = useState([]);

  //////////////////////////////////////////////////////////////////////////////////////////////////////
  // INFO RECORREGUT
  //////////////////////////////////////////////////////////////////////////////////////////////////////

  const [showCursa, setShowCursa] = useState(false);
  const [dataCursa, setDataCursa] = useState({});

  /*const dataInfoRecorregut = {recorregutTram: "RECORREGUT TOTAL", cursaTram: "Aguiló-Gòsol", longitud: "LONGITUD: 100,00 km", desnivell: "DESNIVELL: 1.245 m", tipus: "ULTRA", startPercent: "28", percent:"45.7"}
  */
  //////////////////////////////////////////////////////////////////////////////////////////////////////
  // INFO PUNT
  //////////////////////////////////////////////////////////////////////////////////////////////////////


  const [showInfoPunt, setShowInfoPunt] = useState(false);
  const [dataInfoPunt, setDataInfoPunt] = useState([]);

  /*const dataInfoPunt = {punt:"Gòsol", puntU: "U6", tipus: "ULTRA", startPercent: "28", percent:"45.7"}
  */
  //////////////////////////////////////////////////////////////////////////////////////////////////////
  // TOP3
  //////////////////////////////////////////////////////////////////////////////////////////////////////

  const [showTop3, setShowTop3] = useState(false);
  const [dataTop3, setDataTop3] = useState([]);
  const [dataTitolTop3 , setDataTitolTop3 ] = useState([]);

  /*const dataTitolTop3 = {top: 'TOP 3 MASCULÍ', cursa: 'ULTRA', }*/

 /* const dataTop3 = [
    {class: "1", atleta: 'COGNOM N.', dorsal: '123', equip: 'ABC', checkpoint: 'checkpoint', temps:"04h34'45''", pais: 'es', follow: "0"},
    {class: "2", atleta: 'COGNOM N.', dorsal: '123', equip: 'ABC', checkpoint: 'checkpoint', temps:"04h34'45''", pais: 'es', follow: "0"},
    {class: "3", atleta: 'COGNOM N.', dorsal: '123', equip: 'ABC', checkpoint: 'checkpoint', temps:"04h34'45''", pais: 'ad', follow: "0"},

  ]*/

  //////////////////////////////////////////////////////////////////////
  // BACKGROUND
  ///////////////////////////////////////////////////////////////////////

  const [showContainer, setShowClassificacioCont] = useState(true);

  const containerClassificacio = {
    width: '1960px',
    height: '1115px',
    display: showContainer ? 'block' : 'none',
    position: 'relative',
    backgroundColor: 'transparent', // Control dinámico del fondo 'transparent'
    /*backgroundImage: `url(${backgroundclas})`, // URL de la imagen de fondo*/
    backgroundSize: 'auto', // Tamaño de la imagen de fondo (manteniendo la resolución original)
    backgroundPosition: '0 0', // Posición de la imagen de fondo (top-left)
    backgroundRepeat: 'no-repeat', // No repetir la imagen de fondo*/
    transform: `scale(100%)`,

  };


  //////////////////////////////////////////////////////////////////////////////////////////////////////
  // WEBSOCKET
  //////////////////////////////////////////////////////////////////////////////////////////////////////

  useEffect(() => {

    // Conexión al servidor de sockets
    const socket = socketIOClient('http://localhost:10011');

    // CLASSIFICACIO

    /*socket.on('showClassificacio', (newShowClassificacio) => {
      setShowClassificacio(newShowClassificacio);
    });*/


    // CLASSIFICACIO
    socket.on('showClassificacio', (newClassificacio) => {
      setShowClassificacio(newClassificacio);
    });
    socket.on('dataClassificacio', (newDataClassificacio) => {
      setDataClassificacio(newDataClassificacio);
    });
    socket.on('dataTitolClassificacio', (newDataTitolClasificacio) => {
      setDataTitolClasificacio(newDataTitolClasificacio);
    });

    // CLASSIFICACIO MINI
    socket.on('showClassificacioMini', (newClassificacio) => {
      setShowClassificacioMini(newClassificacio);
    });
    socket.on('dataClassificacioMini', (newDataClassificacio) => {
      setDataClassificacioMini(newDataClassificacio);
    });
    socket.on('dataTitolClassificacioMini', (newDataTitolClasificacio) => {
      setDataTitolClasificacioMini(newDataTitolClasificacio);
    });

    // CLASSIFICACIO PROVISIONAL
    socket.on('showClassificacioProv', (newClassificacioProv) => {
      setShowClassificacioProv(newClassificacioProv);
    });
    socket.on('dataClassificacioProv', (newDataClassificacioProv) => {
      setDataClassificacioProv(newDataClassificacioProv);
    });
    socket.on('dataTitolClasificacioProv', (newDataTitolClasificacioProv) => {
      setDataTitolClasificacioProv(newDataTitolClasificacioProv);
    });

    // FOOTER

    socket.on('showFooter', (newShowFooter) => {
      setShowFooter(newShowFooter);
    });

    socket.on('showFooter2', (newShowFooter2) => {
      setShowFooter2(newShowFooter2);
    });

    socket.on('dataFooter', (newDataFooter) => {
      setDataFooter(newDataFooter);
    });

    // CHYRON RUNNER
    socket.on('showChyronRunner', (newShowChyronRunner) => {
      setShowChyronRunner(newShowChyronRunner)
    });

    socket.on('dataChyronRunner', (newDataChyronRunner) => {
      setDataChyronRunner(newDataChyronRunner)
    });

    socket.on('dataChyronRunner', (newDataChyronRunner) => {
      setDataChyronRunner(newDataChyronRunner)
    });

    socket.on('positionChyronRunner', (newPositionChyronRunner) => {
      setPositionChyronRunner(newPositionChyronRunner)
    });


    // CHYRON DOBLE RUNNER
    socket.on('showDobleChyronRunner', (newShowChyronRunner) => {
      setShowDobleChyronRunner(newShowChyronRunner)
    });

    socket.on('dataDobleChyronRunner', (newDataChyronRunner) => {
      setDataDobleChyronRunner(newDataChyronRunner)
    });



    // VELOCITAT
    socket.on('showVelocitat', (newShowVelocitat) => {
      setShowVelocitat(newShowVelocitat)
    });

    socket.on('dataVelocitat', (newDataVelocitat) => {
      setDataVelocitat(newDataVelocitat)
    });

    // Difference
    socket.on('showDifferenceUp', (newShowDifferenceUp) => {
      setShowDifferenceUp(newShowDifferenceUp)
    });

    socket.on('showDifferenceDown', (newShowDifferenceDown) => {
      setShowDifferenceDown(newShowDifferenceDown)
    });

    socket.on('dataDifference', (newDataDifference) => {
      setDataDifference(newDataDifference)
    });

    // PERFIL
    socket.on('showPerfil', (newShowPerfil) => {
      setShowPerfil(newShowPerfil)
      console.log(newShowPerfil)
    });

    socket.on('dataPerfil', (newDataPerfil) => {
      setDataPerfil(newDataPerfil)
    });

    // LOCALITZACIO MINI
    socket.on('showLocaMini', (newShowLocaMini) => {
      setShowLocaMini(newShowLocaMini)
      console.log(newShowLocaMini)
    });

    socket.on('dataLocaMini', (newDataLocaMini) => {
      setDataLocaMini(newDataLocaMini)
    });

    // INFO CURSA
    socket.on('showCursa', (newShowInfoRecorregut) => {
      setShowCursa(newShowInfoRecorregut)
    });

    socket.on('dataCursa', (newDataInfoRecorregut) => {
      setDataCursa(newDataInfoRecorregut)
    });

    // INFO PUNT
    socket.on('showInfoPunt', (newShowInfoPunt) => {
      setShowInfoPunt(newShowInfoPunt)
    });

    socket.on('dataInfoPunt', (newDataInfoPunt) => {
      setDataInfoPunt(newDataInfoPunt)
    });
  
    // TOP 3
    socket.on('showTop3', (newShowTop3) => {
      setShowTop3(newShowTop3)
    });

    socket.on('dataTop3', (newDataTop3) => {
      setDataTop3(newDataTop3)
    });

    socket.on('dataTitolTop3', (newdataTitolTop3) => {
      setDataTitolTop3(newdataTitolTop3)
    });

    // On TIME
    socket.on('showOnTime', (newShowTime) => {
      setShowOnTime(newShowTime)
    });

    socket.on('dataOnTime', (newDataOnTime) => {
      setDataOnTime(newDataOnTime)
    });



    

    /*socket.on('dataClassificacio', (newDataClassificacio) => {
      setDataClassificacio(newDataClassificacio);
    });*/



    // Desconexión del socket cuando se desmonta el componente
    return () => {
      socket.disconnect();

    }; 
  }, []);


  ///////////////////////////////////////////////////////////////////////////////////
  // RETURN
  ///////////////////////////////////////////////////////////////////////////////////

  return (
  <div>
    {/* CONTAINER */}
    <div className="app" style={containerClassificacio}>
      {/* CLASSIFICACIO */}
      {<Classificacio data={dataClassificacio} show={showClassificacio} dataTitol={dataTitolClasificacio}/>}
      {<ClassificacioMini data={dataClassificacioMini} show={showClassificacioMini} dataTitol={dataTitolClasificacioMini}/>}
      {/* FOOTER */}
      {/*<Footer show={false} dataFooter={dataFooter}/>}
      {/* CHYRON RUNNER */}
      {<ChyronRunner data={dataChyronRunner} position={positionChyronRunner} show={showChyronRunner} />}
      {<DobleChyronRunner data={dataDobleChyronRunner} show={showDobleChyronRunner} />}
      {/* VELOCITAT */}
      {<Perfil show={showPerfil} data={dataPerfil} />}
      {<Velo2 show={showVelocitat} data={dataVelocitat} />}
      {/* PERFIL */}
      {/*<LocalitzacioMini show={false} data={dataLocaMini} />*/}
      {/* INFO RECORREGUT */}
      {/*<Cursa data={dataCursa} show={showCursa} />}
      {/* INFO PUNT */}
      {<Punts data={dataInfoPunt} show={showInfoPunt} />}
      {/* INFO PUNT */}
      {/*<Top3 data={dataTop3} show={false} dataTitol={dataTitolTop3}/>*/}
      {<OnTime data={dataOnTime} show={showOnTime} showDifferenceUp={showDifferenceUp} />}
      {<DifferenceUp show={showDifferenceUp} data={dataDifference}/>}
    
    </div>
  </div>
  );
}


export default App;