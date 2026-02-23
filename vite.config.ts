import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: 'react', replacement: 'preact/compat' },
      { find: 'react-dom/client', replacement: 'preact/compat/client' },
      { find: 'react-dom', replacement: 'preact/compat' },
      { find: 'react/jsx-runtime', replacement: 'preact/jsx-runtime' },
      { find: 'react/jsx-dev-runtime', replacement: 'preact/jsx-dev-runtime' },
      { find: /^@app$/, replacement: path.resolve(__dirname, './src/app/index.ts') },
      {
        find: /^@components$/,
        replacement: path.resolve(__dirname, './src/components/index.ts'),
      },
      { find: /^@domain$/, replacement: path.resolve(__dirname, './src/domain/index.ts') },
      { find: /^@services$/, replacement: path.resolve(__dirname, './src/services/index.ts') },
      { find: '@app', replacement: path.resolve(__dirname, './src/app') },
      { find: '@components', replacement: path.resolve(__dirname, './src/components') },
      { find: '@domain', replacement: path.resolve(__dirname, './src/domain') },
      { find: '@services', replacement: path.resolve(__dirname, './src/services') },
      { find: '@', replacement: path.resolve(__dirname, './src') },
    ],
  },
})
