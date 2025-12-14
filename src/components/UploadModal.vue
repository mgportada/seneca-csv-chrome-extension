<template>
  <Teleport to="body">
    <div v-if="visible" :class="$style.overlay" @click="$emit('close')">
      <div :class="$style.modal" @click.stop>
        <div :class="$style.header">
          {{ title }}
        </div>

        <div :class="$style.progressContainer">
          <div :class="$style.progressText">{{ current }} / {{ total }}</div>
          <div :class="$style.progressBar">
            <div :class="$style.progressFill" :style="{ width: `${percentage}%` }"></div>
          </div>
        </div>

        <div :class="$style.logContainer" ref="logContainer">
          <div v-for="(log, index) in logs" :key="index" :class="getLogClass(log.type)">
            {{ log.message }}
          </div>
        </div>

        <div :class="$style.footer">
          <button v-if="!completed && !cancelled" :class="pauseButtonClass" @click="$emit('pause')">
            {{ paused ? "Reanudar" : "Pausar" }}
          </button>
          <button v-if="!completed && !cancelled" :class="$style.cancelButton" @click="$emit('cancel')">
            Cancelar
          </button>
          <button v-if="completed || cancelled" :class="$style.closeButton" @click="$emit('close')">Cerrar</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, useCssModule, watch } from "vue";

const $style = useCssModule();

interface Log {
  message: string;
  type: "info" | "success" | "error";
}

interface Props {
  visible: boolean;
  title: string;
  current: number;
  total: number;
  logs: Log[];
  paused?: boolean;
  completed?: boolean;
  cancelled?: boolean;
}

interface Emits {
  (e: "close"): void;
  (e: "pause"): void;
  (e: "cancel"): void;
}

const props = withDefaults(defineProps<Props>(), {
  paused: false,
  completed: false,
  cancelled: false,
});

const emit = defineEmits<Emits>();

const logContainer = ref<HTMLDivElement | null>(null);

const percentage = computed(() => {
  if (props.total === 0) return 0;
  return Math.round((props.current / props.total) * 100);
});

const pauseButtonClass = computed(() => {
  const base = $style.pauseButton;
  const active = props.paused ? $style.pauseButtonActive : $style.pauseButtonInactive;
  return `${base} ${active}`;
});

const getLogClass = (type: string) => {
  switch (type) {
    case "info":
      return $style.logInfo;
    case "success":
      return $style.logSuccess;
    case "error":
      return $style.logError;
    default:
      return "";
  }
};

watch(
  () => props.logs.length,
  async () => {
    await nextTick();
    if (logContainer.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight;
    }
  }
);
</script>

<style module src="./UploadModal.module.css"></style>
