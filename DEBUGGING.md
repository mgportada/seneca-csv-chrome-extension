# 🐛 Guía de Debugging

## Source Maps Habilitados

El proyecto genera **source maps** que te permiten debuggear el código TypeScript original en lugar del JavaScript compilado.

**✅ SÍ puedes ver archivos separados** - Los source maps mapean `dist/content.js` a tus archivos `.ts` y `.vue` originales.

## Cómo Ver Archivos Separados en DevTools

### 1. Build con Source Maps

```bash
npm run build
```

Esto generará:

- `dist/content.js` (76KB) - Código compilado
- `dist/content.js.map` (579KB) - Source map

### 2. Cargar Extensión en Chrome

```bash
# chrome://extensions/
# - Modo desarrollador: ON
# - Click "Cargar extensión sin empaquetar"
# - Seleccionar carpeta: dist/
```

### 3. Abrir DevTools y Encontrar Archivos

1. Navega a https://seneca.juntadeandalucia.es/
2. Abre **DevTools** (F12 o Cmd+Option+I)
3. Ve a la pestaña **Sources**
4. En el panel izquierdo verás:

```
📁 Page
  └── 📁 seneca.juntadeandalucia.es

📁 webpack:// (o vite://)  ← AQUÍ ESTÁN TUS ARCHIVOS
  └── 📁 seneca-vue-chrome-extension
      └── 📁 src/
          ├── 📁 components/
          │   ├── 📄 Toolbar.vue
          │   └── 📄 UploadModal.vue
          ├── 📁 content/
          │   ├── 📄 index.ts
          │   ├── 📄 DownloadHandler.ts
          │   └── 📄 UploadHandler.ts
          ├── 📁 services/
          │   ├── 📄 SenecaAPIService.ts
          │   └── 📄 TableParserService.ts
          ├── 📁 types/
          │   └── 📄 index.ts
          └── 📁 utils/
              └── 📄 CSVUtils.ts
```

### 4. Si NO Ves los Archivos Separados

#### Verificación 1: Source Map Existe

```bash
ls -lh dist/content.js.map
# Debe mostrar: ~579K archivo
```

#### Verificación 2: Referencia en content.js

```bash
tail -1 dist/content.js
# Debe mostrar: //# sourceMappingURL=content.js.map
```

#### Verificación 3: Chrome DevTools Settings

1. DevTools → ⚙️ Settings (F1)
2. Asegúrate que esté **activado**:
   - ✅ "Enable JavaScript source maps"
   - ✅ "Enable CSS source maps"

#### Verificación 4: Recarga Todo

```bash
# 1. Recarga extensión
chrome://extensions/ → Botón reload

# 2. Recarga página de Seneca
# Hard refresh: Ctrl+Shift+R (Windows) o Cmd+Shift+R (Mac)

# 3. Limpia cache si es necesario
DevTools → Network → Desactiva cache
```

#### Verificación 5: Buscar por Nombre

En la pestaña Sources:

1. Presiona **Cmd+P** (Mac) o **Ctrl+P** (Windows)
2. Escribe: `UploadHandler.ts`
3. Debería aparecer en la lista

### 5. Poner Breakpoints en Archivos Separados

Una vez que veas los archivos:

```typescript
// src/content/UploadHandler.ts - LO VES ASÍ EN DEVTOOLS
async processFile(file: File): Promise<void> {
  debugger; // ← O click en número de línea
  const text = await file.text();
  // ...
}
```

**Click en el número de línea** para poner/quitar breakpoint.

### 6. Inspeccionar Variables Originales

Con los source maps activos verás:

- ✅ Nombres de variables originales (no minificadas)
- ✅ Código TypeScript formateado
- ✅ Stack traces legibles con nombres reales
- ✅ Autocomplete en consola con tipos

## Ejemplo Visual

**❌ SIN source maps** verías:

```javascript
// dist/content.js (minificado)
const e=document.querySelector("table");if(!e)return;const t=r.parseTable(e);...
```

**✅ CON source maps** verás:

```typescript
// src/content/DownloadHandler.ts (original)
static handleDownload(): void {
  const table = document.querySelector<HTMLTableElement>('table');
  if (!table) {
    console.error('No table found');
    return;
  }
  const tableData = TableParserService.parseTable(table);
  // ...
}
```

