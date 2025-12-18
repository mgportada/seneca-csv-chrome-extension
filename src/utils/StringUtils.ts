/**
 * Utility functions for string operations
 */
export class StringUtils {
  /**
   * Normalize string for comparison (remove accents, lowercase, trim spaces)
   */
  static normalize(value: string): string {
    return value
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/\s+/g, " ")
      .toLowerCase()
      .trim();
  }

  /**
   * Clean and normalize spaces in text
   */
  static cleanSpaces(text: string): string {
    return text.replace(/\s+/g, " ").trim();
  }

  /**
   * Sanitize numeric value from string (0-10 range, max 2 decimals)
   */
  static sanitizeNumericValue(raw: string): string {
    const cleaned = raw.replace(/,/g, ".").replace(/[^0-9.\-]/g, "");
    if (cleaned === "") return "";

    const num = Number(cleaned);
    if (!Number.isFinite(num)) return "";
    if (num < 0 || num > 10) return "";

    // Keep up to 2 decimals, drop trailing zeros
    const fixed = Math.round(num * 100) / 100;
    return String(fixed);
  }

  /**
   * Check if value is a valid numeric mark (0-10)
   */
  static isValidNumericMark(value: string): boolean {
    if (value === "") return false;
    const cleaned = value.replace(/,/g, ".").replace(/[^0-9.\-]/g, "");
    if (cleaned === "") return false;

    const num = Number(cleaned);
    return Number.isFinite(num) && num >= 0 && num <= 10;
  }

  /**
   * Get numeric value from string
   */
  static parseNumericValue(value: string): number | null {
    const cleaned = value.replace(/,/g, ".").replace(/[^0-9.\-]/g, "");
    if (cleaned === "") return null;

    const num = Number(cleaned);
    if (!Number.isFinite(num)) return null;
    if (num < 0 || num > 10) return null;

    return Math.round(num * 100) / 100;
  }
}
