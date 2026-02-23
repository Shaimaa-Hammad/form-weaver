import './app/bootstrap.css'
import './app/global.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element was not found.')
}

let hasMounted = false

const mountApp = async (): Promise<void> => {
  if (hasMounted) {
    return
  }
  hasMounted = true

  const [{ StrictMode, createElement }, { createRoot }, { default: App }] = await Promise.all([
    import('react'),
    import('react-dom/client'),
    import('./app/App'),
  ])

  rootElement.innerHTML = ''
  createRoot(rootElement).render(createElement(StrictMode, null, createElement(App)))
}

const renderBootstrap = (): void => {
  rootElement.innerHTML = `
    <div class="fw-boot-shell">
      <header class="fw-boot-header">
        <div>
          <p class="fw-boot-eyebrow">Dynamic Schema Admin</p>
          <h1 class="fw-boot-title">Dynamic Form Builder</h1>
        </div>
        <div class="fw-boot-save-card">
          <span class="fw-boot-save-label">Save Mode</span>
          <strong class="fw-boot-save-value">POST (create)</strong>
          <p class="fw-boot-save-meta">No schemaId yet</p>
        </div>
      </header>
      <main class="fw-boot-main">
        <section class="fw-boot-panel" role="status" aria-live="polite">
          <h2 class="fw-boot-panel-title">Preparing editor</h2>
          <p class="fw-boot-panel-copy">
            Loading the full editor...
          </p>
        </section>
      </main>
    </div>
  `
}

const scheduleAutoMount = (): void => {
  // Render lightweight UI first, then mount the app shortly after first paint.
  window.requestAnimationFrame(() => {
    window.setTimeout(() => {
      void mountApp()
    }, 700)
  })
}

renderBootstrap()
scheduleAutoMount()
