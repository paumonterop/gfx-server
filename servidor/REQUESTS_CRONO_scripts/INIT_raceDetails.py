import requests
import xml.etree.ElementTree as ET
import json
from urllib.parse import urljoin

def fetch_xml(url):
    resp = requests.get(url)
    resp.raise_for_status()
    return resp.text

def get_races_info(url_general):
    # Generar URL de puntos automáticamente
    url_points = urljoin(url_general, 'parcours.php')

    # Descargar XML
    xml_general = fetch_xml(url_general)
    xml_points = fetch_xml(url_points)

    # Parse XML general
    root_general = ET.fromstring(xml_general)
    races = {}
    for e in root_general.findall('.//e[@id]'):
        race_id = e.attrib['id']
        races[race_id] = {
            'id': race_id,
            'title': e.attrib.get('titre', ''),
            'subtitle': e.attrib.get('sstitre', ''),
            'startInfo': e.find('info').attrib if e.find('info') is not None else {},
            'points': []
        }

    # Parse XML points
    root_points = ET.fromstring(xml_points)
    for points in root_points.findall('.//points'):
        course_id = points.attrib.get('course')
        if course_id not in races:
            continue
        for pt in points.findall('pt'):
            attrib = pt.attrib
            point_data = {k: attrib.get(k, '') for k in ['idpt','n','nc','km','lat','lon','hp','hd','b','meet','d','a']}
            races[course_id]['points'].append(point_data)

        # Ordenar puntos por idpt
        races[course_id]['points'].sort(key=lambda x: int(x['idpt']))

    # Convertir a lista
    json_data = list(races.values())

    # Guardar en archivo
    with open('raceDetails.json', 'w', encoding='utf-8') as f:
        json.dump(json_data, f, indent=2, ensure_ascii=False)

    # También imprimir en consola
    print(json.dumps(json_data, indent=2, ensure_ascii=False))


if __name__ == '__main__':
    print('hola')
    url_general = "https://traildelbisaura.livetrail.net/" ## amb / al final
    get_races_info(url_general)
