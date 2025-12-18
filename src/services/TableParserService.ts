import type { TableCell } from "@/types";
import { StringUtils } from "@/utils/StringUtils";

/**
 * Service for parsing Seneca table structure
 */
export class TableParserService {
  /**
   * Parse table and extract student-activity mapping
   */
  static parseTable(table: HTMLTableElement): TableCell[] {
    if (!table) return [];

    const result: TableCell[] = [];
    const headers = this.extractHeaders(table);
    const tbodyRows = Array.from(table.querySelectorAll<HTMLTableRowElement>("tbody tr"));

    if (headers.length === 0 || tbodyRows.length === 0) return [];

    tbodyRows.forEach((tr, rowIndex) => {
      const studentName = this.getStudentName(tr);
      const tds = Array.from(tr.querySelectorAll("td"));

      tds.forEach((td, colIndex) => {
        const button = td.querySelector<HTMLButtonElement>("button[data-modalalumnotarea]");
        if (!button) return;

        const markId = button.getAttribute("data-modalalumnotarea");
        if (!markId) return;

        result.push({
          id: `${rowIndex}#${colIndex}`,
          rowIndex,
          colIndex,
          rowName: studentName,
          columnName: headers[colIndex],
          markId,
        });
      });
    });

    return result;
  }

  /**
   * Extract headers from table
   */
  private static extractHeaders(table: HTMLTableElement): string[] {
    const theadRows = table.querySelectorAll("thead tr");
    if (theadRows.length === 0) return [];

    const first = theadRows[0];
    const second = theadRows.length > 1 ? theadRows[1] : null;
    const headers: string[] = [];

    const ths1 = Array.from(first.querySelectorAll("th"));
    const ths2 = second ? Array.from(second.querySelectorAll("th")) : [];
    let i2 = 0;

    ths1.forEach((th, i) => {
      const rowspan = th.getAttribute("rowspan");
      const colspan = parseInt(th.getAttribute("colspan") || "1", 10);
      const text = this.cleanText(th);

      if (rowspan === "2") {
        if (text === "Unidad" || text === "Comentario") {
          headers.push("");
        } else if (text === "Alumno/a" && i === ths1.length - 1) {
          headers.push("");
        } else {
          headers.push(text);
        }
      } else {
        for (let k = 0; k < colspan; k++) {
          const sub = ths2[i2++];
          const subText = sub ? this.cleanText(sub) : "";
          if (subText && subText !== "Positivo" && subText !== "Negativo") {
            headers.push(subText);
          } else {
            headers.push("");
          }
        }
      }
    });

    return headers;
  }

  /**
   * Extract student name from table row
   */
  private static getStudentName(tr: HTMLTableRowElement): string {
    const td = tr.querySelector("td");
    const p = td ? td.querySelector("p") : null;
    const name = p ? p.textContent : td ? td.textContent : "";
    return name ? StringUtils.cleanSpaces(name) : "";
  }

  /**
   * Clean text from table element
   */
  private static cleanText(el: HTMLElement): string {
    const span = el.querySelector("span.texto-SNC, span[data-name], div.d-block, p");
    const txt = (span ? span.textContent : el.textContent) || "";
    return StringUtils.cleanSpaces(txt);
  }
}
