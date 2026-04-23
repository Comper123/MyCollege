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


export interface EquipmentTypeForm {
  name?: string;
  description?: string;
  fields?: CustomField[]
}

export const emptyEquiupmentTypeForm = {
  name: '',
  description: '',
  fields: [{name: "", type: "string"} as CustomField]
}