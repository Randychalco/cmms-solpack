const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { Plant, Area, Machine, SubMachine } = require('../models');

// Datos maestros de estructura jerárquica
const masterData = [
    { id: 1, planta: 'STRETCH', area: 'EXTRUSION', equipo: 'SML 1', subEquipo: 'WINDER' },
    { id: 2, planta: 'STRETCH', area: 'EXTRUSION', equipo: 'SML 1', subEquipo: 'EXTRUSOR' },
    { id: 3, planta: 'STRETCH', area: 'EXTRUSION', equipo: 'SML 1', subEquipo: 'CHILL ROLL' },
    { id: 4, planta: 'STRETCH', area: 'EXTRUSION', equipo: 'SML 1', subEquipo: 'DOSIFICADOR' },
    { id: 5, planta: 'STRETCH', area: 'EXTRUSION', equipo: 'SML 1', subEquipo: 'EREMA' },
    { id: 6, planta: 'STRETCH', area: 'EXTRUSION', equipo: 'SML 2', subEquipo: 'WINDER' },
    { id: 7, planta: 'STRETCH', area: 'EXTRUSION', equipo: 'SML 2', subEquipo: 'EXTRUSOR' },
    { id: 8, planta: 'STRETCH', area: 'EXTRUSION', equipo: 'SML 2', subEquipo: 'CHILL ROLL' },
    { id: 9, planta: 'STRETCH', area: 'EXTRUSION', equipo: 'SML 2', subEquipo: 'DOSIFICADOR' },
    { id: 10, planta: 'STRETCH', area: 'EXTRUSION', equipo: 'SML 2', subEquipo: 'EREMA' },
    { id: 11, planta: 'STRETCH', area: 'REBOBINADO', equipo: 'R 01', subEquipo: 'DESBOBINADOR' },
    { id: 12, planta: 'STRETCH', area: 'REBOBINADO', equipo: 'R 01', subEquipo: 'BOBINADOR' },
    { id: 13, planta: 'STRETCH', area: 'REBOBINADO', equipo: 'R 02', subEquipo: 'DESBOBINADOR' },
    { id: 14, planta: 'STRETCH', area: 'REBOBINADO', equipo: 'R 02', subEquipo: 'BOBINADOR' },
    { id: 15, planta: 'STRETCH', area: 'REBOBINADO', equipo: 'R 03', subEquipo: 'DESBOBINADOR' },
    { id: 16, planta: 'STRETCH', area: 'REBOBINADO', equipo: 'R 03', subEquipo: 'BOBINADOR' },
    { id: 17, planta: 'STRETCH', area: 'REBOBINADO', equipo: 'R 04', subEquipo: 'DESBOBINADOR' },
    { id: 18, planta: 'STRETCH', area: 'REBOBINADO', equipo: 'R 04', subEquipo: 'BOBINADOR' },
    { id: 19, planta: 'STRETCH', area: 'REBOBINADO', equipo: 'R 05', subEquipo: 'DESBOBINADOR' },
    { id: 20, planta: 'STRETCH', area: 'REBOBINADO', equipo: 'R 05', subEquipo: 'BOBINADOR' },
    { id: 21, planta: 'STRETCH', area: 'REBOBINADO', equipo: 'R 05', subEquipo: 'CARGADOR' },
    { id: 22, planta: 'STRETCH', area: 'REBOBINADO', equipo: 'R 05', subEquipo: 'CORTE' },
    { id: 23, planta: 'STRETCH', area: 'REBOBINADO', equipo: 'R 06', subEquipo: 'DESBOBINADOR' },
    { id: 24, planta: 'STRETCH', area: 'REBOBINADO', equipo: 'R 06', subEquipo: 'BOBINADOR' },
    { id: 25, planta: 'STRETCH', area: 'REBOBINADO', equipo: 'R 06', subEquipo: 'CARGADOR' },
    { id: 26, planta: 'STRETCH', area: 'REBOBINADO', equipo: 'R 06', subEquipo: 'CORTE' },
    { id: 27, planta: 'STRETCH', area: 'PREESTIRADO', equipo: 'P 01', subEquipo: 'DESBOBINADOR' },
    { id: 28, planta: 'STRETCH', area: 'PREESTIRADO', equipo: 'P 01', subEquipo: 'PREESTIRADOR' },
    { id: 29, planta: 'STRETCH', area: 'PREESTIRADO', equipo: 'P 01', subEquipo: 'BOBINADOR' },
    { id: 30, planta: 'STRETCH', area: 'PREESTIRADO', equipo: 'P 01', subEquipo: 'CARGADOR' },
    { id: 31, planta: 'STRETCH', area: 'PREESTIRADO', equipo: 'P 01', subEquipo: 'CORTE' },
    { id: 32, planta: 'STRETCH', area: 'PREESTIRADO', equipo: 'P 02', subEquipo: 'DESBOBINADOR' },
    { id: 33, planta: 'STRETCH', area: 'PREESTIRADO', equipo: 'P 02', subEquipo: 'PREESTIRADOR' },
    { id: 34, planta: 'STRETCH', area: 'PREESTIRADO', equipo: 'P 02', subEquipo: 'BOBINADOR' },
    { id: 35, planta: 'STRETCH', area: 'PREESTIRADO', equipo: 'P 02', subEquipo: 'CARGADOR' },
    { id: 36, planta: 'STRETCH', area: 'PREESTIRADO', equipo: 'P 02', subEquipo: 'CORTE' },
    { id: 37, planta: 'STRETCH', area: 'PREESTIRADO', equipo: 'P 03', subEquipo: 'DESBOBINADOR' },
    { id: 38, planta: 'STRETCH', area: 'PREESTIRADO', equipo: 'P 03', subEquipo: 'PREESTIRADOR' },
    { id: 39, planta: 'STRETCH', area: 'PREESTIRADO', equipo: 'P 03', subEquipo: 'BOBINADOR' },
    { id: 40, planta: 'STRETCH', area: 'PREESTIRADO', equipo: 'P 03', subEquipo: 'CARGADOR' },
    { id: 41, planta: 'STRETCH', area: 'PREESTIRADO', equipo: 'P 03', subEquipo: 'CORTE' },
    { id: 42, planta: 'STRETCH', area: 'PREESTIRADO', equipo: 'P 04', subEquipo: 'DESBOBINADOR' },
    { id: 43, planta: 'STRETCH', area: 'PREESTIRADO', equipo: 'P 04', subEquipo: 'PREESTIRADOR' },
    { id: 44, planta: 'STRETCH', area: 'PREESTIRADO', equipo: 'P 04', subEquipo: 'BOBINADOR' },
    { id: 45, planta: 'STRETCH', area: 'PREESTIRADO', equipo: 'P 04', subEquipo: 'CARGADOR' },
    { id: 46, planta: 'STRETCH', area: 'PREESTIRADO', equipo: 'P 04', subEquipo: 'CORTE' },
    { id: 47, planta: 'STRETCH', area: 'PREESTIRADO', equipo: 'P 05', subEquipo: 'DESBOBINADOR' },
    { id: 48, planta: 'STRETCH', area: 'PREESTIRADO', equipo: 'P 05', subEquipo: 'PREESTIRADOR' },
    { id: 49, planta: 'STRETCH', area: 'PREESTIRADO', equipo: 'P 05', subEquipo: 'BOBINADOR' },
    { id: 50, planta: 'STRETCH', area: 'PREESTIRADO', equipo: 'P 05', subEquipo: 'CARGADOR' },
    { id: 51, planta: 'STRETCH', area: 'PREESTIRADO', equipo: 'P 05', subEquipo: 'CORTE' },
    { id: 52, planta: 'STRETCH', area: 'CINTAS', equipo: 'SIAT 1', subEquipo: 'TRATAMIENTO DE CORONA' },
    { id: 53, planta: 'STRETCH', area: 'CINTAS', equipo: 'SIAT 1', subEquipo: 'BOBINADOR' },
    { id: 54, planta: 'STRETCH', area: 'CINTAS', equipo: 'SIAT 1', subEquipo: 'ESTACIONES' },
    { id: 55, planta: 'STRETCH', area: 'CINTAS', equipo: 'SIAT 2 ', subEquipo: 'TRATAMIENTO DE CORONA' },
    { id: 56, planta: 'STRETCH', area: 'CINTAS', equipo: 'SIAT 2 ', subEquipo: 'BOBINADOR' },
    { id: 57, planta: 'STRETCH', area: 'CINTAS', equipo: 'SIAT 2 ', subEquipo: 'ESTACIONES' },
    { id: 58, planta: 'STRETCH', area: 'CINTAS', equipo: 'SIAT 3', subEquipo: 'TRATAMIENTO DE CORONA' },
    { id: 59, planta: 'STRETCH', area: 'CINTAS', equipo: 'SIAT 3', subEquipo: 'BOBINADOR' },
    { id: 60, planta: 'STRETCH', area: 'CINTAS', equipo: 'SIAT 3', subEquipo: 'ESTACIONES' },
    { id: 61, planta: 'STRETCH', area: 'CINTAS', equipo: 'WEBTEC 1', subEquipo: 'DESBOBINADOR' },
    { id: 62, planta: 'STRETCH', area: 'CINTAS', equipo: 'WEBTEC 1', subEquipo: 'SISTEMA DE CORTE' },
    { id: 63, planta: 'STRETCH', area: 'CINTAS', equipo: 'WEBTEC 1', subEquipo: 'BOBINADOR' },
    { id: 64, planta: 'STRETCH', area: 'CINTAS', equipo: 'WEBTEC 2', subEquipo: 'DESBOBINADOR' },
    { id: 65, planta: 'STRETCH', area: 'CINTAS', equipo: 'WEBTEC 2', subEquipo: 'SISTEMA DE CORTE' },
    { id: 66, planta: 'STRETCH', area: 'CINTAS', equipo: 'WEBTEC 2', subEquipo: 'BOBINADOR' },
    { id: 67, planta: 'STRETCH', area: 'CINTAS', equipo: 'CORTADORA DE TUCOS', subEquipo: 'SISTEMA DE CORTE' },
    { id: 68, planta: 'STRETCH', area: 'CINTAS', equipo: 'CORTADORA DE TUCOS', subEquipo: 'SISTEMA DE EXPULSION' },
    { id: 69, planta: 'STRETCH', area: 'SERV. AUX. S', equipo: 'CORTADORA EXTERIOR', subEquipo: 'SISTEMA DE CORTE' },
    { id: 70, planta: 'STRETCH', area: 'SERV. AUX. S', equipo: 'CHILLER 1', subEquipo: 'CONDENSADOR DE ALETAS' },
    { id: 71, planta: 'STRETCH', area: 'SERV. AUX. S', equipo: 'CHILLER 1', subEquipo: 'VENTILADORES' },
    { id: 72, planta: 'STRETCH', area: 'SERV. AUX. S', equipo: 'CHILLER 1', subEquipo: 'BOMBAS' },
    { id: 73, planta: 'STRETCH', area: 'SERV. AUX. S', equipo: 'CHILLER 2', subEquipo: 'CONDENSADOR DE ALETAS' },
    { id: 74, planta: 'STRETCH', area: 'SERV. AUX. S', equipo: 'CHILLER 2', subEquipo: 'VENTILADORES' },
    { id: 75, planta: 'STRETCH', area: 'SERV. AUX. S', equipo: 'CHILLER 2', subEquipo: 'BOMBAS' },
    { id: 76, planta: 'STRETCH', area: 'SERV. AUX. S', equipo: 'CHILLER 3', subEquipo: 'CONDENSADOR DE ALETAS' },
    { id: 77, planta: 'STRETCH', area: 'SERV. AUX. S', equipo: 'CHILLER 3', subEquipo: 'VENTILADORES' },
    { id: 78, planta: 'STRETCH', area: 'SERV. AUX. S', equipo: 'CHILLER 3', subEquipo: 'BOMBAS' },
    { id: 79, planta: 'STRETCH', area: 'SERV. AUX. S', equipo: 'COMPRESOR 4509B', subEquipo: 'CONDENSADOR' },
    { id: 80, planta: 'STRETCH', area: 'SERV. AUX. S', equipo: 'COMPRESOR 3709B', subEquipo: 'CONDENSADOR' },
    { id: 81, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: 'FAJA TRANSPORTADORA 1', subEquipo: 'RODILLOS' },
    { id: 82, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: 'FAJA TRANSPORTADORA 1', subEquipo: 'BANDA TRANSPORTADORA' },
    { id: 83, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: 'FAJA TRANSPORTADORA 1', subEquipo: 'SISTEMA DE TRANSMISION' },
    { id: 84, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: 'FAJA TRANSPORTADORA 2', subEquipo: 'RODILLOS' },
    { id: 85, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: 'FAJA TRANSPORTADORA 2', subEquipo: 'BANDA TRANSPORTADORA' },
    { id: 86, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: 'FAJA TRANSPORTADORA 2', subEquipo: 'SISTEMA DE TRANSMISION' },
    { id: 87, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: 'FAJA TRANSPORTADORA 3', subEquipo: 'RODILLOS' },
    { id: 88, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: 'FAJA TRANSPORTADORA 3', subEquipo: 'BANDA TRANSPORTADORA' },
    { id: 89, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: 'FAJA TRANSPORTADORA 3', subEquipo: 'SISTEMA DE TRANSMISION' },
    { id: 90, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: 'FAJA TRANSPORTADORA 4', subEquipo: 'RODILLOS' },
    { id: 91, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: 'FAJA TRANSPORTADORA 4', subEquipo: 'BANDA TRANSPORTADORA' },
    { id: 92, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: 'FAJA TRANSPORTADORA 4', subEquipo: 'SISTEMA DE TRANSMISION' },
    { id: 93, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: 'HUSILLO TRANSPORTADOR 1', subEquipo: 'TORNILLO' },
    { id: 94, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: 'HUSILLO TRANSPORTADOR 1', subEquipo: 'SOPORTE' },
    { id: 95, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: 'HUSILLO TRANSPORTADOR 1', subEquipo: 'SISTEMA DE TRANSMISION' },
    { id: 96, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: 'HUSILLO TRANSPORTADOR 2', subEquipo: 'TORNILLO' },
    { id: 97, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: 'HUSILLO TRANSPORTADOR 2', subEquipo: 'SISTEMA DE TRANSMISION' },
    { id: 98, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: 'HUSILLO TRANSPORTADOR 3', subEquipo: 'TORNILLO' },
    { id: 99, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: 'HUSILLO TRANSPORTADOR 3', subEquipo: 'SISTEMA DE TRANSMISION' },
    { id: 100, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: 'HUSILLO TRANSPORTADOR 4', subEquipo: 'TORNILLO' },
    { id: 101, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: 'HUSILLO TRANSPORTADOR 4', subEquipo: 'SISTEMA DE TRANSMISION' },
    { id: 102, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: 'HUSILLO TRANSPORTADOR 5', subEquipo: 'TORNILLO' },
    { id: 103, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: 'HUSILLO TRANSPORTADOR 5', subEquipo: 'SISTEMA DE TRANSMISION' },
    { id: 104, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: 'HUSILLO TRANSPORTADOR 6', subEquipo: 'TORNILLO' },
    { id: 105, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: 'HUSILLO TRANSPORTADOR 6', subEquipo: 'SISTEMA DE TRANSMISION' },
    { id: 106, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: 'TRITURADOR WEIMA', subEquipo: 'ROTOR' },
    { id: 107, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: 'TRITURADOR WEIMA', subEquipo: 'SISTEMA DE TRANSMISION' },
    { id: 108, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: 'TRITURADOR WEIMA', subEquipo: 'CUCHILLAS FIJAS' },
    { id: 109, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: 'TRITURADOR WEIMA', subEquipo: 'CUCHILLAS MOVILES' },
    { id: 110, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: 'TRITURADOR WEIMA', subEquipo: 'SISTEMA HIDRAHULICO' },
    { id: 111, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: 'MOLINO LINDNER', subEquipo: 'ROTOR' },
    { id: 112, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: 'MOLINO LINDNER', subEquipo: 'SISTEMA DE TRANSMISION' },
    { id: 113, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: 'MOLINO LINDNER', subEquipo: 'CUCHILLAS FIJAS' },
    { id: 114, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: 'MOLINO LINDNER', subEquipo: 'CUCHILLAS MOVILES' },
    { id: 115, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: 'TINA DE LAVADO 1', subEquipo: 'PALETAS' },
    { id: 116, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: 'TINA DE LAVADO 1', subEquipo: 'HUSILLO LATERAL' },
    { id: 117, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: 'TINA DE LAVADO 1', subEquipo: 'BANDA TRANSPORTADORA' },
    { id: 118, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: 'TINA DE LAVADO 1', subEquipo: 'HUSILLO INFERIOR' },
    { id: 119, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: 'TINA DE LAVADO 2', subEquipo: 'PALETAS' },
    { id: 120, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: 'TINA DE LAVADO 2', subEquipo: 'HUSILLO LATERAL' },
    { id: 121, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: 'TINA DE LAVADO 2', subEquipo: 'BANDA TRANSPORTADORA' },
    { id: 122, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: 'TINA DE LAVADO 2', subEquipo: 'HUSILLO INFERIOR' },
    { id: 123, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: ' LAVADORA DE FRICCION 1', subEquipo: 'SISTEMA DE TRANSMISION' },
    { id: 124, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: ' LAVADORA DE FRICCION 1', subEquipo: 'PUERTAS' },
    { id: 125, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: ' LAVADORA DE FRICCION 1', subEquipo: 'TORNILLO' },
    { id: 126, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: ' LAVADORA DE FRICCION 2', subEquipo: 'SISTEMA DE TRANSMISION' },
    { id: 127, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: ' LAVADORA DE FRICCION 2', subEquipo: 'PUERTAS' },
    { id: 128, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: ' LAVADORA DE FRICCION 2', subEquipo: 'TORNILLO' },
    { id: 129, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: 'EXPRIMIDOR 1', subEquipo: 'SISTEMA DE TRANSMISION' },
    { id: 130, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: 'EXPRIMIDOR 1', subEquipo: 'PUERTAS' },
    { id: 131, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: 'EXPRIMIDOR 1', subEquipo: 'TORNILLO' },
    { id: 132, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: 'EXPRIMIDOR 2', subEquipo: 'SISTEMA DE TRANSMISION' },
    { id: 133, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: 'EXPRIMIDOR 2', subEquipo: 'PUERTAS' },
    { id: 134, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: 'EXPRIMIDOR 2', subEquipo: 'TORNILLO' },
    { id: 135, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: 'SOPLADOR 1', subEquipo: 'IMPULSOR' },
    { id: 136, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: 'SOPLADOR 1', subEquipo: 'MOTOR' },
    { id: 137, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: 'SOPLADOR 2', subEquipo: 'IMPULSOR' },
    { id: 138, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: 'SOPLADOR 2', subEquipo: 'MOTOR' },
    { id: 139, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: 'SOPLADOR 3', subEquipo: 'IMPULSOR' },
    { id: 140, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: 'SOPLADOR 3', subEquipo: 'MOTOR' },
    { id: 141, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: 'SOPLADOR 4', subEquipo: 'IMPULSOR' },
    { id: 142, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: 'SOPLADOR 4', subEquipo: 'MOTOR' },
    { id: 143, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: 'SILO 1', subEquipo: 'BANDA TRANSPORTADORA' },
    { id: 144, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: 'SILO 1', subEquipo: 'SISTEMA DE TRANSMISION' },
    { id: 145, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: 'SILO 1', subEquipo: 'RODILLOS' },
    { id: 146, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: 'SILO 1', subEquipo: 'SISTEMA DE PALETAS' },
    { id: 147, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: 'SILO 2', subEquipo: 'BANDA TRANSPORTADORA' },
    { id: 148, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: 'SILO 2', subEquipo: 'SISTEMA DE TRANSMISION' },
    { id: 149, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: 'SILO 2', subEquipo: 'RODILLOS' },
    { id: 150, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: 'SILO 2', subEquipo: 'SISTEMA DE PALETAS' },
    { id: 151, planta: 'RECICLAJE', area: 'PELETIZADOR', equipo: 'EREMA 1', subEquipo: 'PCU' },
    { id: 152, planta: 'RECICLAJE', area: 'PELETIZADOR', equipo: 'EREMA 1', subEquipo: 'FAJA TRANSPORTADORA' },
    { id: 153, planta: 'RECICLAJE', area: 'PELETIZADOR', equipo: 'EREMA 1', subEquipo: 'CENTRIFUGO' },
    { id: 154, planta: 'RECICLAJE', area: 'PELETIZADOR', equipo: 'EREMA 1', subEquipo: 'ZARANDA' },
    { id: 155, planta: 'RECICLAJE', area: 'PELETIZADOR', equipo: 'EREMA 1', subEquipo: 'SISTEMA DE EXTRACCION' },
    { id: 156, planta: 'RECICLAJE', area: 'PELETIZADOR', equipo: 'EREMA 1', subEquipo: 'EXTRUSOR' },
    { id: 157, planta: 'RECICLAJE', area: 'PELETIZADOR', equipo: 'EREMA 1', subEquipo: 'CABEZAL' },
    { id: 158, planta: 'RECICLAJE', area: 'PELETIZADOR', equipo: 'EREMA 1', subEquipo: 'SISTEMA DE REFRIGERACION' },
    { id: 159, planta: 'RECICLAJE', area: 'PELETIZADOR', equipo: 'EREMA 2', subEquipo: 'PCU' },
    { id: 160, planta: 'RECICLAJE', area: 'PELETIZADOR', equipo: 'EREMA 2', subEquipo: 'FAJA TRANSPORTADORA' },
    { id: 161, planta: 'RECICLAJE', area: 'PELETIZADOR', equipo: 'EREMA 2', subEquipo: 'CENTRIFUGO' },
    { id: 162, planta: 'RECICLAJE', area: 'PELETIZADOR', equipo: 'EREMA 2', subEquipo: 'ZARANDA' },
    { id: 163, planta: 'RECICLAJE', area: 'PELETIZADOR', equipo: 'EREMA 2', subEquipo: 'SISTEMA DE EXTRACCION' },
    { id: 164, planta: 'RECICLAJE', area: 'PELETIZADOR', equipo: 'EREMA 2', subEquipo: 'EXTRUSOR' },
    { id: 165, planta: 'RECICLAJE', area: 'PELETIZADOR', equipo: 'EREMA 2', subEquipo: 'CABEZAL' },
    { id: 166, planta: 'RECICLAJE', area: 'PELETIZADOR', equipo: 'EREMA 2', subEquipo: 'SISTEMA DE REFRIGERACION' },
    { id: 167, planta: 'RECICLAJE', area: 'PTAR', equipo: 'DOSIFICACION', subEquipo: 'BOMBA DOSIFICADORA 1' },
    { id: 168, planta: 'RECICLAJE', area: 'PTAR', equipo: 'DOSIFICACION', subEquipo: 'BOMBA DOSIFICADORA 2' },
    { id: 169, planta: 'RECICLAJE', area: 'PTAR', equipo: 'DOSIFICACION', subEquipo: 'BOMBA DOSIFICADORA 3' },
    { id: 170, planta: 'RECICLAJE', area: 'PTAR', equipo: 'DOSIFICACION', subEquipo: 'BOMBA DOSIFICADORA 4' },
    { id: 171, planta: 'RECICLAJE', area: 'PTAR', equipo: 'TANQUE DE AIREACION', subEquipo: 'MOTOREDUCTOR' },
    { id: 172, planta: 'RECICLAJE', area: 'PTAR', equipo: 'TANQUE DE AIREACION', subEquipo: 'ELECTROBOMBA DE POZO 1' },
    { id: 173, planta: 'RECICLAJE', area: 'PTAR', equipo: 'TANQUE DE AIREACION', subEquipo: 'ELECTROBOMBA DE POZO 2' },
    { id: 174, planta: 'RECICLAJE', area: 'PTAR', equipo: 'TANQUE DE AIREACION', subEquipo: 'ELECTROBOMBA DE POZO 3' },
    { id: 175, planta: 'RECICLAJE', area: 'PTAR', equipo: 'TANQUE DE AIREACION', subEquipo: 'ELECTROBOMBA DE POZO 4' },
    { id: 176, planta: 'RECICLAJE', area: 'PTAR', equipo: 'SEDIMENTADOR', subEquipo: 'BOMBA NEUMATICA 1' },
    { id: 177, planta: 'RECICLAJE', area: 'PTAR', equipo: 'SEDIMENTADOR', subEquipo: 'BOMBA NEUMATICA 2' },
    { id: 178, planta: 'RECICLAJE', area: 'PTAR', equipo: 'SEDIMENTADOR', subEquipo: 'VALVULAS' },
    { id: 179, planta: 'RECICLAJE', area: 'PTAR', equipo: 'SEDIMENTADOR', subEquipo: 'ELECTROBOMBA DE ENVIO 1' },
    { id: 180, planta: 'RECICLAJE', area: 'PTAR', equipo: 'SEDIMENTADOR', subEquipo: 'ELECTROBOMBA DE ENVIO 2' },
    { id: 181, planta: 'RECICLAJE', area: 'PTAR', equipo: 'TANQUE DE FILTRACION ', subEquipo: 'BOMBA NEUMATICA 1 1/2' },
    { id: 182, planta: 'RECICLAJE', area: 'PTAR', equipo: 'TANQUE DE FILTRACION ', subEquipo: 'VALVULAS' },
    { id: 183, planta: 'RECICLAJE', area: 'PTAR', equipo: 'FILTRO PRENSA', subEquipo: 'SISTEMA HIDRAHULICO' },
    { id: 184, planta: 'RECICLAJE', area: 'PTAR', equipo: 'FILTRO PRENSA', subEquipo: 'VALVULAS' },
    { id: 185, planta: 'RECICLAJE', area: 'PTAR', equipo: 'FILTRO PRENSA', subEquipo: 'BOMBA NEUMATICA 1 1/2' },
    { id: 186, planta: 'RECICLAJE', area: 'PTAR', equipo: 'TANQUE DE ALMACENAMIENTO', subEquipo: 'ELECTROBOMBAS LINDNER 1' },
    { id: 187, planta: 'RECICLAJE', area: 'PTAR', equipo: 'TANQUE DE ALMACENAMIENTO', subEquipo: 'ELECTROBOMBAS LINDNER 2' },
    { id: 188, planta: 'RECICLAJE', area: 'PTAR', equipo: 'TANQUE DE ALMACENAMIENTO', subEquipo: 'ELECTROBOMBAS LINEA BEIER 1' },
    { id: 189, planta: 'RECICLAJE', area: 'PTAR', equipo: 'TANQUE DE ALMACENAMIENTO', subEquipo: 'ELECTROBOMBAS LINEA BEIER 2' },
    { id: 190, planta: 'RECICLAJE', area: 'PTAR', equipo: 'TANQUE DE ALMACENAMIENTO', subEquipo: 'ELECTROBOMBAS LAVADORA DE FRICCION 1' },
    { id: 191, planta: 'RECICLAJE', area: 'PTAR', equipo: 'TANQUE DE ALMACENAMIENTO', subEquipo: 'ELECTROBOMBAS LAVADORA DE FRICCION 2' },
    { id: 192, planta: 'RECICLAJE', area: 'SERV. AUX. R', equipo: 'COMPRESOR LS -100', subEquipo: 'CONDENSADOR' },
    { id: 193, planta: 'RECICLAJE', area: 'SERV. AUX. R', equipo: 'CHILLER 4', subEquipo: 'CONDENSADOR DE ALETAS' },
    { id: 194, planta: 'RECICLAJE', area: 'SERV. AUX. R', equipo: 'CHILLER 4', subEquipo: 'VENTILADORES' },
    { id: 195, planta: 'RECICLAJE', area: 'SERV. AUX. R', equipo: 'CHILLER 4', subEquipo: 'BOMBAS' },
    { id: 196, planta: 'RECICLAJE', area: 'SERV. AUX. R', equipo: 'SISTEMA CONTRAINCENDIOS', subEquipo: 'ARRANQUE DEL SISTEMA' },
    { id: 197, planta: 'RECICLAJE', area: 'SERV. GEN. R', equipo: 'INFRAESTRUCTURA', subEquipo: 'GARITA' },
    { id: 198, planta: 'RECICLAJE', area: 'SERV. GEN. R', equipo: 'INFRAESTRUCTURA', subEquipo: 'ALMACEN' },
    { id: 199, planta: 'RECICLAJE', area: 'SERV. GEN. R', equipo: 'INFRAESTRUCTURA', subEquipo: 'DATA CENTER' },
    { id: 200, planta: 'RECICLAJE', area: 'SERV. GEN. R', equipo: 'INFRAESTRUCTURA', subEquipo: 'PRODUCCION' },
    { id: 201, planta: 'RECICLAJE', area: 'SERV. GEN. R', equipo: 'INFRAESTRUCTURA', subEquipo: 'CALIDAD' },
    { id: 202, planta: 'RECICLAJE', area: 'SERV. GEN. R', equipo: 'INFRAESTRUCTURA', subEquipo: 'MANTENIMIENTO' },
    { id: 203, planta: 'RECICLAJE', area: 'SERV. GEN. R', equipo: 'INFRAESTRUCTURA', subEquipo: 'PLANTA' },
    { id: 204, planta: 'RECICLAJE', area: 'SERV. GEN. R', equipo: 'INFRAESTRUCTURA', subEquipo: 'VESTUARIO MUJERES' },
    { id: 205, planta: 'RECICLAJE', area: 'SERV. GEN. R', equipo: 'INFRAESTRUCTURA', subEquipo: 'VESTUARIO VARONES' },
    { id: 206, planta: 'STRETCH', area: 'SERV. GEN. S', equipo: 'INFRAESTRUCTURA', subEquipo: 'GARITA' },
    { id: 207, planta: 'STRETCH', area: 'SERV. GEN. S', equipo: 'INFRAESTRUCTURA', subEquipo: 'ALMACEN' },
    { id: 208, planta: 'STRETCH', area: 'SERV. GEN. S', equipo: 'INFRAESTRUCTURA', subEquipo: 'FACTURACION' },
    { id: 209, planta: 'STRETCH', area: 'SERV. GEN. S', equipo: 'INFRAESTRUCTURA', subEquipo: 'LOGISTICA' },
    { id: 210, planta: 'STRETCH', area: 'SERV. GEN. S', equipo: 'INFRAESTRUCTURA', subEquipo: 'VENTAS' },
    { id: 211, planta: 'STRETCH', area: 'SERV. GEN. S', equipo: 'INFRAESTRUCTURA', subEquipo: 'MANTENIMIENTO' },
    { id: 212, planta: 'STRETCH', area: 'SERV. GEN. S', equipo: 'INFRAESTRUCTURA', subEquipo: 'PRODUCCION' },
    { id: 213, planta: 'STRETCH', area: 'SERV. GEN. S', equipo: 'INFRAESTRUCTURA', subEquipo: 'CONTABILIDAD' },
    { id: 214, planta: 'STRETCH', area: 'SERV. GEN. S', equipo: 'INFRAESTRUCTURA', subEquipo: 'GDH' },
    { id: 215, planta: 'STRETCH', area: 'SERV. GEN. S', equipo: 'INFRAESTRUCTURA', subEquipo: 'CALIDAD' },
    { id: 216, planta: 'STRETCH', area: 'SERV. GEN. S', equipo: 'INFRAESTRUCTURA', subEquipo: 'PLANTA' },
    { id: 217, planta: 'STRETCH', area: 'SERV. GEN. S', equipo: 'INFRAESTRUCTURA', subEquipo: 'ADMINISTRACION' },
    { id: 218, planta: 'STRETCH', area: 'SERV. GEN. S', equipo: 'INFRAESTRUCTURA', subEquipo: 'GERENCIAS GERENERAL' },
    { id: 219, planta: 'STRETCH', area: 'SERV. GEN. S', equipo: 'INFRAESTRUCTURA', subEquipo: 'KITCHEN' },
    { id: 220, planta: 'STRETCH', area: 'SERV. GEN. S', equipo: 'INFRAESTRUCTURA', subEquipo: 'FINANZAS' },
    { id: 221, planta: 'STRETCH', area: 'SERV. GEN. S', equipo: 'INFRAESTRUCTURA', subEquipo: 'SALA CAPACITACION' },
    { id: 222, planta: 'STRETCH', area: 'SERV. GEN. S', equipo: 'INFRAESTRUCTURA', subEquipo: 'TI' },
    { id: 223, planta: 'STRETCH', area: 'SERV. GEN. S', equipo: 'INFRAESTRUCTURA', subEquipo: 'DIRECTORIO' },
    { id: 224, planta: 'STRETCH', area: 'SERV. GEN. S', equipo: 'INFRAESTRUCTURA', subEquipo: 'VESTUARIO VARONES' },
    { id: 225, planta: 'STRETCH', area: 'SERV. GEN. S', equipo: 'INFRAESTRUCTURA', subEquipo: 'VESTUARIO MUJERES' },
    { id: 226, planta: 'STRETCH', area: 'SERV. GEN. S', equipo: 'INFRAESTRUCTURA', subEquipo: 'COMEDOR' },
    { id: 227, planta: 'STRETCH', area: 'SERV. GEN. S', equipo: 'INFRAESTRUCTURA', subEquipo: 'BAÑOS EDIFICIOS' },
    { id: 228, planta: 'STRETCH', area: 'SERV. GEN. S', equipo: 'INFRAESTRUCTURA', subEquipo: 'BAÑO MANTENIMIENTO' },
    { id: 229, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: 'CAJA DE RESISTENCIA 1', subEquipo: 'RESISTENCIA' },
    { id: 230, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: 'CAJA DE RESISTENCIA 1', subEquipo: 'TABLERO' },
    { id: 231, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: 'CAJA DE RESISTENCIA 2', subEquipo: 'RESISTENCIA' },
    { id: 232, planta: 'RECICLAJE', area: 'LINEA BEIER', equipo: 'CAJA DE RESISTENCIA 2', subEquipo: 'TABLERO' },
    { id: 233, planta: 'RECICLAJE', area: 'PELETIZADOR', equipo: 'EREMA 1', subEquipo: 'FILTRO LASER' },
    { id: 234, planta: 'RECICLAJE', area: 'PELETIZADOR', equipo: 'EREMA 2', subEquipo: 'FILTRO LASER' },
    { id: 235, planta: 'STRETCH', area: 'SERV. GEN. S', equipo: 'SISTEMA CONTRAINCENDIOS', subEquipo: 'ARRANQUE DEL SISTEMA' },
    { id: 236, planta: 'RECICLAJE', area: 'SERV. GEN. R', equipo: 'INFRAESTRUCTURA', subEquipo: 'MOSQUITERO' },
    { id: 237, planta: 'STRETCH', area: 'SERV. GEN. S', equipo: 'INFRAESTRUCTURA', subEquipo: 'MOSQUITERO' },
    { id: 238, planta: 'RECICLAJE', area: 'PTAR', equipo: 'HIDROLAVADORA', subEquipo: 'HIDROLAVADORA' },
];

