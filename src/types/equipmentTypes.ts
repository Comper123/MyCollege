export const fieldTypes = ['string', 'text', 'number', 'date', 'float'] as const;
export type FieldType = typeof fieldTypes[number];


export interface CustomField {
  name: string;
  type: FieldType;
}

export const FieldTypeLabels: Record<FieldType, string> = {
  string: "Короткий текст",
  text: "Длинный текст",
  number: "Число",
  float: "Дробное число",
  date: "Дата"
}