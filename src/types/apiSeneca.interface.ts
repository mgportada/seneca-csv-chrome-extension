export interface Criteria {
  id: string;
  name: string;
}

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
