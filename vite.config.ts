import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // IMPORTANT: This must match your repository name exactly.
  // If your repo is https://github.com/user/budget-manager, this should be '/budget-manager/'
  base: '/budget-manager/',
})