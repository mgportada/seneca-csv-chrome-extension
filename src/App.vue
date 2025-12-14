<template>
  <div>
    <Toolbar @download="handleDownload" @upload="handleUpload" />
    <UploadModal
      :visible="modalState.visible"
      :title="modalState.title"
      :current="modalState.current"
      :total="modalState.total"
      :logs="modalState.logs"
      :paused="modalState.paused"
      :completed="modalState.completed"
      :cancelled="modalState.cancelled"
      @close="handleModalClose"
      @pause="handleModalPause"
      @cancel="handleModalCancel"
    />
  </div>
</template>

<script setup lang="ts">
import Toolbar from "@/components/Toolbar/Toolbar.vue";
import UploadModal from "@/components/UploadModal/UploadModal.vue";
import { DownloadHandler } from "@/content/DownloadHandler";
import { UploadHandler } from "@/content/UploadHandler";
import type { UploadProgress } from "@/types";
import { reactive } from "vue";

interface ModalState {
  visible: boolean;
  title: string;
  current: number;
  total: number;
  logs: Array<{ message: string; type: "info" | "success" | "error" }>;
  paused: boolean;
  completed: boolean;
  cancelled: boolean;
}

const modalState = reactive<ModalState>({
  visible: false,
  title: "Subiendo calificaciones...",
  current: 0,
  total: 0,
  logs: [],
  paused: false,
  completed: false,
  cancelled: false,
});

let uploadHandler: UploadHandler | null = null;

/**
 * Handle download button click
 */
const handleDownload = () => {
  DownloadHandler.handleDownload();
};

/**
 * Handle file upload
 */
const handleUpload = async (file: File) => {
  // Reset modal state
  modalState.visible = true;
  modalState.current = 0;
  modalState.total = 0;
  modalState.logs = [];
  modalState.paused = false;
  modalState.completed = false;
  modalState.cancelled = false;

  // Create upload handler
  uploadHandler = new UploadHandler((progress: UploadProgress) => {
    modalState.current = progress.current;
    modalState.total = progress.total;
    modalState.logs.push({
      message: progress.message,
      type: progress.type,
    });

    if (progress.type === "error" || progress.percentage === 100) {
      modalState.completed = true;
    }
  });

  try {
    await uploadHandler.processFile(file);
  } catch (error) {
    console.error("Error processing file:", error);
    modalState.logs.push({
      message: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      type: "error",
    });
    modalState.completed = true;
  }
};

/**
 * Handle modal close
 */
const handleModalClose = () => {
  modalState.visible = false;
  uploadHandler = null;
};

/**
 * Handle modal pause
 */
const handleModalPause = () => {
  if (uploadHandler) {
    uploadHandler.pause();
    modalState.paused = uploadHandler.isPaused();
  }
};

/**
 * Handle modal cancel
 */
const handleModalCancel = () => {
  if (uploadHandler) {
    uploadHandler.cancel();
    modalState.cancelled = true;
  }
};
</script>
