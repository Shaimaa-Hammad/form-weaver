import { useReducer } from 'react'

import { FieldEditor } from '@components/FieldEditor'
import { FieldsList } from '@components/FieldsList'
import type { FieldType } from '@domain/types'
import { appReducer, initialState } from '@domain/reducer'
import { createFieldByType } from '@domain/types'
import { validateAll } from '@domain/validate'

function App() {
  const [state, dispatch] = useReducer(appReducer, initialState)

  const errorsById = validateAll(state.fields)
  const selectedField = state.fields.find((field) => field.id === state.selectedId)

  const handleAddField = () => {
    dispatch({
      type: 'add_field',
      payload: { field: createFieldByType('string') },
    })
  }

  const handleDeleteField = (id: string) => {
    dispatch({ type: 'delete_field', payload: { id } })
  }

  const handleTypeChange = (fieldType: FieldType) => {
    if (!selectedField) {
      return
    }

    dispatch({
      type: 'change_field_type',
      payload: { id: selectedField.id, fieldType },
    })
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1 className="app-title">Dynamic Form Builder</h1>
      </header>

      <main className="main-layout">
        <FieldsList
          fields={state.fields}
          selectedId={state.selectedId}
          errorsById={errorsById}
          onAddField={handleAddField}
          onSelectField={(id) => dispatch({ type: 'select_field', payload: { id } })}
          onDeleteField={handleDeleteField}
        />

        <FieldEditor
          field={selectedField}
          errors={selectedField ? errorsById[selectedField.id] ?? {} : {}}
          onFieldNameChange={(value) => {
            if (!selectedField) {
              return
            }
            dispatch({
              type: 'update_field_name',
              payload: { id: selectedField.id, fieldName: value },
            })
          }}
          onTypeChange={handleTypeChange}
          onStringValueChange={(value) => {
            if (!selectedField || selectedField.type !== 'string') {
              return
            }
            dispatch({
              type: 'update_string_value',
              payload: { id: selectedField.id, value },
            })
          }}
          onNumberValueChange={(value) => {
            if (!selectedField || selectedField.type !== 'number') {
              return
            }
            dispatch({
              type: 'update_number_value',
              payload: { id: selectedField.id, value },
            })
          }}
          onBooleanValueChange={(value) => {
            if (!selectedField || selectedField.type !== 'boolean') {
              return
            }
            dispatch({
              type: 'update_boolean_value',
              payload: { id: selectedField.id, value },
            })
          }}
        />
      </main>
    </div>
  )
}

export default App
