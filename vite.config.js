import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // PORT do công cụ preview cấp (khi 5173 đang bận), mặc định 5173
    port: Number(process.env.PORT) || 5173,
  },
})
