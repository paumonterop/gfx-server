const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*", // o el puerto que use tu app
    methods: ["GET", "POST"]
  }
});



// ESTATS INICIALS
let showClassificacio = false;
let dataClassificacio = [{class: " ", atleta: " ", dorsal: " ", equip: " ", checkpoint: " ", temps:" ", pais:  " "}]
let dataTitolClasificacio = {top: ' ', cursa: ' ', classificacio: ' ', leader: " "};

let showClassificacioMini = false;
let dataClassificacioMini = [{class: " ", atleta: " ", dorsal: " ", equip: " ", checkpoint: " ", temps:" ", pais:  " "}]
let dataTitolClasificacioMini = {top: ' ', cursa: ' ', classificacio: ' ', leader: " "};

let showFooter = false;
let showFooter2 = 0;
let dataFooter = {titular: " ", title: " ", pos1: " ", pos2: " ", pos3: " "}

let showChyronRunner = false;
let dataChyronRunner = {class: " ", atleta: " ", dorsal: " ", equip: " ", tipus: " ", pais: " ", percent: " ", toFinish: " ", gap: " "}
let positionChyronRunner = null

let showDobleChyronRunner = false;
let dataDobleChyronRunner = {class: " ", atleta: " ", dorsal: " ", equip: " ", tipus: " ", pais: " ", percent: " ", toFinish: " ", gap: " "}

let showVelocitat = false;
let dataVelocitat = {atleta: " ", ActMit: " ", tipPo: " ", percent: " ", velocitat: " ", tipus: " "}

let showDifferenceUp = false;
let showDifferenceDown = false;
let dataDiference = {}

let showPerfil = false
let dataPerfil = {}

let showInfoRecorregut = false;
let dataInfoRecorregut = {recorregutTram: " ", cursaTram: " ", longitud: " ", desnivell: " ", tipus: " ", startPercent: " ", percent:" "}

let showInfoPunt = false;
let dataInfoPunt = {punt:" ", puntU: " ", tipus: " ", startPercent: " ", percent:" "}

let showOnTime = false;
let dataOnTime = {cursa: 'Matxos'}

let showTop3 = false;
let dataTop3 = {class: " ", atleta: ' ', dorsal: ' ', equip: ' ', checkpoint: ' ', temps:" ", pais: ' ', follow: " "}
let dataTitolTop3 = {top: ' ', cursa: ' ', }



