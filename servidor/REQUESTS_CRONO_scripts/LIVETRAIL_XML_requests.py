import json
import os
import hashlib
import requests
import xml.etree.ElementTree as ET
import time

HASH_FILE = "raceClassifications_hash.json"

# ----------------- Utilidades -----------------

def fetch_xml(url):
    r = requests.get(url)
    r.raise_for_status()
    return r.text

def time_str_to_seconds(time_str):
    if not time_str:
        return 0
    h, m, s = [int(x) for x in time_str.split(":")]
    return h * 3600 + m * 60 + s

def compute_runner_hash(runner):
    hash_input = f"{runner.get('doss')}|{runner.get('lastpt')}|{runner.get('lasth')}|{runner.get('tps')}"
    return hashlib.md5(hash_input.encode('utf-8')).hexdigest()

# ----------------- Parsers -----------------

def parse_classement_xml(xml_content):
    root = ET.fromstring(xml_content)
    results = []
    for c in root.findall('.//classement/c'):
        results.append({
            'pos': c.attrib.get('class', ''),
            'doss': c.attrib.get('doss', ''),
            'nombre': f"{c.attrib.get('prenom', '')} {c.attrib.get('nom', '')}".strip(),
            'sexo': c.attrib.get('sx', ''),
            'club': c.attrib.get('club', ''),
            'categoria': c.attrib.get('cat', ''),
            'pos_categoria': c.attrib.get('classcat', ''),
            'tiempo': c.attrib.get('tps', ''),
            'ecart': c.attrib.get('ecart', '')
        })
    return results

def seconds_to_hms(seconds):
    h = seconds // 3600
    m = (seconds % 3600) // 60
    s = seconds % 60
    return f"{int(h):02d}:{int(m):02d}:{int(s):02d}"

def parse_tete_xml(xml_content, remove_first_runner=True):
    root = ET.fromstring(xml_content)
    results = []
    runners = root.findall('.//lst/c')
    
    if not runners:
        return results

    # Tiempo del primer corredor
    first_time = time_str_to_seconds(runners[0].attrib.get('tps', '0:0:0'))

    for i, c in enumerate(runners):
        if remove_first_runner and i == 0:
            continue
        tps_runner = c.attrib.get('tps', '0:0:0')
        ecart_seconds = time_str_to_seconds(tps_runner) - first_time
        ecart_hms = seconds_to_hms(ecart_seconds) if ecart_seconds > 0 else "00:00:00"

        corredor = {
            'doss': c.attrib.get('doss', ''),
            'nombre': f"{c.attrib.get('prenom', '')} {c.attrib.get('nom', '')}".strip(),
            'sexo': c.attrib.get('sx', ''),
            'club': c.attrib.get('club', ''),
            'pais': c.attrib.get('pays', ''),
            'categoria': c.attrib.get('cat', ''),
            'tiempo': tps_runner,
            'ecart': ecart_hms,
            'idpt': c.attrib.get('idpt', ''),
            'lastpt': c.attrib.get('lastpt', ''),
            'lasth': c.attrib.get('lasth', ''),
            'finish': c.attrib.get('finish', ''),
            'foto': c.attrib.get('ph', ''),
        }
        results.append(corredor)
    return results


# ----------------- Clasificación por puntos -----------------

def fetch_classification_points(race_id, points, sex):
    base_url = f"https://traildelbisaura.livetrail.net/classementPoint.php?course={race_id}&cat=scratch{sex}&pt="
    clas_points = {}
    for pt in points:
        url = f"{base_url}{pt}"
        try:
            r = requests.get(url)
            r.raise_for_status()
            root = ET.fromstring(r.content)
            classement = root.find('classement')
            top_20 = []
            if classement is not None and len(classement):
                # primer tiempo en segundos (del primer clasificado)
                first_time_s = time_str_to_seconds(classement[0].attrib.get('tps', '0:0:0'))
                for runner in classement[:20]:
                    tps_runner = runner.attrib.get('tps', '0:0:0')
                    runner_s = time_str_to_seconds(tps_runner)

                    # diferencia en segundos (no minutos)
                    diff_s = max(0, runner_s - first_time_s)

                    # ecart en formato hh:mm:ss y también en minutos (float, 2 decimales)
                    ecart_hms = seconds_to_hms(int(diff_s))
                    ecart_min = round(diff_s / 60.0, 2)

                    top_20.append({
                        'clt': runner.get('clt'),
                        'doss': runner.get('doss'),
                        'nombre': f"{runner.get('prenom', '')} {runner.get('nom', '')}".strip(),
                        'club': runner.get('club'),
                        'cod': runner.get('cod'),
                        'a3': runner.get('a3'),
                        'tps': tps_runner,
                        'j': runner.get('j'),
                        'h': runner.get('h'),
                        'ecart': ecart_hms,      # diferencia formateada hh:mm:ss
                        'ecart_min': ecart_min  # diferencia en minutos (float)
                    })
            clas_points[pt] = top_20
        except Exception as e:
            print(f"⚠️ Error fetch_classification_points {race_id} pt={pt} sex={sex}: {e}")
    return clas_points


