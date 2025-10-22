import fetch from 'node-fetch';
import xml2js from 'xml2js';

// URLs
const URL_GENERAL = 'https://traildelbisaura.livetrail.net/';
const URL_POINTS = `${URL_GENERAL}parcours.php`;

// Función para obtener XML
async function fetchXML(url) {
  const res = await fetch(url);
  return await res.text();
}

// Función principal
async function buildJSON() {
  try {
    // Descargamos ambos XML
    const [xmlGeneral, xmlPoints] = await Promise.all([
      fetchXML(URL_GENERAL),
      fetchXML(URL_POINTS)
    ]);

    const parser = new xml2js.Parser({ explicitArray: false });

    const generalData = await parser.parseStringPromise(xmlGeneral);
    const pointsData = await parser.parseStringPromise(xmlPoints);

    // Creamos un diccionario de carreras desde la info general
    const races = {};
    const generalRaces = generalData.d.e?.filter(e => e.$?.id) || [];
    for (const e of generalRaces) {
      races[e.$.id] = {
        id: e.$.id,
        title: e.$.titre,
        subtitle: e.$.sstitre || '',
        startInfo: e.info?.$ || {},
        points: []
      };
    }

    // Añadimos los puntos de parcours.php (nombres completos, coords y tiempos)
    const pointsList = pointsData.d.points;
    if (pointsList) {
      const pointsArray = Array.isArray(pointsList) ? pointsList : [pointsList];
      for (const pts of pointsArray) {
        const courseId = pts.$.course;
        if (!races[courseId]) continue;
        const ptsData = pts.pt;
        if (!ptsData) continue;
        races[courseId].points = (Array.isArray(ptsData) ? ptsData : [ptsData]).map(p => {
          const { idpt, n, nc, km, lat, lon, hp, hd, b, meet, d, a } = p.$;
          return { idpt, n, nc, km, lat, lon, hp, hd, b, meet, d, a };
        });
      }
    }

    console.log(JSON.stringify(Object.values(races), null, 2));

  } catch (err) {
    console.error('Error:', err);
  }
}

buildJSON();
