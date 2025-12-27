/**
 * CSV data structure
 */
export interface CSVData {
  header: string[];
  rows: string[][];
}

/**
 * CSV validation error
 */
export interface ValidationError {
  row: number;
  student: string;
  activity: string;
  invalidValue: string;
}

/**
 * Upload progress state
 */
export interface UploadState {
  paused: boolean;
  cancelled: boolean;
}

/**
 * Upload progress callback data
 */
export interface UploadProgress {
  current: number;
  total: number;
  percentage: number;
  message: string;
  type: "info" | "success" | "error";
}
