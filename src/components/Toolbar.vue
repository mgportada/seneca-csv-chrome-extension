<template>
  <div v-if="visible" :style="styles.toolbar">
    <button :style="styles.downloadButton" @click="$emit('download')">Descargar CSV</button>
    <label :style="styles.uploadLabel" :for="inputId"> Subir CSV </label>
    <input :id="inputId" type="file" accept=".csv,text/csv" style="display: none" @change="handleFileChange" />
  </div>
</template>

<script setup lang="ts">
interface Props {
  visible?: boolean;
}

interface Emits {
  (e: "download"): void;
  (e: "upload", file: File): void;
}

const props = withDefaults(defineProps<Props>(), {
  visible: true,
});

const emit = defineEmits<Emits>();

const inputId = "seneca-csv-upload-input";

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    emit("upload", file);
    target.value = ""; // Reset input
  }
};

const styles = {
  toolbar: {
    position: "sticky" as const,
    top: "0",
    zIndex: 999,
    background: "#f8f9fa",
    border: "1px solid #e1e4e8",
    borderRadius: "6px",
    padding: "8px",
    margin: "8px 0",
    display: "flex" as const,
    alignItems: "center" as const,
    gap: "8px",
  },
  downloadButton: {
    display: "inline-block" as const,
    padding: "10px 14px",
    margin: "0 8px 0 0",
    background: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer" as const,
    fontSize: "14px",
    fontWeight: 600,
    lineHeight: "20px",
  },
  uploadLabel: {
    display: "inline-block" as const,
    padding: "10px 14px",
    margin: "0",
    background: "#28a745",
    color: "#fff",
    borderRadius: "4px",
    cursor: "pointer" as const,
    fontSize: "14px",
    fontWeight: 600,
    lineHeight: "20px",
  },
};
</script>
