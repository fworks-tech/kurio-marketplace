import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import svgr from 'vite-plugin-svgr'

export default defineConfig(({ mode }) => ({
  plugins: [
    svgr({ svgrOptions: { icon: true } }),
    tanstackRouter({
      routesDirectory: './src/app/routes',
      generatedRouteTree: './src/app/routeTree.gen.ts'
    }),
    react(),
    tailwindcss()
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    // Mapas de origem no bundle publicado: rastreabilidade de erro em produção e
    // auditoria de best practices do Lighthouse sem expor o código-fonte ao cliente.
    sourcemap: true
  },
  define: {
    'process.env.MOCK_MODE': JSON.stringify(
      mode === 'mock' ? 'true' : (process.env.MOCK_MODE ?? 'false')
    ),
    'process.env.API_BASE_URL': JSON.stringify(process.env.API_BASE_URL ?? '/api')
  }
}))
