# Seneca Vue Chrome Extension

Extensión de Chrome para gestionar calificaciones de estudiantes en Seneca, desarrollada con Vue 3, TypeScript e interfaces.

## 🚀 Características

- **Descarga CSV**: Exporta la tabla de calificaciones a un archivo CSV
- **Subida CSV**: Importa calificaciones desde un CSV y las sube automáticamente
- **Interfaz moderna**: Componentes Vue con TypeScript y tipado estricto
- **Arquitectura limpia**: Servicios bien estructurados con interfaces
- **Control de progreso**: Modal interactivo con opciones de pausa/cancelar

## 📁 Estructura del Proyecto

```
src/
├── components/          # Componentes Vue
│   ├── Toolbar.vue     # Barra de herramientas con botones
│   └── UploadModal.vue # Modal de progreso de subida
├── content/            # Scripts de contenido
│   ├── index.ts        # Script principal
│   ├── DownloadHandler.ts
│   └── UploadHandler.ts
├── services/           # Servicios de negocio
│   ├── SenecaAPIService.ts
│   └── TableParserService.ts
├── types/              # Tipos e interfaces TypeScript
│   └── index.ts
└── utils/              # Utilidades
    └── CSVUtils.ts
```

## 🛠️ Tecnologías

- **Vue 3**: Framework progresivo para interfaces
- **TypeScript**: Tipado estático
- **Vite**: Build tool ultrarrápido
- **Chrome Extensions API**: Manifest V3

## 📦 Instalación y Desarrollo

### Prerrequisitos

- Node.js >= 16
- npm o yarn

### Instalación

```bash
npm install
```

### Desarrollo

```bash
npm run dev
```

### Build de producción

```bash
npm run build
```

Esto generará la carpeta `dist/` con todos los archivos necesarios para la extensión.

## 🔧 Instalación en Chrome

1. Ejecuta `npm run build`
2. Abre Chrome y ve a `chrome://extensions/`
3. Activa el "Modo de desarrollador"
4. Haz clic en "Cargar extensión sin empaquetar"
5. Selecciona la carpeta `dist/`

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

## 🏗️ Arquitectura

### Servicios

- **SenecaAPIService**: Maneja las peticiones HTTP a la API de Seneca
- **TableParserService**: Parsea la estructura de la tabla HTML
- **CSVUtils**: Utilidades para generar y parsear CSV

### Tipos

Todas las interfaces están definidas en `src/types/index.ts`:

- `TableCell`: Celda de la tabla parseada
- `CriteriaResult`: Resultado de la API de criterios
- `UploadPayloadItem`: Item de carga
- `UploadProgress`: Estado de progreso
- Y más...

### Componentes

- **Toolbar**: Botones de descarga/subida con estilos tipados
- **UploadModal**: Modal reactivo con barra de progreso y logs

## 🔄 Diferencias con el original

1. ✅ **TypeScript con interfaces** en lugar de JavaScript
2. ✅ **Componentes Vue** en lugar de manipulación DOM directa
3. ✅ **Arquitectura modular** con servicios separados
4. ✅ **Tipado estricto** en toda la aplicación
5. ✅ **Mejor separación de responsabilidades**
6. ✅ **Código más mantenible y escalable**

## 📄 Licencia

MIT
