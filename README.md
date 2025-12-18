# Seneca Vue Chrome Extension

Extensión de Chrome para gestionar calificaciones de estudiantes en Seneca, desarrollada con Vue 3, TypeScript e interfaces.

## 🚀 Características

- **Descarga CSV**: Exporta la tabla de calificaciones a un archivo CSV
- **Subida CSV**: Importa calificaciones desde un CSV y las sube automáticamente
- **Interfaz moderna**: Componentes Vue con TypeScript y tipado estricto
- **Arquitectura limpia**: Servicios bien estructurados con interfaces
- **Control de progreso**: Modal interactivo con opciones de pausa/cancelar

### Instalación

```bash
npm install
```

## 🔧 Instalación en Chrome d

1. Ejecuta `npm run build` que generará la carpeta `dist/`
2. Abre Chrome, ve a `chrome://extensions/` y activa el "Modo de desarrollador"
3. Haz clic en "Cargar extensión sin empaquetar" y selecciona la carpeta `dist/`

## 📝 Uso

1. Navega a https://seneca.juntadeandalucia.es/ y accede al "CUADERNO DE CLASE"
2. Aparecerán dos botones:
   - **Descargar CSV**: Descarga una plantilla CSV con estudiantes y actividades
   - **Subir CSV**: Sube un CSV con calificaciones para llenar automáticamente

### Formato del CSV

El CSV debe usar `;` como separador:

```csv
Alumno/a;Actividad 1;Actividad 2;Actividad 3
García López, Juan;8.5;9.0;7.5
Pérez Martínez, María;9.5;8.0;9.0
```

## � Debugging

El proyecto incluye **source maps** para debugging:

1. Abre las herramientas de desarrollo de Chrome (`F12` o `Ctrl+Shift+I`)
2. Ve a la pestaña "Sources > Content scripts"

## �📄 Licencia

MIT

## TODO

- [ ] Freeze header row and first column when scrolling in the upload modal table
- [ ] Fetch mark with value, filter empty marks "" in the payload
