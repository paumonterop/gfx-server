import csv
import xml.etree.ElementTree as ET
import requests
import json
from app_modules import *

# Abrir el archivo JSON y cargar su contenido en un diccionario de Python
with open('config.json', 'r') as file:
    config = json.load(file)

######################################################
## FUNCIO GET TETE
######################################################

def getTete(url, csv_file):
    # Realizar la solicitud GET
    response = requests.get(url)
    #print(response.content.decode('utf-8'))

    # Parse the XML data
    tree = ET.ElementTree(ET.fromstring(response.content.decode('utf-8')))
    root = tree.getroot()

    # Extraer los nombres de los puntos de control
    control_points = {}
    for point in root.find('points').findall('p'):
        idpt = point.get('idpt')
        nombre_pt = point.get('n')
        control_points[idpt] = nombre_pt

    # Crear la cabecera del CSV
    header = [
        'dorsal', 'sexo', 'nombre', 'apellido', 'club', 'pais', 'categoria',
        'ultimo_punto_id', 'ultimo_punto_nombre', 'ultimo_tiempo', 'total_tiempo', 'finish'
    ]
    for idpt, nombre_pt in control_points.items():
        header.append(f'tps_{idpt} - {nombre_pt}')
        header.append(f'clt_{idpt} - {nombre_pt}')

    # Open a CSV file to write the data
    with open(csv_file, 'w', newline='', encoding='utf-8') as csvfile:
        csvwriter = csv.writer(csvfile)

        # Write the header row
        csvwriter.writerow(header)

        # Loop through each corredor
        for corredor in root.find('lst').findall('c'):
            dorsal = corredor.get('doss')
            sexo = corredor.get('sx')
            nombre = corredor.get('nom')
            apellido = corredor.get('prenom')
            club = corredor.get('club')
            pais = corredor.get('pays')
            categoria = corredor.get('cat')
            finsih = corredor.get('finish')

            # Extraer datos generales del corredor
            ultimo_punto_id = corredor.get('lastpt')  # Último punto alcanzado
            ultimo_punto_nombre = UIFunctions.puntos_mapping_ultra.get(ultimo_punto_id)

            ultimo_tiempo = corredor.get('tpetp')  # Tiempo en el último punto alcanzado
            total_tiempo = corredor.get('tps')  # Tiempo total (si está disponible)

            # Crear diccionarios para los tiempos de paso y clasificaciones, inicializados en None
            tiempos_paso = {f'tps_{idpt} - {nombre_pt}': None for idpt, nombre_pt in control_points.items()}
            clasificaciones = {f'clt_{idpt} - {nombre_pt}': None for idpt, nombre_pt in control_points.items()}

            # Verificar si existe el elemento <pass>
            pass_element = corredor.find('pass')
            if pass_element is not None:
                # Loop through each paso (time point) for the current corredor
                for paso in pass_element.findall('e'):
                    idpt = paso.get('idpt')
                    if idpt in control_points:
                        tiempos_paso[f'tps_{idpt} - {control_points[idpt]}'] = paso.get('tps')
                        clasificaciones[f'clt_{idpt} - {control_points[idpt]}'] = paso.get('clt')

            # Combinar todos los datos del corredor en una sola fila
            row = [
                      dorsal, sexo, nombre, apellido, club, pais, categoria,
                      ultimo_punto_id, ultimo_punto_nombre, ultimo_tiempo, total_tiempo, finsih
                  ] + \
                  [tiempos_paso[f'tps_{idpt} - {nombre_pt}'] for idpt, nombre_pt in control_points.items()] + \
                  [clasificaciones[f'clt_{idpt} - {nombre_pt}'] for idpt, nombre_pt in control_points.items()]

            # Write the row to the CSV file
            csvwriter.writerow(row)


def getClass(url, csv_file):
    response = requests.get(url)

    tree = ET.ElementTree(ET.fromstring(response.content.decode('utf-8')))
    root = tree.getroot()

    # Crear una lista para almacenar los datos de los corredores
    corredores = []

    # Iterar sobre cada corredor en el XML
    for corredor in root.findall('.//classement/c'):
        # Extraer los datos de cada corredor
        datos = {
            'Posición': corredor.get('class'),
            'Dorsal': corredor.get('doss'),
            'Nombre': corredor.get('nom'),
            'Apellido': corredor.get('prenom'),
            'Sexo': corredor.get('sx'),
            'Club': corredor.get('club'),
            'País': corredor.get('p'),
            'Código País': corredor.get('a3'),
            'Categoría': corredor.get('cat'),
            'Clasificación Categoría': corredor.get('classcat'),
            'Tiempo': corredor.get('tps'),
            'Ecart': corredor.get('ecart'),
        }
        corredores.append(datos)

    # Filtrar solo los 20 primeros clasificados
    corredores_top_20 = corredores[:20]

    try:
        # Escribir los datos filtrados en un archivo CSV
        with open(csv_file, mode='w', newline='', encoding='utf-8') as file:
            writer = csv.DictWriter(file, fieldnames=corredores_top_20[0].keys())
            writer.writeheader()
            writer.writerows(corredores_top_20)
    except FileNotFoundError as e:
        print(f"Error: Archivo no encontrado - {e}")
    except IOError as e:
        print(f"Error de E/S al intentar escribir en el archivo - {e}")
    except Exception as e:
        print(f"Error inesperado: {e}")


