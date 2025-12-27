<template>
  <Teleport to="body">
    <div v-if="visible" :class="$style.overlay" @click="handleClose">
      <div :class="$style.modal" @click.stop>
        <div :class="$style.header" role="banner">
          <div :class="$style.titleBlock">
            <h2 :class="$style.title">Pega tus calificaciones</h2>
          </div>
          <button :class="$style.close" @click="handleClose" aria-label="Cerrar">✕</button>
        </div>

        <section :class="$style.body">
          <div
            :class="[$style.pasteZone, uploading ? $style.pasteZoneDisabled : '']"
            tabindex="0"
            @paste.prevent="handlePaste"
          >
            <div :class="$style.tableScroller" @keydown="handleKeydown">
              <table :class="$style.dataTable" @paste.prevent="handlePaste">
                <thead>
                  <tr>
                    <th v-for="(header, index) in headers" :key="index">
                      {{ header || `Columna ${index + 1}` }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, rowIndex) in rows" :key="rowIndex">
                    <td
                      v-for="(header, colIndex) in headers"
                      :key="colIndex"
                      :contenteditable="colIndex !== 0"
                      :data-row="rowIndex"
                      :data-col="colIndex"
                      :data-header="header"
                      :class="[$style.cell, valueClass(row?.[colIndex] || '', colIndex)]"
                      @paste.prevent="handleCellPaste($event, rowIndex, colIndex)"
                      @input="onCellInput($event, rowIndex, colIndex)"
                    >
                      {{ row?.[colIndex] || "" }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div v-if="logs.length" :class="$style.logPanel" ref="logContainer">
            <div :class="$style.logHeader">Progreso</div>
            <div :class="$style.progressTrack">
              <div :class="$style.progressFill" :style="{ width: `${computedPercentage}%` }"></div>
            </div>
            <div v-for="(log, index) in logs" :key="index" :class="getLogClass(log.type)">
              {{ log.message }}
            </div>
          </div>
        </section>

        <footer :class="$style.footer">
          <div :class="$style.summary">{{ summaryText }}</div>
          <div :class="$style.actions">
            <button :class="$style.secondary" :disabled="uploading" @click="handleClose">Cancelar</button>
            <button :class="$style.primary" :disabled="!canAccept || uploading" @click="handleAccept">
              {{ uploading ? "Subiendo..." : "Aceptar" }}
            </button>
          </div>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { CSVData, ModalTableCell, TableCell } from "@/types";
import { StringUtils } from "@/utils/StringUtils";
import { computed, nextTick, ref, useCssModule, watch } from "vue";

const $style = useCssModule();

interface Log {
  message: string;
  type: "info" | "success" | "error";
}

interface Props {
  visible: boolean;
  logs?: Log[];
  uploading?: boolean;
  current?: number;
  total?: number;
  percentage?: number;
  initialHeaders?: string[];
  initialRows?: string[][];
  tableCellsMap?: TableCell[];
}

const props = withDefaults(defineProps<Props>(), {
  logs: () => [],
  uploading: false,
  current: 0,
  total: 0,
  percentage: 0,
  initialHeaders: () => [],
  initialRows: () => [],
  tableCellsMap: () => [],
});

const emit = defineEmits<{
  (e: "close"): void;
  (e: "submit", payload: ModalTableCell[]): void;
}>();

const headers = ref<string[]>([]);
const rows = ref<string[][]>([]);
const logContainer = ref<HTMLDivElement | null>(null);

const studentCount = computed(() => {
  const names = rows.value.map((r) => (r[0] || "").trim()).filter(Boolean);
  return new Set(names).size;
});

const marksCount = computed(() =>
  rows.value.reduce((acc, row) => acc + row.slice(1).filter((v) => (v || "").trim() !== "").length, 0)
);

const canAccept = computed(() => rows.value.length > 0 && marksCount.value > 0 && studentCount.value > 0);

const computedPercentage = computed(() => {
  if (props.percentage) return Math.round(props.percentage);
  if (props.total === 0) return 0;
  return Math.round((props.current / props.total) * 100);
});

// Activities with at least one valid numeric value (0-10)
const activitiesAffectedCount = computed(() => {
  const headersAll = headers.value;
  let count = 0;
  for (let col = 1; col < headersAll.length; col++) {
    const hasAny = rows.value.some((r) => {
      const s = (r[col] ?? "").toString().trim();
      return StringUtils.isValidNumericMark(s);
    });
    if (hasAny) count++;
  }
  return count;
});

// Students with at least one valid numeric mark to change
const studentsAffectedCount = computed(() => {
  const seen = new Set<string>();
  rows.value.forEach((row) => {
    const student = (row?.[0] ?? "").toString().trim();
    if (!student) return;
    const hasAny = row.slice(1).some((s) => {
      const val = (s ?? "").toString().trim();
      return StringUtils.isValidNumericMark(val);
    });
    if (hasAny) seen.add(student);
  });
  return seen.size;
});

const summaryText = computed(
  () =>
    `Se sobrescribirán ${marksCount.value} notas para ${studentsAffectedCount.value} alumnos en ${activitiesAffectedCount.value} actividades`
);

const handleClose = () => {
  emit("close");
};

const handlePaste = (event: ClipboardEvent) => {
  const text = event.clipboardData?.getData("text/plain") || "";
  if (!text.trim()) return;

  const parsed = parseClipboard(text);
  if (!parsed) return;
  applyPastedData(parsed);
};

const parseClipboard = (text: string): CSVData | null => {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.length > 0);

  if (!lines.length) return null;

  // Detect delimiter: prefer tab, then semicolon, else comma
  const sample = lines[0];
  const hasTab = /\t/.test(sample);
  const hasSemi = /;/.test(sample);
  const hasComma = /,/.test(sample);
  const delimiter = hasTab ? /\t/ : hasSemi ? /;/ : hasComma ? /,/ : /\t/;

  const parsedRows = lines.map((line) => line.split(delimiter));
  if (!parsedRows.length) return null;

  // Treat all pasted lines as body rows (no header extraction)
  const body = parsedRows.map((row) => row.map((cell) => cell.trim()));
  // Use current table headers as reference
  const header = [
    "Alumno/a",
    ...Array.from({ length: Math.max(...body.map((r) => r.length)) - 1 }, (_, i) => `Act ${i + 1}`),
  ];

  return { header, rows: body };
};

