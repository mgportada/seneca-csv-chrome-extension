import type { CSVData, TableCell } from "@/types";

/**
 * Utility functions for CSV operations
 */
export class CSVUtils {
  /**
   * Convert table data to CSV format
   */
  static tableToCSV(tableData: TableCell[]): string | null {
    if (!tableData || tableData.length === 0) return null;

    const students = [...new Set(tableData.map((item) => item.rowName))];
    const activities = [...new Set(tableData.map((item) => item.columnName))];

    const header = ["Alumno/a", ...activities];
    const rows = [header.join(";")];

    students.forEach((student) => {
      const row = [this.sanitize(student)];

      activities.forEach(() => {
        row.push("");
      });

      rows.push(row.join(";"));
    });

    return rows.join("\n");
  }

  /**
   * Parse CSV text to data structure
   */
  static parseCSV(text: string): CSVData | null {
    const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
    if (lines.length === 0) return null;

    const header = this.splitSemicolons(lines[0]);
    const rows = lines.slice(1).map((line) => this.splitSemicolons(line));

    return { header, rows };
  }

  /**
   * Download CSV file
   */
  static downloadCSV(csv: string, filename: string): void {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  /**
   * Sanitize text for CSV
   */
  private static sanitize(text: string): string {
    const t = text.replace(/"/g, '""');
    return t.includes(";") || t.includes('"') || t.includes("\n") ? `"${t}"` : t;
  }

  /**
   * Split line by semicolons, respecting quotes
   */
  private static splitSemicolons(line: string): string[] {
    const res: string[] = [];
    let cur = "";
    let inQ = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQ && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQ = !inQ;
        }
      } else if (ch === ";" && !inQ) {
        res.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
    res.push(cur);
    return res;
  }
}
