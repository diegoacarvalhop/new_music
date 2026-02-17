import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  css: {
    preprocessorOptions: {
      scss: { silenceDeprecations: ['legacy-js-api'] },
      sass: { silenceDeprecations: ['legacy-js-api'] },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) return 'react-vendor'
          if (id.includes('node_modules/react-router')) return 'router'
          if (id.includes('node_modules/axios')) return 'axios'
          if (id.includes('html2canvas') || id.includes('jspdf')) return 'pdf-report'
        },
      },
    },
    chunkSizeWarningLimit: 650,
  },
  server: {
    port: 5173,
    host: true, // escuta em 0.0.0.0 para acessar pelo celular na rede (ex: http://SEU_IP:5173)
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
})
