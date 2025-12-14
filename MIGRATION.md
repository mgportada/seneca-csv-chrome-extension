# Guía de Migración: JavaScript → Vue + TypeScript

Este documento explica los cambios realizados al migrar de la versión JavaScript a Vue + TypeScript.

## Cambios Estructurales

### Antes (JavaScript)

```
src/
├── api.js
├── downloader.js
├── tableParser.js
├── uploader.js
├── manifest.json
└── icons/
```

### Después (Vue + TypeScript)

```
src/
├── components/
│   ├── Toolbar.vue
│   └── UploadModal.vue
├── content/
│   ├── index.ts
│   ├── DownloadHandler.ts
│   └── UploadHandler.ts
├── services/
│   ├── SenecaAPIService.ts
│   └── TableParserService.ts
├── types/
│   └── index.ts
└── utils/
    └── CSVUtils.ts
```

## Comparación de Código

### 1. API Service

**Antes (api.js)**:

```javascript
window.SenecaAPI = (function () {
  "use strict";

  async function getCriteria(markId) {
    // ...código sin tipos
  }

  return {
    getCriteria,
    postMark,
  };
})();
```

**Después (SenecaAPIService.ts)**:

```typescript
export class SenecaAPIService {
  static async getCriteria(markId: string): Promise<CriteriaResult> {
    // ...código con tipos
  }

  static async postMark(markId: string, criteria: CriteriaWithValue[], fields: FormFields): Promise<void> {
    // ...código con tipos
  }
}
```

**Mejoras**:

- ✅ Tipado estricto de parámetros y retorno
- ✅ Interfaces documentadas
- ✅ Clase con métodos estáticos
- ✅ Mejor autocomplete en IDE

### 2. Table Parser

**Antes (tableParser.js)**:

```javascript
window.TableParser = (function () {
  function parseTable(table) {
    if (!table) return [];
    const result = [];
    // ...sin tipos
    return result;
  }

  return { parseTable };
})();
```

**Después (TableParserService.ts)**:

```typescript
export class TableParserService {
  static parseTable(table: HTMLTableElement): TableCell[] {
    if (!table) return [];
    const result: TableCell[] = [];
    // ...con tipos específicos
    return result;
  }
}
```

**Mejoras**:

- ✅ Tipo específico `HTMLTableElement`
- ✅ Interfaz `TableCell` define estructura exacta
- ✅ Type safety en todo el método

### 3. UI - Toolbar

**Antes (downloader.js)**:

```javascript
const btn = document.createElement("button");
btn.textContent = "Descargar CSV";
btn.style.cssText = "display:inline-block;padding:10px...";
btn.addEventListener("click", () => download(table));
toolbar.appendChild(btn);
```

**Después (Toolbar.vue)**:

```vue
<template>
  <div :style="styles.toolbar">
    <button :style="styles.downloadButton" @click="$emit('download')">Descargar CSV</button>
  </div>
</template>

<script setup lang="ts">
const styles = {
  downloadButton: {
    display: "inline-block" as const,
    padding: "10px 14px",
    // ...estilos tipados
  },
};
</script>
```

**Mejoras**:

- ✅ Componente reutilizable
- ✅ Template declarativo
- ✅ Estilos tipados como CSSProperties
- ✅ Events tipados
- ✅ Más fácil de testear

### 4. Upload Modal

**Antes (uploader.js - 400+ líneas)**:

```javascript
function showProgressModal(payload) {
  const modal = document.createElement("div");
  modal.style.cssText = `
    position: fixed;
    top: 50%;
    // ...cientos de líneas de DOM manipulation
  `;

  const pauseBtn = document.createElement("button");
  pauseBtn.onclick = () => {
    /* ... */
  };
  // ...más manipulación DOM
}
```

**Después (UploadModal.vue - ~150 líneas)**:

