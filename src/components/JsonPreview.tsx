import type { Field } from '@domain/types'

interface JsonPreviewProps {
  schemaId?: string
  fields: Field[]
}

export function JsonPreview({ schemaId, fields }: JsonPreviewProps) {
  const payload = schemaId ? { schemaId, fields } : { fields }

  return (
    <details className="card json-card" open>
      <summary className="json-summary">JSON Preview</summary>
      <pre className="json-output" aria-label="JSON preview">
        {JSON.stringify(payload, null, 2)}
      </pre>
    </details>
  )
}
