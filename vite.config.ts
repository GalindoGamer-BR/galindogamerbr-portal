import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    allowedHosts: ["portal"],
    strictPort: true,
    // O navegador abre o Vite (HMR confiável em :5173). Só as chamadas de
    // API vão para o Wrangler Pages em :8788, que executa as Functions e
    // usa os bindings locais de D1/KV. Isso evita depender de --proxy do
    // Wrangler, cujo repasse do WebSocket de HMR é instável.
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8788',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Navegadores usados hoje já suportam ES2020 nativo — target mais baixo
    // só adiciona polyfill/transpilação que ninguém precisa.
    target: 'es2020',
    rollupOptions: {
      output: {
        // React/react-dom/react-router-dom mudam bem menos que o código da
        // app — separar num chunk próprio deixa o cache do navegador
        // desse vendor bundle sobreviver a deploys que só mexem na app.
        manualChunks(id) {
          if (/[\\/]node_modules[\\/](react|react-dom|react-router-dom)[\\/]/.test(id)) {
            return 'vendor'
          }
        },
      },
    },
  },
})
