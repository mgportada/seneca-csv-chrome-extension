<template>
  <div v-if="visible" class="toolbar">
    <button class="downloadButton" @click="handleDownloadClick">Descargar CSV</button>
    <label class="uploadLabel" :for="inputId">Subir CSV</label>
    <input :id="inputId" type="file" accept=".csv,text/csv" style="display: none" @change="handleFileChange" />
  </div>
</template>

<script setup lang="ts">
interface Props {
  visible?: boolean;
}

withDefaults(defineProps<Props>(), {
  visible: true,
});

const emit = defineEmits<{
  download: [];
  upload: [file: File];
}>();

const inputId = "seneca-csv-upload-input";

const handleDownloadClick = () => {
  emit("download");
};

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    emit("upload", file);
    target.value = ""; // Reset input
  }
};
</script>

<style scoped src="./Toolbar.css"></style>
