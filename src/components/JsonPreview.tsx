import type { Field } from '@domain/types'
import styles from './JsonPreview.module.css'

interface JsonPreviewProps {
  schemaId?: string
  fields: Field[]
}

export function JsonPreview({ schemaId, fields }: JsonPreviewProps) {
  const payload = schemaId ? { schemaId, fields } : { fields }

  return (
    <details className={`${styles.card} ${styles.jsonCard}`} open>
      <summary className={styles.jsonSummary}>JSON Preview</summary>
      <pre className={styles.jsonOutput} aria-label="JSON preview">
        {JSON.stringify(payload, null, 2)}
      </pre>
    </details>
  )
}
