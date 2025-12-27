import { SenecaAPIService } from "@/services/SenecaAPIService";
import type { ModalTableCell, UploadProgress, UploadState } from "@/types";

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
   * Upload items to Seneca
   */
  async processCells(items: ModalTableCell[]): Promise<void> {
    if (!items || items.length === 0) {
      this.emitProgress(0, 0, 0, "No hay celdas para procesar", "error");
      return;
    }

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
