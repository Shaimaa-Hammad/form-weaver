import type { Field, FieldErrors, FieldErrorsById } from './types'

export const STRING_MAX_LENGTH = 100
export const NUMBER_MAX_VALUE = 1000

export const hasFieldErrors = (errors: FieldErrors): boolean => Object.keys(errors).length > 0

export const hasValidationErrors = (errorsById: FieldErrorsById): boolean =>
  Object.keys(errorsById).length > 0

export function validateField(field: Field): FieldErrors {
  const errors: FieldErrors = {}

  if (!field.fieldName.trim()) {
    errors.fieldName = 'Field name is required.'
  }

  if (field.type === 'string' && field.value.length > STRING_MAX_LENGTH) {
    errors.value = `String value must be ${STRING_MAX_LENGTH} characters or fewer.`
  }

  if (field.type === 'number') {
    if (!Number.isFinite(field.value)) {
      errors.value = 'Number value must be valid.'
    } else if (field.value > NUMBER_MAX_VALUE) {
      errors.value = `Number value must be ${NUMBER_MAX_VALUE} or less.`
    }
  }

  return errors
}

export function validateAll(fields: Field[]): FieldErrorsById {
  const errorsById: FieldErrorsById = {}

  for (const field of fields) {
    const errors = validateField(field)
    if (hasFieldErrors(errors)) {
      errorsById[field.id] = errors
    }
  }

  return errorsById
}
