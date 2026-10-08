import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    allowedHosts: ["portal"],
    strictPort: true,
    // O backend roda fora do Pages (K3s). Em desenvolvimento, as rotas de backend vao para o gateway
    // local do compose (Traefik) ou para outra origem definida em VITE_API_PROXY.
    proxy: Object.fromEntries(
      ['/api', '/oauth', '/webhooks', '/discord'].map((prefix) => [
        prefix,
        { target: process.env.VITE_API_PROXY ?? 'http://127.0.0.1:8080', changeOrigin: true },
      ]),
    ),
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
