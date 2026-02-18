import type { Field } from '@domain/types'

const schemaStore = new Map<string, Field[]>()
const NETWORK_DELAY_MS = 700

const cloneFields = (fields: Field[]): Field[] => fields.map((field) => ({ ...field }))

const withDelay = <T>(operation: () => T): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(operation())
      } catch (error) {
        reject(error)
      }
    }, NETWORK_DELAY_MS)
  })

export interface CreateSchemaResponse {
  id: string
}

export function createSchema(fields: Field[]): Promise<CreateSchemaResponse> {
  return withDelay(() => {
    const id = crypto.randomUUID()
    schemaStore.set(id, cloneFields(fields))
    return { id }
  })
}

export function updateSchema(schemaId: string, fields: Field[]): Promise<void> {
  return withDelay(() => {
    if (!schemaStore.has(schemaId)) {
      throw new Error('Schema was not found. Create it first.')
    }

    schemaStore.set(schemaId, cloneFields(fields))
  })
}
