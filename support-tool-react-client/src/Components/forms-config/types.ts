/** A single entry of `result.formConfigurations` from /formsConfig/v2/list. */
export interface FormConfig {
  id: number | string;
  name: string;
  type: string;
  subType: string;
  portal: string;
  clientVersion: number | string;
}

/** `result` of /formsConfig/v2/admin/read/{id} — the list record plus its config blob. */
export interface FormConfigDetail {
  /** The configuration payload itself. */
  data: any;
  /** Targeting rules, e.g. { role: "VOLUNTEER", rootOrg: "*" }. */
  criteria: Record<string, any> | null;
  name: string;
  type: string;
  subType: string;
  portal: string;
  clientVersion: number | string;
}

export interface FormConfigRow extends FormConfig {
  /** Stable React key for the table. */
  rowKey: string;
  /** Lowercased concatenation of every field, used for local search. */
  searchIndex: string;
  /** The untouched record, handed to the JSON viewer / clipboard. */
  raw: any;
}