const onCellInput = (event: Event, rowIndex: number, colIndex: number) => {
  // Prevent editing of student name column
  if (colIndex === 0) return;
  const target = event.target as HTMLElement;
  const raw = (target.textContent || "").trim();
  const value = sanitizeValue(raw, colIndex);
  ensureRowLength(rowIndex, colIndex);
  rows.value[rowIndex][colIndex] = value;
  if (target.textContent !== value) {
    target.textContent = value;
  }
};

const applyPastedData = (data: CSVData): number => {
  const currentHeaders = headers.value;
  const pastedHeaders = data.header.slice(1).map((h) => h.trim());
  let changes = 0;

  data.rows.forEach((pastedRow) => {
    const student = (pastedRow[0] || "").trim();
    if (!student) return;

    const targetRowIndex = rows.value.findIndex(
      (r) => StringUtils.normalize(r[0] || "") === StringUtils.normalize(student)
    );
    if (targetRowIndex === -1) return;

    pastedHeaders.forEach((pastedHeader, idx) => {
      const value = sanitizeValue((pastedRow[idx + 1] || "").trim(), colIndexFromHeader(pastedHeader, idx));
      if (value === "") return;

      const headerMatchIndex = currentHeaders.findIndex(
        (h) => StringUtils.normalize(h || "") === StringUtils.normalize(pastedHeader)
      );
      const colIndex = headerMatchIndex !== -1 ? headerMatchIndex : idx + 1;

      ensureRowLength(targetRowIndex, colIndex);
      rows.value[targetRowIndex][colIndex] = value;
      changes++;
    });
  });
  return changes;
};

