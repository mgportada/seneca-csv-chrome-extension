# Documentación Técnica - Seneca Vue Extension

## Arquitectura General

La extensión sigue una arquitectura modular basada en servicios y componentes Vue, con separación clara de responsabilidades.

## Flujo de Datos

### Descarga de CSV

```
Usuario -> Toolbar (click) -> DownloadHandler
    -> TableParserService (parsea tabla HTML)
    -> CSVUtils (convierte a CSV)
    -> Descarga archivo
```

### Subida de CSV

```
Usuario -> Toolbar (selecciona archivo) -> UploadHandler
    -> CSVUtils (parsea CSV)
    -> TableParserService (obtiene mapeo tabla)
    -> Valida datos
    -> Para cada celda:
        -> SenecaAPIService.getCriteria (GET)
        -> SenecaAPIService.postMark (POST)
    -> Actualiza UploadModal con progreso
```

## Servicios

### SenecaAPIService

**Responsabilidad**: Comunicación con la API de Seneca

**Métodos principales**:

- `getCriteria(markId: string)`: Obtiene criterios de evaluación para una nota
- `postMark(markId, criteria, fields)`: Envía calificaciones a la API

**Flujo interno**:

1. GET a `MontarModalCuaderno_2023.jsp` con params
2. Parsea HTML response para extraer campos y criterios
3. POST a `PMRegCalActEva_2023.jsp` con FormData

### TableParserService

**Responsabilidad**: Parsear la tabla HTML de Seneca

**Métodos principales**:

- `parseTable(table: HTMLTableElement)`: Extrae estructura de la tabla

**Output**: Array de objetos `TableCell` con:

- `id`: Identificador único (rowIndex#colIndex)
- `rowName`: Nombre del estudiante
- `columnName`: Nombre de la actividad
- `markId`: ID de la nota (data-modalalumnotarea)

### CSVUtils

**Responsabilidad**: Operaciones con archivos CSV

**Métodos**:

- `tableToCSV(tableData)`: Convierte tabla parseada a CSV
- `parseCSV(text)`: Parsea texto CSV a estructura de datos
- `downloadCSV(csv, filename)`: Descarga archivo CSV
- `splitSemicolons(line)`: Split respetando comillas

## Componentes Vue

### Toolbar.vue

**Props**:

- `visible?: boolean` - Controla visibilidad

**Events**:

- `download` - Usuario clickea descargar
- `upload` - Usuario selecciona archivo

**Características**:

- Estilos inline con tipos CSSProperties
- Input file oculto con label personalizado
- Reset del input después de seleccionar

### UploadModal.vue

**Props**:

- `visible: boolean` - Muestra/oculta modal
- `title: string` - Título del modal
- `current: number` - Progreso actual
- `total: number` - Total de items
- `logs: Log[]` - Array de mensajes
- `paused?: boolean` - Estado pausado
- `completed?: boolean` - Estado completado
- `cancelled?: boolean` - Estado cancelado

**Events**:

- `close` - Cerrar modal
- `pause` - Pausar/reanudar
- `cancel` - Cancelar proceso

**Características**:

- Usa Teleport para renderizar en body
- Barra de progreso animada
- Log container con scroll automático
- Botones condicionales según estado

## Handlers

### DownloadHandler

**Método estático**: `handleDownload()`

**Flujo**:

1. Obtiene tabla del DOM
2. Parsea con TableParserService
3. Convierte a CSV con CSVUtils
4. Descarga archivo

### UploadHandler

**Constructor**: `new UploadHandler(onProgress?)`

**Métodos**:

- `processFile(file: File)`: Procesa archivo CSV
- `pause()`: Pausa la subida
- `cancel()`: Cancela la subida
- `isPaused()`: Verifica si está pausado

**Estado interno**:

```typescript
{
  paused: boolean,
  cancelled: boolean
}
```

**Flujo de processFile**:

1. Lee archivo como texto
2. Parsea CSV
3. Obtiene mapeo de tabla
4. Construye payload con validación
5. Para cada item del payload:
   - Espera si está pausado
   - Sale si está cancelado
   - GET criterios
   - POST calificación
   - Emite progreso
   - Delay de 500ms

## Tipos e Interfaces

### TableCell

```typescript
interface TableCell {
  id: string;
  rowIndex: number;
  colIndex: number;
  rowName: string;
  columnName: string;
  markId: string;
}
```

### CriteriaResult

```typescript
interface CriteriaResult {
  fields: FormFields;
  criteria: Criteria[];
}
```

### UploadProgress

```typescript
interface UploadProgress {
  current: number;
  total: number;
  percentage: number;
  message: string;
  type: "info" | "success" | "error";
}
```

## Content Script Principal

**Archivo**: `src/content/index.ts`

**Clase**: `SenecaExtension`

**Responsabilidades**:

1. Observar cambios en la página
2. Detectar página "CUADERNO DE CLASE"
3. Inyectar componentes Vue en el DOM
4. Coordinar comunicación entre componentes y handlers

**Métodos clave**:

- `init()`: Inicializa la extensión
- `observePage()`: Observa cambios en el DOM
- `injectUI(table)`: Inyecta componentes Vue
- `handleDownload()`: Maneja descarga
- `handleUpload(file)`: Maneja subida

**Patrón de inyección**:

```typescript
// Crea contenedores en el DOM
toolbarContainer = document.createElement("div");
modalContainer = document.createElement("div");

// Monta apps Vue con estado reactivo
createApp(Toolbar, { ...props }).mount(toolbarContainer);
createApp(UploadModal, { ...props }).mount(modalContainer);
```

## Configuración de Build

### vite.config.js

**Puntos clave**:

- Alias `@` apunta a `src/`
- Build de `content.js` como entry point
- Output sin hash en nombres de archivos
- `emptyOutDir: true` limpia dist antes de build

### tsconfig.json

**Configuración estricta**:

- `strict: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- Types de `chrome` incluidos

## Manifest V3

```json
{
  "manifest_version": 3,
  "content_scripts": [
    {
      "matches": ["https://seneca.juntadeandalucia.es/*"],
      "js": ["content.js"]
    }
  ]
}
```

**Características**:

- Content script se inyecta en todas las páginas de Seneca
- No requiere permisos adicionales (actúa en el contexto de la página)

## Mejores Prácticas Implementadas

1. **Separación de Responsabilidades**

   - Servicios para lógica de negocio
   - Componentes para UI
   - Handlers para coordinación

2. **Tipado Estricto**

   - Todas las funciones tienen tipos
   - Props e interfaces bien definidas
   - No hay `any` sin justificación

3. **Reactividad Vue**

   - Estado centralizado en el content script
   - Componentes reciben props reactivas
   - Events para comunicación hijo->padre

4. **Manejo de Errores**

   - Try-catch en operaciones async
   - Validación de datos antes de procesar
   - Mensajes de error informativos

5. **Performance**
   - Delay entre peticiones (500ms)
   - Lazy rendering de logs
   - Scroll automático solo cuando cambia

## Testing (Recomendaciones)

### Unit Tests

- Servicios: Mock de fetch
- Utils: Casos edge de CSV
- Handlers: Estado y flujo

### Integration Tests

- Content script: Inyección en DOM
- Upload flow: End-to-end con mock API

### E2E Tests

- Cypress/Playwright con página de prueba
