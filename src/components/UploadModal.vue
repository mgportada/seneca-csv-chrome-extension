<template>
  <Teleport to="body">
    <div v-if="visible" :style="styles.overlay" @click="$emit('close')">
      <div :style="styles.modal" @click.stop>
        <div :style="styles.header">
          {{ title }}
        </div>

        <div :style="styles.progressContainer">
          <div :style="styles.progressText">{{ current }} / {{ total }}</div>
          <div :style="styles.progressBar">
            <div :style="{ ...styles.progressFill, width: `${percentage}%` }"></div>
          </div>
        </div>

        <div :style="styles.logContainer" ref="logContainer">
          <div v-for="(log, index) in logs" :key="index" :style="getLogStyle(log.type)">
            {{ log.message }}
          </div>
        </div>

        <div :style="styles.footer">
          <button v-if="!completed && !cancelled" :style="pauseButtonStyle" @click="$emit('pause')">
            {{ paused ? "Reanudar" : "Pausar" }}
          </button>
          <button v-if="!completed && !cancelled" :style="styles.cancelButton" @click="$emit('cancel')">
            Cancelar
          </button>
          <button v-if="completed || cancelled" :style="closeButtonStyle" @click="$emit('close')">Cerrar</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";

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

const pauseButtonStyle = computed(() => ({
  ...styles.pauseButton,
  background: props.paused ? "#17a2b8" : "#ffc107",
}));

const closeButtonStyle = computed(() => ({
  ...styles.closeButton,
  cursor: "pointer",
  background: "#007bff",
}));

const getLogStyle = (type: string) => {
  const baseStyle = { padding: "4px 0" };
  switch (type) {
    case "info":
      return { ...baseStyle, color: "#007bff" };
    case "success":
      return { ...baseStyle, color: "#28a745" };
    case "error":
      return { ...baseStyle, color: "#dc3545" };
    default:
      return baseStyle;
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

const styles = {
  overlay: {
    position: "fixed" as const,
    top: "0",
    left: "0",
    right: "0",
    bottom: "0",
    background: "rgba(0, 0, 0, 0.5)",
    zIndex: 9999,
  },
  modal: {
    position: "fixed" as const,
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "600px",
    maxHeight: "80vh",
    background: "white",
    borderRadius: "8px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
    zIndex: 10000,
    display: "flex" as const,
    flexDirection: "column" as const,
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  header: {
    padding: "16px 20px",
    borderBottom: "1px solid #e1e4e8",
    fontWeight: 600,
    fontSize: "16px",
  },
  progressContainer: {
    padding: "16px 20px",
    borderBottom: "1px solid #e1e4e8",
  },
  progressText: {
    fontSize: "14px",
    color: "#666",
    marginBottom: "8px",
  },
  progressBar: {
    width: "100%",
    height: "8px",
    background: "#e1e4e8",
    borderRadius: "4px",
    overflow: "hidden" as const,
  },
  progressFill: {
    height: "100%",
    background: "#28a745",
    transition: "width 0.3s ease",
  },
  logContainer: {
    flex: "1",
    overflowY: "auto" as const,
    padding: "16px 20px",
    fontSize: "13px",
    fontFamily: "monospace",
    background: "#f6f8fa",
    maxHeight: "400px",
  },
  footer: {
    padding: "16px 20px",
    borderTop: "1px solid #e1e4e8",
    display: "flex" as const,
    justifyContent: "flex-end" as const,
    gap: "8px",
  },
  pauseButton: {
    padding: "8px 16px",
    color: "#212529",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer" as const,
    fontSize: "14px",
  },
  cancelButton: {
    padding: "8px 16px",
    background: "#dc3545",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer" as const,
    fontSize: "14px",
  },
  closeButton: {
    padding: "8px 16px",
    background: "#6c757d",
    color: "white",
    border: "none",
    borderRadius: "4px",
    fontSize: "14px",
  },
};
</script>
