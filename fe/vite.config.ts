import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { tanstackRouter } from "@tanstack/router-plugin/vite"

export default defineConfig({
  plugins: [
    tanstackRouter({
      autoCodeSplitting: true, // Recommended for file-based routing
    }),
    react(),
  ],
})
