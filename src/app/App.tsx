import { useReducer } from 'react'

import { FieldEditor } from '@components/FieldEditor'
import { FieldsList } from '@components/FieldsList'
import { JsonPreview } from '@components/JsonPreview'
import { Toast } from '@components/Toast'
import type { FieldType } from '@domain/types'
import { appReducer, initialState } from '@domain/reducer'
import { createFieldByType } from '@domain/types'
import { hasValidationErrors, validateAll } from '@domain/validate'
import { createSchema, updateSchema } from '@services/schemaApi'

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

  const handleSave = async () => {
    const allErrors = validateAll(state.fields)
    if (hasValidationErrors(allErrors)) {
      const firstInvalidId = Object.keys(allErrors)[0]

      if (firstInvalidId) {
        dispatch({ type: 'select_field', payload: { id: firstInvalidId } })
      }

      dispatch({
        type: 'set_toast',
        payload: {
          toast: {
            kind: 'error',
            message: 'Validation failed. Fix field errors before saving.',
          },
        },
      })

      return
    }

    dispatch({ type: 'save_start' })

    try {
      if (!state.schemaId) {
        const response = await createSchema(state.fields)
        dispatch({
          type: 'save_success',
          payload: {
            schemaId: response.id,
            message: 'Schema created successfully via POST.',
          },
        })
        return
      }

      await updateSchema(state.schemaId, state.fields)
      dispatch({
        type: 'save_success',
        payload: {
          schemaId: state.schemaId,
          message: 'Schema updated successfully via PUT.',
        },
      })
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unexpected error happened while saving.'

      dispatch({
        type: 'save_error',
        payload: { message },
      })
    }
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1 className="app-title">Dynamic Form Builder</h1>
        </div>
        <div className="save-mode-card">
          <span className="save-mode-label">Save Mode</span>
          <strong className="save-mode-value">
            {state.schemaId ? 'PUT (update)' : 'POST (create)'}
          </strong>
        </div>
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

        <JsonPreview schemaId={state.schemaId} fields={state.fields} />

        <div className="action-bar" role="region" aria-label="Form actions">
          <p className={`dirty-state ${state.dirty ? 'is-dirty' : ''}`}>
            {state.dirty ? 'Unsaved changes' : 'All changes saved'}
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
            disabled={state.saving || !state.dirty}
            aria-busy={state.saving}
          >
            {state.saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </main>

      <Toast toast={state.toast} onClose={() => dispatch({ type: 'clear_toast' })} />
    </div>
  )
}

export default App
