import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: true,
    watch: {
      // Ignora o banco de dados do Deno para o Vite não reiniciar a página
      ignored: ['**/relatorio_clima.json', '**/historico_clima.json', '**/lote_state.json']
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})