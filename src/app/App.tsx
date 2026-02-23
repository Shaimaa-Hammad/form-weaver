import { useReducer } from 'react'

import { FieldEditor, FieldsList, JsonPreview, Toast } from '@components'
import {
  appReducer,
  createFieldByType,
  hasValidationErrors,
  initialState,
  validateAll,
  type FieldType,
} from '@domain'
import { createSchema, updateSchema } from '@services'
import styles from './App.module.css'

const cx = (...classes: Array<string | false | undefined>): string =>
  classes.filter(Boolean).join(' ')

function App() {
  const [state, dispatch] = useReducer(appReducer, initialState)

  const selectedField = state.fields.find((field) => field.id === state.selectedId)
  const errorsById = validateAll(state.fields)
  const selectedErrors = selectedField ? (errorsById[selectedField.id] ?? {}) : {}

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
        error instanceof Error ? error.message : 'Unexpected error happened while saving.'

      dispatch({
        type: 'save_error',
        payload: { message },
      })
    }
  }

  return (
    <div className={styles.appShell}>
      <header className={styles.appHeader}>
        <div>
          <p className={styles.eyebrow}>Dynamic Schema Admin</p>
          <h1 className={styles.appTitle}>Dynamic Form Builder</h1>
        </div>
        <div className={styles.saveModeCard}>
          <span className={styles.saveModeLabel}>Save Mode</span>
          <strong className={styles.saveModeValue}>
            {state.schemaId ? 'PUT (update)' : 'POST (create)'}
          </strong>
          <p className={styles.saveModeMeta}>
            {state.schemaId ? `Schema ID: ${state.schemaId}` : 'No schemaId yet'}
          </p>
        </div>
      </header>

      <main className={styles.mainLayout}>
        <section className={styles.panelGrid}>
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
            errors={selectedErrors}
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
        </section>

        <JsonPreview schemaId={state.schemaId} fields={state.fields} />

        <div className={styles.actionBar} role="region" aria-label="Form actions">
          <p className={cx(styles.dirtyState, state.dirty && styles.isDirty)}>
            {state.dirty ? 'Unsaved changes' : 'All changes saved'}
          </p>
          <button
            type="button"
            className={cx(styles.btn, styles.btnPrimary)}
            onClick={handleSave}
            disabled={state.saving || !state.dirty}
            aria-busy={state.saving}
          >
            {state.saving ? <span className={styles.spinner} aria-hidden="true" /> : null}
            {state.saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </main>

      <Toast toast={state.toast} onClose={() => dispatch({ type: 'clear_toast' })} />
    </div>
  )
}

export default App
