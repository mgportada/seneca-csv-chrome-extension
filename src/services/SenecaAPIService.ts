import type { Criteria, CriteriaResult, CriteriaWithValue, FormFields } from "@/types";

/**
 * Service for interacting with Seneca API
 */
export class SenecaAPIService {
  private static readonly BASE_URL = "https://seneca.juntadeandalucia.es";

  /**
   * Get evaluation criteria for a specific mark ID
   */
  static async getCriteria(markId: string): Promise<CriteriaResult> {
    try {
      const params = new URLSearchParams({
        X_NOTACTEVA: markId,
        DESHABILITAR: "N",
        MODO: "edit",
        F_ENTREGA: this.getCurrentDate(),
        L_FP: "",
      });

      const url = `${this.BASE_URL}/seneca/nav/pasen/actividadesevaluables/MontarModalCuaderno_2023.jsp?${params}`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Accept: "text/html, */*; q=0.01",
          "Content-Length": "0",
          "X-Requested-With": "XMLHttpRequest",
        },
        credentials: "same-origin",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();
      return this.extractCriteriaFromHTML(html);
    } catch (error) {
      console.error("Error fetching criteria:", error);
      throw error;
    }
  }

  /**
   * Post mark values for multiple criteria
   */
  static async postMark(markId: string, criteria: CriteriaWithValue[], fields: FormFields): Promise<void> {
    const mapCalificacionesModal = criteria.map((c) => `[${c.id},${c.value}]`).join("");
    const finalMap = `{${mapCalificacionesModal}}`;

    console.log(`[POST] markId: ${markId}, map: ${finalMap}`);

    if (!markId || !fields?.X_GRUALUPROMAT || !fields?.X_CONVCENTRO || !finalMap) {
      throw new Error("Missing required fields for posting mark.");
    }

    const formData = new FormData();
    formData.append("MODO", "GRABAR_NOTA_MODAL");
    formData.append("X_NOTACTEVA", markId);
    formData.append("L_DIARIA", fields?.L_DIARIA || "N");
    formData.append("L_FP", fields?.L_FP || "N");
    formData.append("L_LOMLOE", fields?.L_LOMLOE || "S");
    formData.append("X_GRUALUPROMAT", fields?.X_GRUALUPROMAT || "");
    formData.append("F_ENTREGA", fields?.F_ENTREGA || this.getCurrentDate());
    formData.append("X_CONVCENTRO", fields?.X_CONVCENTRO || "");
    formData.append("L_DIRECCION", "SIGUIENTE");
    formData.append("mapCalificacionesModal", finalMap);
    formData.append("ACTIVAR_PROCESO", "S");
    formData.append("SIN_ALUMNO_SIGUIENTE", "S");

    try {
      const response = await fetch(`${this.BASE_URL}/seneca/nav/pasen/actividadesevaluables/PMRegCalActEva_2023.jsp`, {
        method: "POST",
        headers: {
          Accept: "application/json, text/javascript, */*; q=0.01",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: formData,
        credentials: "same-origin",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error in postMark:", error);
      throw error;
    }
  }

  /**
   * Extract field inputs and criteria from HTML response
   */
  private static extractCriteriaFromHTML(html: string): CriteriaResult {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const fieldNames = [
      "X_NOTACTEVA",
      "X_ACTEVA",
      "L_DESHABILITADO",
      "L_DIARIA",
      "F_ENTREGA",
      "L_FP",
      "L_LOMLOE",
      "X_GRUALUPROMAT",
      "X_CONVCENTRO",
    ];

    const fields: FormFields = {
      X_NOTACTEVA: null,
      X_ACTEVA: null,
      L_DESHABILITADO: null,
      L_DIARIA: null,
      F_ENTREGA: null,
      L_FP: null,
      L_LOMLOE: null,
      X_GRUALUPROMAT: null,
      X_CONVCENTRO: null,
      mapNotActEva: "[]",
      mapDeshabilitados: "{}",
    };

    fieldNames.forEach((name) => {
      const input = doc.querySelector<HTMLInputElement>(`input[id="${name}"]`);
      if (input && name in fields) {
        (fields as any)[name] = input.value;
      }
    });

    const mapNotActEvaInput = doc.querySelector<HTMLInputElement>('input[id="mapNotActEva"]');
    fields.mapNotActEva = mapNotActEvaInput ? mapNotActEvaInput.value : "[]";

    const mapDeshabilitadosInput = doc.querySelector<HTMLInputElement>('input[id="mapDeshabilitados"]');
    fields.mapDeshabilitados = mapDeshabilitadosInput ? mapDeshabilitadosInput.value : "{}";

    const criteria: Criteria[] = [];
    const criteriaElements = doc.querySelectorAll<HTMLElement>('[id^="X_CRIEVACOMBAS_"]');

    criteriaElements.forEach((el) => {
      const criteriaId = el.id;
      if (!criteria.find((c) => c.id === criteriaId)) {
        const label = doc.querySelector<HTMLLabelElement>(`label[for="${criteriaId}"]`);
        criteria.push({
          id: criteriaId,
          name: label ? label.textContent?.trim().substring(0, 50) || criteriaId : criteriaId,
        });
      }
    });

    return { fields, criteria };
  }

  /**
   * Get current date in DD/MM/YYYY format
   */
  private static getCurrentDate(): string {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();
    return `${day}/${month}/${year}`;
  }
}