## Debugging en Diferentes Escenarios

### Debuggear Descarga CSV

1. En Sources, abre `src/content/DownloadHandler.ts`
2. Pon breakpoint en línea 10
3. Recarga Seneca
4. Click en "Descargar CSV"
5. DevTools se detendrá en tu breakpoint

### Debuggear Subida CSV

1. Pon breakpoint en `src/content/UploadHandler.ts` línea 24
2. Sube un CSV
3. Inspecciona el payload

### Debuggear Parsing de Tabla

1. Pon breakpoint en `src/services/TableParserService.ts` línea 15
2. Ejecuta parseTable
3. Inspecciona la estructura de la tabla

### Debuggear API Calls

1. Pon breakpoint en `src/services/SenecaAPIService.ts` línea 32
2. Inspecciona request/response

## Console Debugging

También puedes usar console.log con source maps:

```typescript
// src/content/index.ts
console.log("Extension initialized", {
  table: document.querySelector("table"),
  h1: document.querySelector("h1")?.textContent,
});
```

En la consola verás:

```
Extension initialized {...}
index.ts:45
```

**Click en `index.ts:45`** te llevará directamente al código fuente.

## Chrome DevTools Tips

### Network Tab

- Filtra por `seneca.juntadeandalucia.es`
- Inspecciona requests GET/POST
- Ve headers y payloads

### Console

```javascript
// Inspeccionar estado de la extensión
document.querySelector("#seneca-extension-toolbar");

// Ver parsed table
TableParserService.parseTable(document.querySelector("table"));

// Test CSV parsing
CSVUtils.parseCSV("Alumno/a;Act1\nJuan;8.5");
```

### Performance

- Graba mientras subes CSV
- Ve tiempos de cada operación
- Identifica bottlenecks

## Debugging de Componentes Vue

### Vue DevTools Extension

