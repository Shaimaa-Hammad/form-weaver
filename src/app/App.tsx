import { useReducer } from 'react'

import { FieldsList } from '@components/FieldsList'
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

        <section className="card">
          <header className="card-header">
            <h2 className="card-title">Selected Field</h2>
          </header>
          <div className="empty-state">
            {selectedField ? (
              <p className="empty-copy">
                {selectedField.fieldName || 'Untitled'} ({selectedField.type})
              </p>
            ) : (
              <p className="empty-copy">Select a field from the list.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
