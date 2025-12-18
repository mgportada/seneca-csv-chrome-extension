<template>
  <div>
    <Toolbar @open="openModal" />
    <UploadModal
      :visible="modalState.visible"
      :logs="modalState.logs"
      :uploading="modalState.uploading"
      :current="modalState.current"
      :total="modalState.total"
      :percentage="modalState.percentage"
      :initialHeaders="initialHeaders"
      :initialRows="initialRows"
      :tableCellsMap="tableCellsMap"
      @close="handleModalClose"
      @submit="handleModalSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import Toolbar from "@/components/Toolbar/Toolbar.vue";
import UploadModal from "@/components/UploadModal/UploadModal.vue";
import { UploadHandler } from "@/content/UploadHandler";
import { TableParserService } from "@/services/TableParserService";
import type { ModalTableCell, TableCell, UploadProgress } from "@/types";
import { reactive, ref } from "vue";

interface ModalState {
  visible: boolean;
  current: number;
  total: number;
  percentage: number;
  logs: Array<{ message: string; type: "info" | "success" | "error" }>;
  uploading: boolean;
}

const modalState = reactive<ModalState>({
  visible: false,
  current: 0,
  total: 0,
  percentage: 0,
  logs: [],
  uploading: false,
});

let uploadHandler: UploadHandler | null = null;
const initialHeaders = ref<string[]>([]);
const initialRows = ref<string[][]>([]);
const tableCellsMap = ref<TableCell[]>([]);

const openModal = () => {
  modalState.visible = true;
  // Build initial grid from the Seneca table (students x activities)
  initialHeaders.value = [];
  initialRows.value = [];
  tableCellsMap.value = [];
  const table = document.querySelector<HTMLTableElement>("table");
  if (table) {
    const tableCells = TableParserService.parseTable(table);
    tableCellsMap.value = tableCells;
    if (tableCells.length > 0) {
      const students = Array.from(new Set(tableCells.map((c) => c.rowName))).filter((n) => n && n.trim() !== "");
      const activities = Array.from(new Set(tableCells.map((c) => c.columnName))).filter((n) => n && n.trim() !== "");
      initialHeaders.value = ["Alumno/a", ...activities];
      initialRows.value = students.map((s) => [s, ...Array(activities.length).fill("")]);
    }
  }
};

const handleModalSubmit = async (data: ModalTableCell[]) => {
  modalState.current = 0;
  modalState.total = 0;
  modalState.percentage = 0;
  modalState.logs = [];
  modalState.uploading = true;

  uploadHandler = new UploadHandler((progress: UploadProgress) => {
    modalState.current = progress.current;
    modalState.total = progress.total;
    modalState.percentage = progress.percentage;
    modalState.logs.push({
      message: progress.message,
      type: progress.type,
    });

    if (progress.type === "error" || progress.percentage === 100) {
      modalState.uploading = false;
    }
  });

  try {
    await uploadHandler.processCells(data);
    modalState.uploading = false;
  } catch (error) {
    console.error("Error processing data:", error);
    modalState.logs.push({
      message: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      type: "error",
    });
    modalState.uploading = false;
  }
};

const handleModalClose = () => {
  if (uploadHandler) {
    uploadHandler.cancel();
  }
  modalState.visible = false;
  modalState.uploading = false;
};
</script>
