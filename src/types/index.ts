/**
 * Represents a cell in the parsed table
 */
export interface TableCell {
  id: string;
  rowIndex: number;
  colIndex: number;
  rowName: string;
  columnName: string;
  markId: string;
}

export interface ModalTableCell {
  studentName: string;
  activityName: string;
  markId: string;
  value: number;
}

/**
 * Evaluation criteria for a mark
 */
export interface Criteria {
  id: string;
  name: string;
}

/**
 * Form fields required for API requests
 */
export interface FormFields {
  X_NOTACTEVA: string | null;
  X_ACTEVA: string | null;
  L_DESHABILITADO: string | null;
  L_DIARIA: string | null;
  F_ENTREGA: string | null;
  L_FP: string | null;
  L_LOMLOE: string | null;
  X_GRUALUPROMAT: string | null;
  X_CONVCENTRO: string | null;
  mapNotActEva: string;
  mapDeshabilitados: string;
}

/**
 * Result from getCriteria API call
 */
export interface CriteriaResult {
  fields: FormFields;
  criteria: Criteria[];
}

/**
 * Criteria with assigned value
 */
export interface CriteriaWithValue {
  id: string;
  value: number;
}

/**
 * CSV data structure
 */
export interface CSVData {
  header: string[];
  rows: string[][];
}

/**
 * Payload item for uploading marks
 */
export interface UploadPayloadItem {
  rowName: string;
  columnName: string;
  markId: string;
  value: number;
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
