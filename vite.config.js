import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // PORT do công cụ preview cấp (khi 5173 đang bận), mặc định 5173
    port: Number(process.env.PORT) || 5173,
    // /api -> API tiến độ chạy riêng (node server/index.js), giống cách IIS
    // chuyển tiếp trên VPS nên trang web luôn gọi cùng địa chỉ với chính nó
    proxy: {
      '/api': process.env.API_URL || 'http://localhost:37390',
    },
  },
})
