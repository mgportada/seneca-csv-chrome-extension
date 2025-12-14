# Eventos en Vue 3 - Explicación Detallada

## Cómo funciona el mapeo: `onDownload` → `@click="$emit('download')"`

### En Toolbar.vue (Componente)

```vue
<script setup lang="ts">
interface Emits {
  (e: "download"): void;
  (e: "upload", file: File): void;
}

const emit = defineEmits<Emits>();
</script>

<template>
  <button @click="$emit('download')">Descargar CSV</button>
</template>
```

**Flujo:**

1. `@click` dispara el manejador
2. `$emit('download')` **emite un evento** hacia el componente padre
3. El componente "grita": "¡Hey, alguien hizo click en descargar!"

---

### En index.ts (Componente Padre)

**FORMA INCORRECTA (actual):**

```typescript
// ❌ Esto NO funciona con createApp
const toolbarApp = createApp(Toolbar, {
  visible: true,
  onDownload: this.handleDownload.bind(this), // ❌ Esto no es un prop
  onUpload: this.handleUpload.bind(this),
});
```

**¿Por qué no funciona?**

- `onDownload` se interpreta como un **prop**, no como un **event listener**
- Los eventos emitidos por el componente no llegan al padre
- El manejador nunca se ejecuta

---

## La Solución Correcta

### Opción 1: Usar ref y acceso directo (Recomendado)

```typescript
// src/content/index.ts
private injectUI(table: Element): void {
  const parent = table.parentNode;
  if (!parent) return;

  // Crear container
  this.toolbarContainer = document.createElement("div");
  this.toolbarContainer.id = "seneca-extension-toolbar";
  parent.insertBefore(this.toolbarContainer, parent.firstChild);

  // Montar Toolbar con métodos
  const toolbarApp = createApp(Toolbar, {
    visible: true,
  });

  toolbarApp.mount(this.toolbarContainer);

  // El componente emite eventos que capturamos así:
  // (Requiere exponer la instancia con expose)
}
```

**En Toolbar.vue:**

```vue
<script setup lang="ts">
const emit = defineEmits<Emits>();

// Exponer para que el padre pueda acceder
defineExpose({
  // ... métodos si los necesitas
});
</script>
```

### Opción 2: Usar un Estado Reactivo (MEJOR)

En lugar de pasar manejadores, usa un estado compartido:

```typescript
// src/content/index.ts
private injectUI(table: Element): void {
  // ... crear containers ...

  // Estado reactivo compartido
  const toolbarState = reactive({
    downloadClicked: false,
    uploadFile: null as File | null,
  });

  // Montar Toolbar
  const toolbarApp = createApp(Toolbar, {
    visible: true,
    modelValue: toolbarState, // Pasar estado
  });

  toolbarApp.mount(this.toolbarContainer);

  // Watchers para detectar cambios
  watch(() => toolbarState.downloadClicked, (value) => {
    if (value) {
      this.handleDownload();
      toolbarState.downloadClicked = false;
    }
  });

  watch(() => toolbarState.uploadFile, (file) => {
    if (file) {
      this.handleUpload(file);
      toolbarState.uploadFile = null;
    }
  });
}
```

**En Toolbar.vue:**

```vue
<script setup lang="ts">
interface Props {
  visible?: boolean;
  modelValue?: { downloadClicked: boolean; uploadFile: File | null };
}

const props = defineProps<Props>();

const handleDownloadClick = () => {
  if (props.modelValue) {
    props.modelValue.downloadClicked = true;
  }
};

const handleFileChange = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file && props.modelValue) {
    props.modelValue.uploadFile = file;
  }
};
</script>

<template>
  <button @click="handleDownloadClick">Descargar CSV</button>
</template>
```

### Opción 3: Usar Composables (MÁS LIMPIO)

Crear un composable compartido:

```typescript
// src/composables/useSenecaExtension.ts
import { ref } from "vue";

export const useSenecaExtension = () => {
  const downloadTriggered = ref(false);
  const uploadFile = ref<File | null>(null);

  const triggerDownload = () => {
    downloadTriggered.value = true;
  };

  const triggerUpload = (file: File) => {
    uploadFile.value = file;
  };

  return {
    downloadTriggered,
    uploadFile,
    triggerDownload,
    triggerUpload,
  };
};
```

**En Toolbar.vue:**

```vue
<script setup lang="ts">
import { useSenecaExtension } from "@/composables/useSenecaExtension";

const { triggerDownload, triggerUpload } = useSenecaExtension();
</script>

<template>
  <button @click="triggerDownload">Descargar CSV</button>
</template>
```

**En index.ts:**

```typescript
import { useSenecaExtension } from '@/composables/useSenecaExtension';

private injectUI(table: Element): void {
  // ...
  const { downloadTriggered, uploadFile } = useSenecaExtension();

  // Watchers para detectar cambios
  watch(downloadTriggered, (value) => {
    if (value) {
      this.handleDownload();
      downloadTriggered.value = false;
    }
  });

  watch(uploadFile, (file) => {
    if (file) {
      this.handleUpload(file);
      uploadFile.value = null;
    }
  });
}
```

---

## Cómo Debería Funcionar (Correctamente)

```
Usuario hace click en botón
         ↓
@click="$emit('download')" en Toolbar.vue
         ↓
Se emite evento "download"
         ↓
Componente padre escucha y ejecuta handleDownload()
         ↓
Se descarga CSV
```

**Problema actual:**
El evento se emite pero nadie lo escucha porque se pasó como prop en lugar de como listener.

---

## Resumen de Patrones en Vue 3

### Props (Datos que bajan ↓)

```typescript
interface Props {
  visible: boolean;
  title: string;
}
```

### Emits (Eventos que suben ↑)

```typescript
interface Emits {
  (e: "download"): void;
  (e: "upload", file: File): void;
}
```

### Escuchar Eventos (en componente padre)

```vue
<Toolbar @download="handleDownload" @upload="handleUpload" />
```

### Emitir Eventos (en componente hijo)

```vue
<button @click="emit('download')">Click</button>
```

---

## Recomendación

Para este proyecto, **Opción 2 (Estado Reactivo)** es la mejor porque:

- ✅ El componente es "dumb" (sin lógica)
- ✅ Fácil de testear
- ✅ Reutilizable
- ✅ Sigue el patrón de unidirectional data flow

O usar **Opción 3 (Composables)** si quieres arquitectura más profesional.

---

## Referencias

- [Vue 3 - Events Emitting](https://vuejs.org/guide/components/events.html)
- [Vue 3 - Composables](https://vuejs.org/guide/extras/composition-api-faq.html)
- [Vue 3 - Props](https://vuejs.org/guide/components/props.html)