# ----------------- Función principal -----------------

def get_all_classifications(base_url, races, race_details_path, output_file="raceClassifications.json"):
    try:
        with open(HASH_FILE, 'r', encoding='utf-8') as f:
            prev_hashes = json.load(f)
    except FileNotFoundError:
        prev_hashes = {}

    with open(race_details_path, 'r', encoding='utf-8') as f:
        race_details = json.load(f)

    all_results = []

    for race in races:
        race_id = race.get('id')
        title = race.get('title', 'Sin título')
        print(f"📥 Procesando carrera: {title} ({race_id})")

        race_entry = {
            'id': race_id,
            'title': title,
            'clasification': {'final_men': [], 'final_women': []},
            'provisional': {'provisional_men': [], 'provisional_women': []},
            'clasification_points': {'men': {}, 'women': {}}
        }

        # Buscar la carrera dentro de la lista de race_details
        race_info = next((r for r in race_details if r.get('id') == race_id), None)

        if not race_info:
            print(f"⚠️ No se encontró información para la carrera '{race_id}' en raceDetails.json")
            continue

        points = [pt['idpt'] for pt in race_info.get('points', [])]


        try:
            # Clasificación final
            xml_men = fetch_xml(f"{base_url}/classement.php?course={race_id}&cat=scratchH")
            xml_women = fetch_xml(f"{base_url}/classement.php?course={race_id}&cat=scratchF")
            race_entry['clasification']['final_men'] = parse_classement_xml(xml_men)
            race_entry['clasification']['final_women'] = parse_classement_xml(xml_women)

            # Clasificación provisional
            xml_tete_men = fetch_xml(f"{base_url}/teteCourse.php?course={race_id}&cat=scratchH")
            xml_tete_women = fetch_xml(f"{base_url}/teteCourse.php?course={race_id}&cat=scratchF")
            race_entry['provisional']['provisional_men'] = parse_tete_xml(xml_tete_men)
            race_entry['provisional']['provisional_women'] = parse_tete_xml(xml_tete_women)

            # Clasificación por puntos
            race_entry['clasification_points']['men'] = fetch_classification_points(race_id, points, 'H')
            race_entry['clasification_points']['women'] = fetch_classification_points(race_id, points, 'F')

        except Exception as e:
            print(f"⚠️ Error procesando {race_id}: {e}")

        all_results.append(race_entry)

    os.makedirs(os.path.dirname(output_file) or '.', exist_ok=True)
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_results, f, indent=2, ensure_ascii=False)

    with open(HASH_FILE, 'w', encoding='utf-8') as f:
        json.dump(prev_hashes, f, indent=2, ensure_ascii=False)

    print(f"✅ Archivo generado: {output_file}")
    return all_results

# ----------------- Refresco automático -----------------

if __name__ == "__main__":
    base_url = "https://traildelbisaura.livetrail.net"
    race_details_path = "./raceDetails.json"
    curses = {
        "TRAIL":{ "cursa":"EL PUTU TRAIL", "abreviacio":"El Puto Trail", "id":"trail", "subtitle":"39km / 2300m+", "track":"el-putu-trail-del-bisaura-2025.gpx"},
        "MITJA":{ "cursa":"LA MITJA I PICO", "abreviacio":"La Mitja i Pico", "id":"mitja", "subtitle":"25km / 1500m+", "track":"trail-del-bisaura-la-mitja-i-pico-2025.gpx"},
        "CURTA":{ "cursa":"LA NO TANT CURTA", "abreviacio":"La No Tant Curta", "id":"curta", "subtitle":"14km / 700m+", "track":"la-no-tant-curta-trail-del-bisaura-2025.gpx"}
    }

    races = [{"id": v["id"], "title": v["cursa"]} for v in curses.values()]
    REFRESH_INTERVAL = 30
    output_file = "raceClasifications.json"

    while True:
        try:
            get_all_classifications(base_url, races, race_details_path, output_file)
            print(f"✅ Refresco completado. Próximo en {REFRESH_INTERVAL}s")
        except Exception as e:
            print(f"⚠️ Error en el refresco: {e}")
        time.sleep(REFRESH_INTERVAL)
