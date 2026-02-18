export type FieldType = 'string' | 'number' | 'boolean'

interface FieldBase {
  id: string
  fieldName: string
}

export interface StringField extends FieldBase {
  type: 'string'
  value: string
}

export interface NumberField extends FieldBase {
  type: 'number'
  value: number
}

export interface BooleanField extends FieldBase {
  type: 'boolean'
  value: boolean
}

export type Field = StringField | NumberField | BooleanField

export interface FieldErrors {
  fieldName?: string
  value?: string
}

export type FieldErrorsById = Record<string, FieldErrors>

export interface ToastMessage {
  kind: 'success' | 'error'
  message: string
}

export interface AppState {
  schemaId?: string
  fields: Field[]
  selectedId?: string
  dirty: boolean
  saving: boolean
  toast?: ToastMessage
}

export const createFieldByType = (
  type: FieldType,
  id: string = crypto.randomUUID(),
  fieldName = '',
): Field => {
  switch (type) {
    case 'string':
      return { id, fieldName, type: 'string', value: '' }
    case 'number':
      return { id, fieldName, type: 'number', value: 0 }
    case 'boolean':
      return { id, fieldName, type: 'boolean', value: false }
  }
}
