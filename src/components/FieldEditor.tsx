import type { Field, FieldErrors, FieldType } from '@domain/types'
import { NUMBER_MAX_VALUE, STRING_MAX_LENGTH } from '@domain/validate'

interface FieldEditorProps {
  field?: Field
  errors?: FieldErrors
  onFieldNameChange: (value: string) => void
  onTypeChange: (type: FieldType) => void
  onStringValueChange: (value: string) => void
  onNumberValueChange: (value: number) => void
  onBooleanValueChange: (value: boolean) => void
}

const typeOptions: FieldType[] = ['string', 'number', 'boolean']

const formatType = (type: FieldType): string => type.charAt(0).toUpperCase() + type.slice(1)

export function FieldEditor({
  field,
  errors = {},
  onFieldNameChange,
  onTypeChange,
  onStringValueChange,
  onNumberValueChange,
  onBooleanValueChange,
}: FieldEditorProps) {
  if (!field) {
    return (
      <section className="card editor-card" aria-label="Field editor">
        <header className="card-header">
          <h2 className="card-title">Field Editor</h2>
        </header>
        <div className="empty-state">
          <p className="empty-title">No field selected</p>
          <p className="empty-copy">Pick a field from the list or create one to edit it here.</p>
        </div>
      </section>
    )
  }

  const fieldNameInputId = `field-name-${field.id}`
  const fieldNameErrorId = `field-name-error-${field.id}`
  const valueInputId = `field-value-${field.id}`
  const valueErrorId = `field-value-error-${field.id}`

  const hasFieldNameError = Boolean(errors.fieldName)
  const hasValueError = Boolean(errors.value)

  return (
    <section className="card editor-card" aria-label="Field editor">
      <header className="card-header">
        <h2 className="card-title">Field Editor</h2>
      </header>

      <div className="editor-content">
        <div className="form-row">
          <label htmlFor={fieldNameInputId} className="input-label">
            Field Name
          </label>
          <input
            id={fieldNameInputId}
            className={`text-input ${hasFieldNameError ? 'is-invalid' : ''}`}
            type="text"
            value={field.fieldName}
            onChange={(event) => onFieldNameChange(event.target.value)}
            aria-invalid={hasFieldNameError}
            aria-describedby={hasFieldNameError ? fieldNameErrorId : undefined}
          />
          {hasFieldNameError ? (
            <p className="input-error" id={fieldNameErrorId}>
              {errors.fieldName}
            </p>
          ) : null}
        </div>

        <div className="form-row">
          <p className="input-label">Type</p>
          <div className="segmented-control" role="group" aria-label="Field type">
            {typeOptions.map((type) => (
              <button
                key={type}
                type="button"
                className={`segment ${field.type === type ? 'is-active' : ''}`}
                aria-pressed={field.type === type}
                onClick={() => onTypeChange(type)}
              >
                {formatType(type)}
              </button>
            ))}
          </div>
        </div>

        {field.type === 'string' ? (
          <div className="form-row">
            <label htmlFor={valueInputId} className="input-label">
              Value
            </label>
            <input
              id={valueInputId}
              className={`text-input ${hasValueError ? 'is-invalid' : ''}`}
              type="text"
              value={field.value}
              onChange={(event) => onStringValueChange(event.target.value)}
              aria-invalid={hasValueError}
              aria-describedby={
                hasValueError
                  ? `string-counter-${field.id} ${valueErrorId}`
                  : `string-counter-${field.id}`
              }
            />
            <p
              className={`helper-text ${field.value.length > STRING_MAX_LENGTH ? 'is-danger' : ''}`}
              id={`string-counter-${field.id}`}
            >
              {field.value.length}/{STRING_MAX_LENGTH}
            </p>
            {hasValueError ? (
              <p className="input-error" id={valueErrorId}>
                {errors.value}
              </p>
            ) : null}
          </div>
        ) : null}

        {field.type === 'number' ? (
          <div className="form-row">
            <label htmlFor={valueInputId} className="input-label">
              Value
            </label>
            <input
              id={valueInputId}
              className={`text-input ${hasValueError ? 'is-invalid' : ''}`}
              type="number"
              value={field.value}
              onChange={(event) => {
                const nextValue = Number(event.target.value)
                if (!Number.isNaN(nextValue)) {
                  onNumberValueChange(nextValue)
                }
              }}
              aria-invalid={hasValueError}
              aria-describedby={
                hasValueError
                  ? `number-help-${field.id} ${valueErrorId}`
                  : `number-help-${field.id}`
              }
            />
            <p className="helper-text" id={`number-help-${field.id}`}>
              Max {NUMBER_MAX_VALUE}
            </p>
            {hasValueError ? (
              <p className="input-error" id={valueErrorId}>
                {errors.value}
              </p>
            ) : null}
          </div>
        ) : null}

        {field.type === 'boolean' ? (
          <div className="form-row">
            <p className="input-label">Value</p>
            <div className="segmented-control" role="group" aria-label="Boolean value">
              <button
                type="button"
                className={`segment ${field.value ? 'is-active' : ''}`}
                aria-pressed={field.value}
                onClick={() => onBooleanValueChange(true)}
              >
                Yes
              </button>
              <button
                type="button"
                className={`segment ${!field.value ? 'is-active' : ''}`}
                aria-pressed={!field.value}
                onClick={() => onBooleanValueChange(false)}
              >
                No
              </button>
            </div>
            {hasValueError ? (
              <p className="input-error" id={valueErrorId}>
                {errors.value}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  )
}
