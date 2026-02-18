import type { Field, FieldErrors, FieldType } from '@domain/types'
import { NUMBER_MAX_VALUE, STRING_MAX_LENGTH } from '@domain/validate'
import styles from './FieldEditor.module.css'

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
const cx = (...classes: Array<string | false | undefined>): string =>
  classes.filter(Boolean).join(' ')

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
      <section className={cx(styles.card, styles.editorCard)} aria-label="Field editor">
        <header className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Field Editor</h2>
        </header>
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>No field selected</p>
          <p className={styles.emptyCopy}>
            Pick a field from the list or create one to edit it here.
          </p>
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
    <section className={cx(styles.card, styles.editorCard)} aria-label="Field editor">
      <header className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>Field Editor</h2>
      </header>

      <div className={styles.editorContent}>
        <div className={styles.formRow}>
          <label htmlFor={fieldNameInputId} className={styles.inputLabel}>
            Field Name
          </label>
          <input
            id={fieldNameInputId}
            className={cx(styles.textInput, hasFieldNameError && styles.isInvalid)}
            type="text"
            value={field.fieldName}
            onChange={(event) => onFieldNameChange(event.target.value)}
            aria-invalid={hasFieldNameError}
            aria-describedby={hasFieldNameError ? fieldNameErrorId : undefined}
          />
          {hasFieldNameError ? (
            <p className={styles.inputError} id={fieldNameErrorId}>
              {errors.fieldName}
            </p>
          ) : null}
        </div>

        <div className={styles.formRow}>
          <p className={styles.inputLabel}>Type</p>
          <div className={styles.segmentedControl} role="group" aria-label="Field type">
            {typeOptions.map((type) => (
              <button
                key={type}
                type="button"
                className={cx(styles.segment, field.type === type && styles.isActive)}
                aria-pressed={field.type === type}
                onClick={() => onTypeChange(type)}
              >
                {formatType(type)}
              </button>
            ))}
          </div>
        </div>

        {field.type === 'string' ? (
          <div className={styles.formRow}>
            <label htmlFor={valueInputId} className={styles.inputLabel}>
              Value
            </label>
            <input
              id={valueInputId}
              className={cx(styles.textInput, hasValueError && styles.isInvalid)}
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
              className={cx(
                styles.helperText,
                field.value.length > STRING_MAX_LENGTH && styles.isDanger,
              )}
              id={`string-counter-${field.id}`}
            >
              {field.value.length}/{STRING_MAX_LENGTH}
            </p>
            {hasValueError ? (
              <p className={styles.inputError} id={valueErrorId}>
                {errors.value}
              </p>
            ) : null}
          </div>
        ) : null}

        {field.type === 'number' ? (
          <div className={styles.formRow}>
            <label htmlFor={valueInputId} className={styles.inputLabel}>
              Value
            </label>
            <input
              id={valueInputId}
              className={cx(styles.textInput, hasValueError && styles.isInvalid)}
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
            <p className={styles.helperText} id={`number-help-${field.id}`}>
              Max {NUMBER_MAX_VALUE}
            </p>
            {hasValueError ? (
              <p className={styles.inputError} id={valueErrorId}>
                {errors.value}
              </p>
            ) : null}
          </div>
        ) : null}

        {field.type === 'boolean' ? (
          <div className={styles.formRow}>
            <p className={styles.inputLabel}>Value</p>
            <div className={styles.segmentedControl} role="group" aria-label="Boolean value">
              <button
                type="button"
                className={cx(styles.segment, field.value && styles.isActive)}
                aria-pressed={field.value}
                onClick={() => onBooleanValueChange(true)}
              >
                Yes
              </button>
              <button
                type="button"
                className={cx(styles.segment, !field.value && styles.isActive)}
                aria-pressed={!field.value}
                onClick={() => onBooleanValueChange(false)}
              >
                No
              </button>
            </div>
            {hasValueError ? (
              <p className={styles.inputError} id={valueErrorId}>
                {errors.value}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  )
}
