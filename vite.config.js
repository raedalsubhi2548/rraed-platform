import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// Deployed on Vercel at the domain root; deep links are rewritten to index.html (vercel.json)
export default defineConfig(({ isSsrBuild }) => ({
  plugins: [react(), tailwindcss()],
  base: '/',
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: {
    rolldownOptions: {
      output: {
        // React and the router in one long-cached file. Supabase loads on demand (src/lib/api.js)
        ...(isSsrBuild ? {} : { codeSplitting: { groups: [{ name: 'react', test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/ }] } }),
      },
    },
  },
}))