// Manejo de conexiones de sockets
io.on('connection', (socket) => {
  console.log('Cliente conectado');

  // CLASSIFICACIO
  socket.on('showClassificacioOn', (newShowClassificacioFinal) => {
    showClassificacio = true;
    io.emit('showClassificacio', showClassificacio);
    console.log(showClassificacio)
  });

  socket.on('showClassificacioOff', (newShowClassificacioFinal) => {
    showClassificacio = false;
    io.emit('showClassificacio', showClassificacio);
    console.log(showClassificacio)
  });

  socket.on('dataClassificacio', (newdataClassificacioFinal) => {
    dataClassificacio = newdataClassificacioFinal;
    io.emit('dataClassificacio', dataClassificacio);
  });

  socket.on('dataTitolClassificacio', (newdataTitolClasificacioFinal) => {
    dataTitolClasificacio = newdataTitolClasificacioFinal;
    io.emit('dataTitolClassificacio', dataTitolClasificacio);
    console.log(dataTitolClasificacio)
  });

  // CLASSIFICACIO MINI
  socket.on('showClassificacioMiniOn', (newShowClassificacioFinal) => {
    showClassificacio = true;
    io.emit('showClassificacioMini', showClassificacio);
    console.log(showClassificacio)
  });

  socket.on('showClassificacioMiniOff', (newShowClassificacioFinal) => {
    showClassificacio = false;
    io.emit('showClassificacioMini', showClassificacio);
  });

  socket.on('dataClassificacioMini', (newdataClassificacioFinal) => {
    dataClassificacio = newdataClassificacioFinal;
    io.emit('dataClassificacioMini', dataClassificacio);
  });

  socket.on('dataTitolClassificacioMini', (newdataTitolClasificacioFinal) => {
    dataTitolClasificacio = newdataTitolClasificacioFinal;
    io.emit('dataTitolClassificacioMini', dataTitolClasificacio);
  });

  // CLASSIFICACIO PROVISIONAL
  socket.on('showClassificacioProvOn', (newShowClassificacioProv) => {
    showClassificacioProv = true;
    io.emit('showClassificacioProv', showClassificacioProv);
  });

  socket.on('showClassificacioProvOff', (newShowClassificacioProv) => {
    showClassificacioProv = false;
    io.emit('showClassificacioProv', showClassificacioProv);
  });

  socket.on('dataClassificacioProv', (newdataClassificacioProv) => {
    dataClassificacioProv = newdataClassificacioProv;
    io.emit('dataClassificacioProv', dataClassificacioProv);
  });

  socket.on('dataTitolClasificacioProv', (newdataTitolClasificacioProv) => {
    dataTitolClasificacioProv = newdataTitolClasificacioProv;
    io.emit('dataTitolClasificacioProv', dataTitolClasificacioProv);
    console.log(dataTitolClasificacioProv)
  });

  // FOOTER
  socket.on('showFooterOn', (newShowFooter) => {
    showFooter = true;
    io.emit('showFooter', showFooter);
    console.log(showFooter)
  });

  socket.on('showFooterOff', (newShowFooter) => {
    showFooter = false;
    io.emit('showFooter', showFooter);
    console.log(showFooter)
  });

  socket.on('showFooter2', (newShowFooter2) => {
    showFooter2 = newShowFooter2;
    io.emit('showFooter2', showFooter2);
    console.log(showFooter2)
  });

  socket.on('dataFooter', (newDataFooter) => {
    dataFooter = newDataFooter;
    io.emit('dataFooter', dataFooter);
    console.log(dataFooter)
  });

  // CHYRON RUNNER
  socket.on('showChyronRunnerOn', (newShowChyronRunner) => {
    showChyronRunner = true;
    io.emit('showChyronRunner', showChyronRunner);
    console.log(showChyronRunner)
  });

  socket.on('showChyronRunnerOff', (newShowChyronRunner) => {
    showChyronRunner = false;
    io.emit('showChyronRunner', showChyronRunner);
    console.log(showChyronRunner)
  });

  socket.on('dataChyronRunner', (newDataChyronRunner) => {
    dataChyronRunner = newDataChyronRunner;
    io.emit('dataChyronRunner', dataChyronRunner);
  });

  socket.on('positionChyronRunner', (newPositionChyronRunner) => {
    positionChyronRunner = newPositionChyronRunner;
    io.emit('positionChyronRunner', positionChyronRunner);
  });

  // DOBLE CHYRON RUNNER
  socket.on('showDobleChyronRunnerOn', (newShowDobleChyronRunner) => {
    showDobleChyronRunner = true;
    io.emit('showDobleChyronRunner', showDobleChyronRunner);
  });

  socket.on('showDobleChyronRunnerOff', (newShowDobleChyronRunner) => {
    showDobleChyronRunner = false;
    io.emit('showDobleChyronRunner', showDobleChyronRunner);
  });

  socket.on('dataDobleChyronRunner', (newDataDobleChyronRunner) => {
    dataDobleChyronRunner = newDataDobleChyronRunner;
    io.emit('dataDobleChyronRunner', dataDobleChyronRunner);
    console.log(dataDobleChyronRunner)

  });



  // VELOCITAT
  socket.on('showVelocitatOn', (newShowVelocitat) => {
    showVelocitat = true;
    io.emit('showVelocitat', showVelocitat);
  });

  socket.on('showVelocitatOff', (newShowVelocitat) => {
    showVelocitat = false;
    io.emit('showVelocitat', showVelocitat);
  });

  socket.on('dataVelocitat', (newDataVelocitat) => {
    dataVelocitat = newDataVelocitat;
    io.emit('dataVelocitat', dataVelocitat);
  });
  
  // DIFFERENCE
  socket.on('showUpOn', (newShowDifferenceUp) => {
    showDifferenceUp = true;
    io.emit('showDifferenceUp', showDifferenceUp);
  });

  socket.on('showUpOff', (newShowDifferenceUp) => {
    showDifferenceUp = false;
    io.emit('showDifferenceUp', showDifferenceUp);
  });

  socket.on('showDownOn', (newShowDifferenceDown) => {
    showDifferenceDown = true;
    io.emit('showDifferenceDown', showDifferenceDown);
  });

  socket.on('showDownOff', (newShowDifferenceDown) => {
    showDifferenceUDown = false;
    io.emit('showDifferenceDown', showDifferenceDown);
  });

  socket.on('dataDifference', (newDataDifference) => {
    dataDifference = newDataDifference;
    io.emit('dataDifference', dataDifference);
  });
  

  // PERFIL
  socket.on('showPerfilOn', (newShowPerfil) => {
    showPerfil = true;
    io.emit('showPerfil', showPerfil);
    console.log(showPerfil)
  });

  socket.on('showPerfilOff', (newShowPerfil) => {
    showPerfil = false;
    io.emit('showPerfil', showPerfil);
  });

  socket.on('dataPerfil', (newDataPerfil) => {
    dataPerfil = newDataPerfil;
    io.emit('dataPerfil', dataPerfil);
    console.log(dataPerfil)
  });

  // CURSA INFO
  socket.on('showCursaOn', (newShowInfoRecorregut) => {
    showInfoRecorregut = true;
    io.emit('showCursa', showInfoRecorregut);
  });

  socket.on('showCursaOff', (newShowInfoRecorregut) => {
    showInfoRecorregut = false;
    io.emit('showCursa', showInfoRecorregut);
  });

  socket.on('dataCursa', (newDataInfoRecorregut) => {
    dataInfoRecorregut = newDataInfoRecorregut;
    io.emit('dataCursa', dataInfoRecorregut);
  });

  // INFO PUNT
  socket.on('showInfoPuntOn', (newShowInfoPunt) => {
    showInfoPunt = true;
    io.emit('showInfoPunt', showInfoPunt);
        console.log(showInfoPunt)

  });

  socket.on('showInfoPuntOff', (newShowInfoPunt) => {
    showInfoPunt = false;
    io.emit('showInfoPunt', showInfoPunt);
    console.log(showInfoPunt)
  });

  socket.on('dataInfoPunt', (newDataInfoPunt) => {
    dataInfoPunt = newDataInfoPunt;
    io.emit('dataInfoPunt', dataInfoPunt);
    console.log(dataInfoPunt)
  });

  // ON TIME
  socket.on('showOnTimeOn', (newShowOnTime) => {
    showOnTime = true;
    io.emit('showOnTime', showOnTime);
  });

  socket.on('showOnTimeOff', (newShowOnTime) => {
    showOnTime = false;
    io.emit('showOnTime', showOnTime);
  });

  socket.on('dataOnTime', (newDataOnTime) => {
    dataOnTime = newDataOnTime;
    io.emit('dataOnTime', dataOnTime);
  });
    
  
  // TOP 3
  socket.on('showTop3On', (newShowTop3) => {
    showTop3 = true;
    io.emit('showTop3', showTop3);
  });

  socket.on('showTop3Off', (newShowTop3) => {
    showTop3 = false;
    io.emit('showTop3', showTop3);
  });

  socket.on('dataTop3', (newDataTop3) => {
    dataTop3 = newDataTop3;
    io.emit('dataTop3', dataTop3);
  });

  socket.on('dataTitolTop3', (newdataTitolTop3) => {
    dataTitolTop3 = newdataTitolTop3;
    io.emit('dataTitolTop3', dataTitolTop3);
  });



  // Manejo de desconexiones de sockets
  socket.on('disconnect', () => {
    console.log('Cliente desconectado');
  });
});

// Configuración del puerto del servidor
const port = process.env.PORT || 10011; 
server.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
