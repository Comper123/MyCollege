export type FieldType = 'string' | 'text' | 'number' | 'date' | 'float';

export interface CustomField {
  type: FieldType;
}

export const FieldTypeLabels: Record<FieldType, string> = {
  string: "Короткий текст",
  text: "Длинный текст",
  number: "Число",
  float: "Дробное число",
  date: "Дата"
}