Instala [Vue DevTools](https://devtools.vuejs.org/):

```
chrome://extensions/ → Buscar "Vue DevTools"
```

Con Vue DevTools puedes:

- Inspeccionar component tree
- Ver props y state
- Editar datos en tiempo real
- Ver events emitidos

### Debuggear Toolbar.vue

```vue
<script setup lang="ts">
const handleFileChange = (event: Event) => {
  debugger; // Breakpoint aquí
  const target = event.target as HTMLInputElement;
  // ...
};
</script>
```

### Debuggear UploadModal.vue

```vue
<script setup lang="ts">
watch(
  () => props.logs,
  (newLogs) => {
    console.log("Logs updated:", newLogs);
    debugger; // Ver cuando cambian los logs
  }
);
</script>
```

## Source Maps en Producción

⚠️ **Importante**: Para producción, desactiva source maps:

```javascript
// vite.config.js
export default defineConfig({
  build: {
    sourcemap: false, // O 'hidden' para mantenerlos pero no exponerlos
  },
});
```

Los source maps pueden exponer tu código fuente.

## Troubleshooting

### "No puedo ver archivos .ts en Sources"

**Solución**:

1. Verifica que `dist/content.js.map` existe
2. Asegúrate de haber hecho `npm run build` después de cambiar config
3. Recarga la extensión en Chrome
4. Recarga la página de Seneca

### "Breakpoints no funcionan"

**Solución**:

1. Verifica que el source map está cargado (ve a Sources → Page)
2. Prueba con `debugger;` en lugar de breakpoint visual
3. Limpia cache de Chrome (Shift + F5)

### "Variables muestran valores incorrectos"

Es normal con código optimizado. Para mejor debugging:

```javascript
// vite.config.js
export default defineConfig({
  build: {
    minify: false, // Desactiva minificación en desarrollo
    sourcemap: true,
  },
});
```

### ⚠️ "ERR_BLOCKED_BY_CLIENT"

**Problema**: Las peticiones a la API de Seneca están siendo bloqueadas.

**Causa**: Un **ad blocker** u otra extensión está bloqueando las requests.

**Soluciones**:

#### Opción 1: Desactivar Ad Blockers (Recomendado)

1. Abre `chrome://extensions/`
2. Desactiva temporalmente:
   - uBlock Origin
   - AdBlock
   - AdBlock Plus
   - Privacy Badger
   - Cualquier extensión de privacidad/seguridad
3. Recarga la página de Seneca
4. Prueba la extensión nuevamente

#### Opción 2: Agregar Excepción en el Ad Blocker

**Para uBlock Origin**:

1. Click en el icono de uBlock
2. Click en el botón de poder (desactivar en este sitio)
3. O agrega `seneca.juntadeandalucia.es` a la whitelist

**Para AdBlock Plus**:

1. Click derecho en el icono
2. "Pausar AdBlock en este sitio"

#### Opción 3: Verificar en Modo Incógnito

```bash
# 1. Abre ventana incógnita
Ctrl + Shift + N (Windows/Linux)
Cmd + Shift + N (Mac)

# 2. Habilita la extensión en incógnito
chrome://extensions/ → Seneca Extension → "Permitir en modo incógnito"

# 3. Prueba en Seneca
```

#### Opción 4: Verificar en DevTools

```javascript
// 1. Abre DevTools → Network
// 2. Intenta subir CSV
// 3. Busca requests con estado "blocked:client"
// 4. Click derecho → "Copy as fetch"
// 5. Pégalo en console para ver el error exacto
```

#### Diagnóstico Avanzado

Ejecuta esto en la consola para ver qué está bloqueando:

```javascript
// Ver si fetch está disponible
console.log("Fetch:", typeof fetch);

// Test manual de la API
fetch(
  "https://seneca.juntadeandalucia.es/seneca/nav/pasen/actividadesevaluables/MontarModalCuaderno_2023.jsp?X_NOTACTEVA=TEST"
)
  .then((r) => console.log("✅ API accesible:", r.status))
  .catch((e) => console.error("❌ API bloqueada:", e));
```

#### Verificar Extensiones Conflictivas

Extensiones que comúnmente causan conflictos:

- uBlock Origin
- AdBlock / AdBlock Plus
- Privacy Badger
- Ghostery
- NoScript
- HTTPS Everywhere (versiones antiguas)
- Cualquier VPN/Proxy extension

**Para identificar cuál**:

1. Desactiva todas las extensiones excepto Seneca Extension
2. Prueba si funciona
3. Reactiva una por una hasta encontrar la culpable

## Workflow Recomendado

```bash
# 1. Hacer cambios en src/
vim src/content/index.ts

# 2. Rebuild
npm run build

# 3. Recargar extensión en Chrome
# chrome://extensions/ → icono reload

# 4. Recargar página de Seneca
# F5 en seneca.juntadeandalucia.es

# 5. Debuggear
# F12 → Sources → Breakpoints
```

## Hot Reload (Opcional)

Para desarrollo más rápido, considera usar un dev server, pero las extensiones de Chrome no soportan HMR nativo en content scripts.

## Comandos Útiles

```bash
# Build con source maps
npm run build

# Build sin minificar (mejor para debugging)
npm run build -- --minify false

# Type check sin build
npm run type-check

# Watch mode (rebuild automático)
npx vite build --watch
```

## Logs Estructurados

Para mejor debugging, usa logs estructurados:

```typescript
// src/content/UploadHandler.ts
console.group("📤 Upload Process");
console.log("File:", file.name);
console.log("Size:", file.size);
console.table(payload);
console.groupEnd();
```

## Referencias

- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)
- [Vite Source Maps](https://vitejs.dev/config/build-options.html#build-sourcemap)
- [Vue DevTools](https://devtools.vuejs.org/)
- [Source Map Specification](https://sourcemaps.info/spec.html)

---

## 🚀 Resumen Rápido: Ver Archivos Separados

```bash
# 1. Build
npm run build

# 2. Verifica source map
ls -lh dist/content.js.map  # Debe existir (~579KB)

# 3. Carga extensión
# chrome://extensions/ → Cargar dist/

# 4. Abre DevTools en Seneca
# F12 → Sources → Busca "webpack://" o "vite://"

# 5. Navega a src/
# Verás todos tus archivos .ts y .vue separados

# 6. Pon breakpoints
# Click en número de línea de cualquier archivo

# 7. Si no los ves:
# - DevTools Settings (F1) → Enable JavaScript source maps ✅
# - Ctrl+Shift+R para hard reload
# - Cmd+P para buscar "UploadHandler.ts"
```

**✅ Con source maps activos, verás TODOS tus archivos TypeScript originales separados en DevTools.**

---

**¡Feliz debugging! 🎉**
