import requests
import xml.etree.ElementTree as ET
import json


def guardar_clasificacion_puntos(cursa, puntos, sex, archivo_salida):
    """
    Obtiene la clasificación de los 20 primeros corredores en cada punto de control y lo guarda en un archivo JSON.

    :param puntos: Lista de puntos de control (idpt) a consultar.
    :param archivo_salida: Nombre del archivo JSON donde se guardarán los datos.
    """
    # Base URL del endpoint de clasificación
    base_url = "https://traildelbisaura.livetrail.net/classementPoint.php?course={}&cat=scratch{}&pt=".format(cursa, sex)

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


# Ejemplo de uso
puntosTrail = ["0", "2", "4", "6", "8", "10", "12", "14", "18", "20", "22", "80", "100"]
guardar_clasificacion_puntos('trail', puntosTrail, 'H', 'ClassificationPointsUltraH.json')
guardar_clasificacion_puntos('trail', puntosTrail, 'F', 'ClassificationPointsUltraF.json')




