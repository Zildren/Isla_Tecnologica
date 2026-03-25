import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ✅ Configuración inteligente para Local y Railway
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        // En local usa el puerto 8080, en Railway usa la URL interna o relativa
        target: process.env.NODE_ENV === 'development' 
          ? 'http://localhost:8080' 
          : 'http://localhost:8080', // Railway maneja esto internamente si están en el mismo entorno
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'dist', // Vite usa 'dist' por defecto, asegúrate de que Railway lo sepa
  }
})