const handleKeydown = async (e: KeyboardEvent) => {
  const isPasteCombo = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v";
  if (!isPasteCombo) return;
  try {
    const text = await navigator.clipboard.readText();
    if (!text || !text.trim()) return;
    const parsed = parseClipboard(text);
    if (!parsed) return;
    applyPastedData(parsed);
    e.preventDefault();
  } catch (_) {
    // Fallback silently if clipboard API is unavailable
  }
};

const handleCellPaste = (event: ClipboardEvent, startRow: number, startCol: number) => {
  const text = event.clipboardData?.getData("text/plain") || "";
  if (!text.trim()) return;
  const parsed = parseClipboard(text);
  if (!parsed) return;
  const changes = applyPastedData(parsed);
  if (changes > 0) return;
  // Fallback: paste as grid starting at the current cell, without touching name column (col 0)
  const body = parsed.rows;
  const startColumn = Math.max(startCol, 1);
  for (let r = 0; r < body.length; r++) {
    const targetRow = startRow + r;
    if (!rows.value[targetRow]) continue;
    const rowData = body[r];
    for (let c = 0; c < rowData.length; c++) {
      const targetCol = startColumn + c;
      ensureRowLength(targetRow, targetCol);
      const value = sanitizeValue((rowData[c] || "").trim(), targetCol);
      rows.value[targetRow][targetCol] = value;
    }
  }
};

// Utilities: validation + coloring
const sanitizeValue = (raw: string, colIndex: number): string => {
  // Never sanitize the first column (Alumno/a)
  if (colIndex === 0) return raw;
  return StringUtils.sanitizeNumericValue(raw);
};

const valueClass = (val: string, colIndex: number) => {
  if (colIndex === 0) return ""; // do not color name column
  const s = (val ?? "").toString().trim();
  if (s === "") return "";
  const v = Number(s.replace(/,/g, "."));
  if (!Number.isFinite(v)) return "";
  if (v >= 0 && v < 5) return $style.valLow;
  if (v >= 5 && v < 7) return $style.valMidLow;
  if (v >= 7 && v < 9) return $style.valMidHigh;
  if (v >= 9 && v <= 10) return $style.valHigh;
  return "";
};

const colIndexFromHeader = (pastedHeader: string, fallbackIdx: number): number => {
  const currentHeaders = headers.value;
  const matchIndex = currentHeaders.findIndex(
    (h) => StringUtils.normalize(h || "") === StringUtils.normalize(pastedHeader)
  );
  return matchIndex !== -1 ? matchIndex : fallbackIdx + 1;
};

const ensureRowLength = (rowIndex: number, colIndex: number) => {
  if (!rows.value[rowIndex]) rows.value[rowIndex] = [];
  const desired = colIndex + 1;
  while (rows.value[rowIndex].length < desired) {
    rows.value[rowIndex].push("");
  }
};

const handleAccept = () => {
  const headersAll = headers.value;
  const sourceRows = rows.value;
  const payload: ModalTableCell[] = [];

  sourceRows.forEach((row) => {
    const studentName = (row[0] ?? "").toString().trim();
    if (!studentName) return;

    for (let col = 1; col < headersAll.length; col++) {
      const raw = (row[col] ?? "").toString().trim();
      const val = sanitizeValue(raw, col);
      if (val === "") continue; // skip non-numeric/empty

      const activityName = headersAll[col];

      // Find markId from tableCellsMap
      const cell = props.tableCellsMap.find(
        (c) =>
          StringUtils.normalize(c.rowName) === StringUtils.normalize(studentName) &&
          StringUtils.normalize(c.columnName) === StringUtils.normalize(activityName)
      );

      if (!cell || !cell.markId) continue;

      payload.push({
        studentName,
        activityName,
        markId: cell.markId,
        value: Number(val),
      });
    }
  });

  emit("submit", payload);
};

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
  () => props.logs?.length || 0,
  async () => {
    await nextTick();
    if (logContainer.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight;
    }
  }
);

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      headers.value = props.initialHeaders && props.initialHeaders.length ? props.initialHeaders : [];
      rows.value = props.initialRows && props.initialRows.length ? props.initialRows : [];
    }
  }
);
</script>

<style scoped module src="./UploadModal.css"></style>