def guardar_clasificacion_puntos(cursa, puntos, sex, archivo_salida):
    """
    Obtiene la clasificación de los 20 primeros corredores en cada punto de control y lo guarda en un archivo JSON.

    :param puntos: Lista de puntos de control (idpt) a consultar.
    :param archivo_salida: Nombre del archivo JSON donde se guardarán los datos.
    """
    # Base URL del endpoint de clasificación
    url_server = config['xml_urls']['url_server']
    base_url = "{}classementPoint.php?course={}&cat=scratch{}&pt=".format(url_server, cursa, sex)

    # Estructura para almacenar todas las clasificaciones
    all_classifications = {}

    # Para cada punto de control
    for point in puntos:
        # Construir la URL completa para el punto de control
        url = f"{base_url}{point}"

        # Realizar la solicitud HTTP
        response = requests.get(url)
        # Verificar que la solicitud fue exitosa
        if response.status_code == 200:
            # Parsear el XML recibido
            root = ET.fromstring(response.content)

            # Extraer la clasificación de los corredores
            classement = root.find('classement')
            if classement is not None:
                # Obtener los 20 primeros corredores
                top_20 = []
                for runner in classement[:20]:
                    # Extraer los atributos requeridos
                    data = {
                        'clt': runner.get('clt'),
                        'nom': runner.get('nom'),
                        'prenom': runner.get('prenom'),
                        'doss': runner.get('doss'),
                        'club': runner.get('club'),
                        'cod': runner.get('cod'),
                        'a3': runner.get('a3'),
                        'tps': runner.get('tps'),
                        'j': runner.get('j'),
                        'h': runner.get('h'),
                        'ecart': runner.get('ecart')
                    }
                    top_20.append(data)

                # Guardar la clasificación en el diccionario
                all_classifications[point] = top_20

    # Guardar los resultados en un archivo JSON
    with open(archivo_salida, 'w', encoding='utf-8') as json_file:
        json.dump(all_classifications, json_file, ensure_ascii=False, indent=4)

    #print(f"Datos guardados en '{archivo_salida}'")

#################################################################################
#       MAIN MAIN MAIN MAIN MAIN MAIN MAIN MAIN
#################################################################################

getTete(config['xml_urls']['url_ultraTete_h'], 'Ultra_Tete_H.csv')
getTete(config['xml_urls']['url_ultraTete_f'], 'Ultra_Tete_F.csv')
getClass(config['xml_urls']['url_ultraClas_h'], 'Ultra_Clas_H.csv')
getClass(config['xml_urls']['url_ultraClas_f'], 'Ultra_Clas_F.csv')

getTete(config['xml_urls']['url_maratoTete_h'], 'Marato_Tete_H.csv')
getTete(config['xml_urls']['url_maratoTete_f'], 'Marato_Tete_F.csv')
getClass(config['xml_urls']['url_maratoClas_h'], 'Marato_Clas_H.csv')
getClass(config['xml_urls']['url_maratoClas_f'], 'Marato_Clas_F.csv')

# Ejemplo de uso
#puntosUltra = ["0", "2", "4", "6", "8", "10", "12", "14", "18", "20", "22", "80", "100"]
#guardar_clasificacion_puntos('ultra', puntosUltra, 'H', 'ClassificationPointsUltraH.json')
#guardar_clasificacion_puntos('ultra', puntosUltra, 'F', 'ClassificationPointsUltraF.json')
#guardar_clasificacion_puntos('50kutm', puntosUltra, 'H', 'ClassificationPointsUltraH.json')
#guardar_clasificacion_puntos('50kutm', puntosUltra, 'F', 'ClassificationPointsUltraF.json')

#puntosMarato = ["0", "2", "4", "8", "18", "22", "80", "100"]
#guardar_clasificacion_puntos('marato', puntosMarato, 'H', 'ClassificationPointsMaratoH.json')
#guardar_clasificacion_puntos('marato', puntosMarato, 'F', 'ClassificationPointsMaratoF.json')
#guardar_clasificacion_puntos('30k', puntosMarato, 'H', 'ClassificationPointsMaratoH.json')
#guardar_clasificacion_puntos('30k', puntosMarato, 'F', 'ClassificationPointsMaratoF.json')

print('Refresh NoLimit Ejecutado.')




