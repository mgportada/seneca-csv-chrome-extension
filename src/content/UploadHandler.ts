import { SenecaAPIService } from "@/services/SenecaAPIService";
import { TableParserService } from "@/services/TableParserService";
import type { CSVData, ModalTableCell, UploadProgress, UploadState, ValidationError } from "@/types";
import { CSVUtils } from "@/utils/CSVUtils";
import { StringUtils } from "@/utils/StringUtils";

/**
 * Unified upload item interface
 */
interface UploadItem {
  studentName: string;
  activityName: string;
  markId: string;
  value: number;
}

/**
 * Handler for CSV upload functionality
 */
export class UploadHandler {
  private state: UploadState = {
    paused: false,
    cancelled: false,
  };

  private onProgress?: (progress: UploadProgress) => void;

  constructor(onProgress?: (progress: UploadProgress) => void) {
    this.onProgress = onProgress;
  }

  /**
   * Process uploaded CSV file
   */
  async processFile(file: File): Promise<void> {
    const text = await file.text();
    const data = CSVUtils.parseCSV(text);
    await this.processData(data);
  }

  /**
   * Process cells directly from modal
   */
  async processCells(cells: ModalTableCell[]): Promise<void> {
    if (!cells || cells.length === 0) {
      this.emitProgress(0, 0, 0, "No hay celdas para procesar", "error");
      return;
    }

    await this.upload(cells);
  }

  /**
   * Process already parsed CSV-like data (pasted grid)
   */
  async processData(data: CSVData | null): Promise<void> {
    if (!data || data.rows.length === 0) {
      this.emitProgress(0, 0, 0, "CSV vacío o inválido", "error");
      return;
    }

    const table = document.querySelector<HTMLTableElement>("table");
    if (!table) {
      this.emitProgress(0, 0, 0, "No se encontró la tabla", "error");
      return;
    }

    const tableMap = TableParserService.parseTable(table);
    if (!tableMap || tableMap.length === 0) {
      this.emitProgress(0, 0, 0, "No se pudo parsear la tabla", "error");
      return;
    }

    const { items, errors } = this.buildUploadItems(data, tableMap);

    if (errors.length > 0) {
      const errorMsg = errors
        .map((e) => `Fila ${e.row}: "${e.student}" - "${e.activity}" tiene valor inválido: "${e.invalidValue}"`)
        .join("\n");
      this.emitProgress(0, 0, 0, `⚠️ CSV contiene valores no numéricos:\n\n${errorMsg}`, "error");
      return;
    }

    await this.upload(items);
  }

  /**
   * Build upload items from CSV data
   */
  private buildUploadItems(data: CSVData, tableMap: any[]): { items: UploadItem[]; errors: ValidationError[] } {
    const activities = data.header.slice(1);
    const items: UploadItem[] = [];
    const errors: ValidationError[] = [];

    data.rows.forEach((csvRow, rowIdx) => {
      const studentName = (csvRow[0] || "").trim();
      if (!studentName) return;

      activities.forEach((activityName, i) => {
        const mark = csvRow[i + 1];
        if (!mark || mark.trim() === "") return;

        const value = StringUtils.parseNumericValue(mark.trim());
        if (value === null) {
          errors.push({
            row: rowIdx + 2,
            student: studentName,
            activity: activityName,
            invalidValue: mark.trim(),
          });
          return;
        }

        const cell = tableMap.find(
          (item) =>
            StringUtils.normalize(item.rowName) === StringUtils.normalize(studentName) &&
            StringUtils.normalize(item.columnName) === StringUtils.normalize(activityName)
        );
        if (!cell?.markId) return;

        items.push({ studentName, activityName, markId: cell.markId, value });
      });
    });

    return { items, errors };
  }

  /**
   * Upload items to Seneca
   */
  private async upload(items: UploadItem[]): Promise<void> {
    this.state = { paused: false, cancelled: false };
    const calcProgress = (index: number) => (index / items.length) * 100;

    for (let i = 0; i < items.length; i++) {
      if (this.state.cancelled) {
        this.emitProgress(i, items.length, calcProgress(i), "⏹ Proceso cancelado por el usuario", "error");
        break;
      }

      while (this.state.paused && !this.state.cancelled) {
        await this.sleep(200);
      }

      const item = items[i];

      try {
        // Get criteria
        this.emitProgress(
          i,
          items.length,
          calcProgress(i),
          `🔍 Obteniendo criterios para ${item.studentName} - ${item.activityName}...`,
          "info"
        );

        const { fields, criteria } = await SenecaAPIService.getCriteria(item.markId);
        this.emitProgress(i, items.length, calcProgress(i), `✓ ${criteria.length} criterios obtenidos`, "success");

        // Upload mark
        this.emitProgress(
          i,
          items.length,
          calcProgress(i),
          `📤 Subiendo nota ${item.value} a ${criteria.length} criterios...`,
          "info"
        );

        const criteriaWithValues = criteria.map((c) => ({ id: c.id, value: item.value }));
        await SenecaAPIService.postMark(item.markId, criteriaWithValues, fields);

        this.emitProgress(
          i + 1,
          items.length,
          calcProgress(i + 1),
          `✓ ${item.studentName} - ${item.activityName}: ${item.value}`,
          "success"
        );

        await this.sleep(500);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Error desconocido";
        this.emitProgress(
          i,
          items.length,
          calcProgress(i),
          `❌ Error: ${item.studentName} - ${item.activityName}: ${errorMessage}`,
          "error"
        );
        this.emitProgress(i, items.length, calcProgress(i), "⏹ Proceso detenido por error", "error");
        break;
      }
    }

    if (!this.state.cancelled && items.length > 0) {
      this.emitProgress(items.length, items.length, 100, "✅ Proceso completado", "success");
    }
  }

  /**
   * Pause upload process
   */
  pause(): void {
    this.state.paused = !this.state.paused;
  }

  /**
   * Cancel upload process
   */
  cancel(): void {
    this.state.cancelled = true;
  }

  /**
   * Check if process is paused
   */
  isPaused(): boolean {
    return this.state.paused;
  }

  /**
   * Emit progress event
   */
  private emitProgress(
    current: number,
    total: number,
    percentage: number,
    message: string,
    type: "info" | "success" | "error"
  ): void {
    if (this.onProgress) {
      this.onProgress({ current, total, percentage, message, type });
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
