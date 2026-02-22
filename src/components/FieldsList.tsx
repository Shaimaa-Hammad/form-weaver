import type { Field, FieldErrorsById } from '@domain/types'
import styles from './FieldsList.module.css'

interface FieldsListProps {
  fields: Field[]
  selectedId?: string
  errorsById: FieldErrorsById
  onAddField: () => void
  onSelectField: (id: string) => void
  onDeleteField: (id: string) => void
}

const formatType = (type: Field['type']): string => type.charAt(0).toUpperCase() + type.slice(1)

const typePillByType: Record<Field['type'], string> = {
  string: styles.typePillString,
  number: styles.typePillNumber,
  boolean: styles.typePillBoolean,
}

const cx = (...classes: Array<string | false | undefined>): string =>
  classes.filter(Boolean).join(' ')

export function FieldsList({
  fields,
  selectedId,
  errorsById,
  onAddField,
  onSelectField,
  onDeleteField,
}: FieldsListProps) {
  return (
    <section className={cx(styles.card, styles.fieldsCard)} aria-label="Fields list">
      <header className={styles.cardHeader}>
        <div className={styles.cardTitleWrap}>
          <h2 className={styles.cardTitle}>Fields</h2>
          <span className={styles.countBadge} aria-label={`${fields.length} fields`}>
            {fields.length}
          </span>
        </div>
        <button type="button" className={cx(styles.btn, styles.btnSecondary)} onClick={onAddField}>
          Add field
        </button>
      </header>

      {fields.length === 0 ? (
        <div className={styles.emptyState} role="status">
          <p className={styles.emptyTitle}>No fields yet</p>
          <p className={styles.emptyCopy}>Start by adding your first field on the left panel.</p>
        </div>
      ) : (
        <ul className={styles.fieldsList}>
          {fields.map((field) => {
            const hasErrors = Boolean(errorsById[field.id])
            const displayName = field.fieldName.trim() || 'Untitled'
            const isSelected = selectedId === field.id

            return (
              <li key={field.id} className={cx(styles.fieldRow, isSelected && styles.isSelected)}>
                <button
                  type="button"
                  className={styles.fieldSelectButton}
                  aria-current={isSelected ? 'true' : undefined}
                  onClick={() => onSelectField(field.id)}
                >
                  <span className={styles.fieldNameWrap}>
                    <span className={styles.fieldName}>{displayName}</span>
                    <span className={cx(styles.typePill, typePillByType[field.type])}>
                      {formatType(field.type)}
                    </span>
                  </span>
                  {hasErrors ? (
                    <span className={styles.errorChip} title="This field has validation errors">
                      <span className={styles.errorDot} aria-hidden="true" />
                      Needs attention
                    </span>
                  ) : null}
                </button>

                <div className={styles.fieldActions} aria-label={`Actions for ${displayName}`}>
                  <button
                    type="button"
                    className={cx(styles.iconButton, styles.danger)}
                    aria-label={`Delete ${displayName}`}
                    onClick={() => onDeleteField(field.id)}
                  >
                    X
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