```vue
<template>
  <Teleport to="body">
    <div v-if="visible" :style="styles.overlay">
      <div :style="styles.modal">
        <div :style="styles.header">{{ title }}</div>
        <!-- Template declarativo -->
        <button @click="$emit('pause')">
          {{ paused ? "Reanudar" : "Pausar" }}
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
interface Props {
  visible: boolean;
  title: string;
  // ...props tipadas
}
</script>
```

**Mejoras**:

- ✅ 60% menos código
- ✅ Más legible y mantenible
- ✅ Reactividad automática
- ✅ Props e events tipados
- ✅ Teleport para portal rendering

### 5. Upload Handler

**Antes (uploader.js)**:

```javascript
async function processPayload(payload, progressText, progressFill, logContainer, closeBtn, state) {
  for (let i = 0; i < payload.length; i++) {
    // ...lógica mezclada con DOM
    const logLineGet = document.createElement("div");
    logContainer.appendChild(logLineGet);
    // ...
  }
}
```

**Después (UploadHandler.ts)**:

```typescript
export class UploadHandler {
  private onProgress?: (progress: UploadProgress) => void;

  async processFile(file: File): Promise<void> {
    // ...lógica de negocio separada
    this.emitProgress(current, total, percentage, message, type);
  }

  private emitProgress(...args): void {
    if (this.onProgress) {
      this.onProgress({ current, total, percentage, message, type });
    }
  }
}
```

**Mejoras**:

- ✅ Separación lógica/UI
- ✅ Callback pattern para comunicación
- ✅ Estado encapsulado en clase
- ✅ Métodos reutilizables
- ✅ Más fácil de testear

## Interfaces Nuevas

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

## Ventajas de la Nueva Arquitectura

### 1. Type Safety

- Errores detectados en tiempo de compilación
- Autocomplete mejorado
- Refactoring más seguro

### 2. Mantenibilidad

- Código más organizado
- Responsabilidades claras
- Más fácil de entender

### 3. Testabilidad

- Servicios aislados
- Componentes con props/events
- Mock más sencillo

### 4. Escalabilidad

- Fácil agregar nuevas features
- Componentes reutilizables
- Patrones establecidos

### 5. Developer Experience

- Mejor documentación (tipos)
- Hot reload en desarrollo
- Build optimizado con Vite

## Pasos de Migración Realizados

1. ✅ Configurar TypeScript + Vue 3
2. ✅ Crear interfaces para todos los tipos
3. ✅ Convertir servicios IIFE → Clases
4. ✅ Extraer lógica de UI a servicios
5. ✅ Crear componentes Vue para UI
6. ✅ Implementar handlers como clases
7. ✅ Configurar build con Vite
8. ✅ Actualizar manifest.json
9. ✅ Documentar arquitectura

## Comandos Actualizados

### Desarrollo

```bash
npm install       # Instalar dependencias
npm run build     # Build para producción
npm run type-check # Verificar tipos
```

### Testing Manual

1. `npm run build`
2. Cargar `dist/` en Chrome
3. Navegar a Seneca
4. Verificar botones y funcionalidad

## Retrocompatibilidad

La funcionalidad es **100% compatible** con la versión original:

- ✅ Mismo formato CSV
- ✅ Mismas APIs de Seneca
- ✅ Mismo comportamiento de usuario
- ✅ Mismos resultados

**Solo cambió la implementación interna, no la funcionalidad.**

## Próximos Pasos Sugeridos

1. **Testing**: Agregar tests unitarios con Vitest
2. **CI/CD**: Configurar GitHub Actions
3. **Store**: Considerar Pinia para estado global
4. **i18n**: Soporte multiidioma
5. **Themes**: Dark mode

## Conclusión

La migración a Vue + TypeScript proporciona:

- 📦 Mejor organización del código
- 🔒 Type safety
- 🧪 Mayor testabilidad
- 📚 Mejor documentación
- 🚀 Mejor DX (Developer Experience)

Manteniendo **100% de la funcionalidad** original.
