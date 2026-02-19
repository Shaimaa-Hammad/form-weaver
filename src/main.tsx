import './app/global.css'
import appStyles from './app/App.module.css'

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
    <div class="${appStyles.appShell}">
      <header class="${appStyles.appHeader}">
        <div>
          <p class="${appStyles.eyebrow}">Dynamic Schema Admin</p>
          <h1 class="${appStyles.appTitle}">Dynamic Form Builder</h1>
        </div>
        <div class="${appStyles.saveModeCard}">
          <span class="${appStyles.saveModeLabel}">Save Mode</span>
          <strong class="${appStyles.saveModeValue}">POST (create)</strong>
          <p class="${appStyles.saveModeMeta}">No schemaId yet</p>
        </div>
      </header>
      <main class="${appStyles.mainLayout}">
        <section class="${appStyles.bootPanel}" role="status" aria-live="polite">
          <h2 class="${appStyles.bootTitle}">Preparing editor</h2>
          <p class="${appStyles.bootCopy}">
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
