import type { Field, FieldErrorsById } from '@domain/types'

interface FieldsListProps {
  fields: Field[]
  selectedId?: string
  errorsById: FieldErrorsById
  onAddField: () => void
  onSelectField: (id: string) => void
  onDeleteField: (id: string) => void
}

const formatType = (type: Field['type']): string => type.charAt(0).toUpperCase() + type.slice(1)

export function FieldsList({
  fields,
  selectedId,
  errorsById,
  onAddField,
  onSelectField,
  onDeleteField,
}: FieldsListProps) {
  return (
    <section className="card fields-card" aria-label="Fields list">
      <header className="card-header">
        <div className="card-title-wrap">
          <h2 className="card-title">Fields</h2>
          <span className="count-badge" aria-label={`${fields.length} fields`}>
            {fields.length}
          </span>
        </div>
        <button type="button" className="btn btn-secondary" onClick={onAddField}>
          Add field
        </button>
      </header>

      {fields.length === 0 ? (
        <div className="empty-state" role="status">
          <p className="empty-title">No fields yet</p>
          <p className="empty-copy">Start by adding your first field on the left panel.</p>
        </div>
      ) : (
        <ul className="fields-list">
          {fields.map((field) => {
            const hasErrors = Boolean(errorsById[field.id])
            const displayName = field.fieldName.trim() || 'Untitled'
            const isSelected = selectedId === field.id

            return (
              <li key={field.id} className={`field-row ${isSelected ? 'is-selected' : ''}`}>
                <button
                  type="button"
                  className="field-select-button"
                  aria-current={isSelected ? 'true' : undefined}
                  onClick={() => onSelectField(field.id)}
                >
                  <span className="field-name-wrap">
                    <span className="field-name">{displayName}</span>
                    <span className={`type-pill type-pill-${field.type}`}>
                      {formatType(field.type)}
                    </span>
                  </span>
                  {hasErrors ? (
                    <span className="error-chip" title="This field has validation errors">
                      <span className="error-dot" aria-hidden="true" />
                      Needs attention
                    </span>
                  ) : null}
                </button>

                <div className="field-actions" aria-label={`Actions for ${displayName}`}>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={`Edit ${displayName}`}
                    onClick={() => onSelectField(field.id)}
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    className="icon-button danger"
                    aria-label={`Delete ${displayName}`}
                    onClick={() => onDeleteField(field.id)}
                  >
                    ×
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
