import './app/global.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element was not found.')
}

const mountApp = async (): Promise<void> => {
  const [{ StrictMode, createElement }, { createRoot }, { default: App }] = await Promise.all([
    import('react'),
    import('react-dom/client'),
    import('./app/App'),
  ])

  createRoot(rootElement).render(createElement(StrictMode, null, createElement(App)))
}

void mountApp()
