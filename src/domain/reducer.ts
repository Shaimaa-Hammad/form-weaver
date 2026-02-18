import type { AppState, Field, FieldType, ToastMessage } from './types'
import { createFieldByType } from './types'

export type AppAction =
  | { type: 'add_field'; payload: { field: Field } }
  | { type: 'select_field'; payload: { id?: string } }
  | { type: 'delete_field'; payload: { id: string } }
  | { type: 'update_field_name'; payload: { id: string; fieldName: string } }
  | { type: 'change_field_type'; payload: { id: string; fieldType: FieldType } }
  | { type: 'update_string_value'; payload: { id: string; value: string } }
  | { type: 'update_number_value'; payload: { id: string; value: number } }
  | { type: 'update_boolean_value'; payload: { id: string; value: boolean } }
  | { type: 'save_start' }
  | { type: 'save_success'; payload: { schemaId: string; message: string } }
  | { type: 'save_error'; payload: { message: string } }
  | { type: 'set_toast'; payload: { toast: ToastMessage } }
  | { type: 'clear_toast' }

export const initialState: AppState = {
  schemaId: undefined,
  fields: [],
  selectedId: undefined,
  dirty: false,
  saving: false,
  toast: undefined,
}

const replaceField = (fields: Field[], id: string, updater: (field: Field) => Field): Field[] =>
  fields.map((field) => (field.id === id ? updater(field) : field))

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'add_field': {
      const nextField = action.payload.field
      return {
        ...state,
        fields: [...state.fields, nextField],
        selectedId: nextField.id,
        dirty: true,
      }
    }

    case 'select_field': {
      return {
        ...state,
        selectedId: action.payload.id,
      }
    }

    case 'delete_field': {
      const { id } = action.payload
      const nextFields = state.fields.filter((field) => field.id !== id)
      const nextSelectedId = state.selectedId === id ? nextFields[0]?.id : state.selectedId

      return {
        ...state,
        fields: nextFields,
        selectedId: nextSelectedId,
        dirty: true,
      }
    }

    case 'update_field_name': {
      const { id, fieldName } = action.payload
      return {
        ...state,
        fields: replaceField(state.fields, id, (field) => ({
          ...field,
          fieldName,
        })),
        dirty: true,
      }
    }

    case 'change_field_type': {
      const { id, fieldType } = action.payload
      return {
        ...state,
        fields: replaceField(state.fields, id, (field) =>
          createFieldByType(fieldType, field.id, field.fieldName),
        ),
        dirty: true,
      }
    }

    case 'update_string_value': {
      const { id, value } = action.payload
      return {
        ...state,
        fields: replaceField(state.fields, id, (field) =>
          field.type === 'string' ? { ...field, value } : field,
        ),
        dirty: true,
      }
    }

    case 'update_number_value': {
      const { id, value } = action.payload
      return {
        ...state,
        fields: replaceField(state.fields, id, (field) =>
          field.type === 'number' ? { ...field, value } : field,
        ),
        dirty: true,
      }
    }

    case 'update_boolean_value': {
      const { id, value } = action.payload
      return {
        ...state,
        fields: replaceField(state.fields, id, (field) =>
          field.type === 'boolean' ? { ...field, value } : field,
        ),
        dirty: true,
      }
    }

    case 'save_start': {
      return {
        ...state,
        saving: true,
      }
    }

    case 'save_success': {
      return {
        ...state,
        saving: false,
        dirty: false,
        schemaId: action.payload.schemaId,
        toast: { kind: 'success', message: action.payload.message },
      }
    }

    case 'save_error': {
      return {
        ...state,
        saving: false,
        toast: { kind: 'error', message: action.payload.message },
      }
    }

    case 'set_toast': {
      return {
        ...state,
        toast: action.payload.toast,
      }
    }

    case 'clear_toast': {
      return {
        ...state,
        toast: undefined,
      }
    }

    default:
      return state
  }
}