async function loadMasterData() {
    try {
        console.log('Iniciando carga de datos maestros...');

        // Mapas para evitar duplicados
        const plantsMap = new Map();
        const areasMap = new Map();
        const machinesMap = new Map();

        // Procesar cada registro
        for (const record of masterData) {
            // 1. Crear o obtener Planta
            if (!plantsMap.has(record.planta)) {
                const [plant] = await Plant.findOrCreate({
                    where: { name: record.planta }
                });
                plantsMap.set(record.planta, plant);
                console.log(`Planta creada/encontrada: ${record.planta}`);
            }
            const plant = plantsMap.get(record.planta);

            // 2. Crear o obtener Área
            const areaKey = `${record.planta}-${record.area}`;
            if (!areasMap.has(areaKey)) {
                const [area] = await Area.findOrCreate({
                    where: { name: record.area, plantId: plant.id }
                });
                areasMap.set(areaKey, area);
                console.log(`  Área creada/encontrada: ${record.area}`);
            }
            const area = areasMap.get(areaKey);

            // 3. Crear o obtener Máquina
            const machineKey = `${areaKey}-${record.equipo}`;
            if (!machinesMap.has(machineKey)) {
                const [machine] = await Machine.findOrCreate({
                    where: { name: record.equipo, areaId: area.id }
                });
                machinesMap.set(machineKey, machine);
                console.log(`    Equipo creado/encontrado: ${record.equipo}`);
            }
            const machine = machinesMap.get(machineKey);

            // 4. Crear SubMáquina
            await SubMachine.findOrCreate({
                where: { name: record.subEquipo, machineId: machine.id }
            });
            console.log(`      Sub-equipo creado/encontrado: ${record.subEquipo}`);
        }

        console.log('\n✅ Carga de datos maestros completada exitosamente!');
        console.log(`Total de registros procesados: ${masterData.length}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error cargando datos maestros:', error);
        process.exit(1);
    }
}

loadMasterData();
