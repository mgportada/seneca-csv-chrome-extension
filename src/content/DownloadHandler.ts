import { TableParserService } from "@/services/TableParserService";
import { CSVUtils } from "@/utils/CSVUtils";

/**
 * Handler for CSV download functionality
 */
export class DownloadHandler {
  /**
   * Handle download button click
   */
  static handleDownload(): void {
    const table = document.querySelector<HTMLTableElement>("table");
    if (!table) {
      console.error("No table found");
      return;
    }

    const tableData = TableParserService.parseTable(table);
    if (!tableData || tableData.length === 0) {
      console.error("No data to export");
      return;
    }

    const csv = CSVUtils.tableToCSV(tableData);
    if (!csv) {
      console.error("Failed to generate CSV");
      return;
    }

    const filename = `seneca-calificaciones-${new Date().toISOString().split("T")[0]}.csv`;
    CSVUtils.downloadCSV(csv, filename);
  }
}
