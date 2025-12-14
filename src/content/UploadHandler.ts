import { SenecaAPIService } from "@/services/SenecaAPIService";
import { TableParserService } from "@/services/TableParserService";
import type { UploadPayloadItem, UploadProgress, UploadState, ValidationError } from "@/types";
import { CSVUtils } from "@/utils/CSVUtils";

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

    const { payload, errors } = this.buildPayload(data, tableMap);

    if (errors.length > 0) {
      const errorMsg = errors
        .map((e) => `Fila ${e.row}: "${e.student}" - "${e.activity}" tiene valor inválido: "${e.invalidValue}"`)
        .join("\n");
      this.emitProgress(0, 0, 0, `⚠️ CSV contiene valores no numéricos:\n\n${errorMsg}`, "error");
      return;
    }

    await this.uploadPayload(payload);
  }

  /**
   * Build payload from CSV data
   */
  private buildPayload(
    data: { header: string[]; rows: string[][] },
    tableMap: any[]
  ): { payload: UploadPayloadItem[]; errors: ValidationError[] } {
    const header = data.header;
    const activities = header.slice(1);
    const payload: UploadPayloadItem[] = [];
    const errors: ValidationError[] = [];

    data.rows.forEach((csvRow, rowIdx) => {
      const student = (csvRow[0] || "").trim();
      if (!student) return;

      activities.forEach((activity, i) => {
        const mark = csvRow[i + 1];
        if (!mark || mark.trim() === "") return;

        const trimmedMark = mark.trim();
        const numericMark = Number(trimmedMark);

        if (!Number.isFinite(numericMark)) {
          errors.push({
            row: rowIdx + 2,
            student,
            activity,
            invalidValue: trimmedMark,
          });
          return;
        }

        const cell = tableMap.find((item) => item.rowName === student && item.columnName === activity);
        if (!cell || !cell.markId) return;

        payload.push({
          rowName: student,
          columnName: activity,
          markId: cell.markId,
          value: numericMark,
        });
      });
    });

    return { payload, errors };
  }

  /**
   * Upload payload items
   */
  private async uploadPayload(payload: UploadPayloadItem[]): Promise<void> {
    this.state = { paused: false, cancelled: false };

    for (let i = 0; i < payload.length; i++) {
      if (this.state.cancelled) {
        this.emitProgress(i, payload.length, (i / payload.length) * 100, "⏹ Proceso cancelado por el usuario", "error");
        break;
      }

      while (this.state.paused && !this.state.cancelled) {
        await this.sleep(200);
      }

      const item = payload[i];

      try {
        this.emitProgress(
          i,
          payload.length,
          (i / payload.length) * 100,
          `🔍 Obteniendo criterios para ${item.rowName} - ${item.columnName}...`,
          "info"
        );

        const result = await SenecaAPIService.getCriteria(item.markId);
        const { fields, criteria } = result;

        this.emitProgress(
          i,
          payload.length,
          (i / payload.length) * 100,
          `✓ ${criteria.length} criterios obtenidos`,
          "success"
        );

        this.emitProgress(
          i,
          payload.length,
          (i / payload.length) * 100,
          `📤 Subiendo nota ${item.value} a ${criteria.length} criterios...`,
          "info"
        );

        const criteriaWithValues = criteria.map((c) => ({
          id: c.id,
          value: item.value,
        }));

        await SenecaAPIService.postMark(item.markId, criteriaWithValues, fields);

        this.emitProgress(
          i + 1,
          payload.length,
          ((i + 1) / payload.length) * 100,
          `✓ ${item.rowName} - ${item.columnName}: ${item.value}`,
          "success"
        );

        await this.sleep(500);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Error desconocido";
        this.emitProgress(
          i,
          payload.length,
          (i / payload.length) * 100,
          `❌ Error: ${item.rowName} - ${item.columnName}: ${errorMessage}`,
          "error"
        );
        this.emitProgress(i, payload.length, (i / payload.length) * 100, "⏹ Proceso detenido por error", "error");
        break;
      }
    }

    if (!this.state.cancelled && payload.length > 0) {
      this.emitProgress(payload.length, payload.length, 100, "✅ Proceso completado", "success");
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
