import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // ảnh minh họa từ (src/assets/topics, src/assets/words) luôn là file riêng,
    // không nhúng base64 vào JS — có hàng nghìn ảnh, chỉ tải ảnh của từ đang xem
    assetsInlineLimit: (file) => (/[\\/]assets[\\/](topics|words)[\\/]/.test(file) ? false : undefined),
    rollupOptions: {
      output: {
        // ảnh .webp nằm ở assets/img/: lần đầu đưa lên VPS, IIS chưa có MIME .webp nên trả 404
        // kèm Cache-Control 1 năm — đổi đường dẫn để trình duyệt nào đã nhớ lỗi đó cũng tải lại
        assetFileNames: (info) =>
          /\.webp$/i.test(info.names?.[0] ?? info.name ?? '') ? 'assets/img/[name]-[hash][extname]' : 'assets/[name]-[hash][extname]',
      },
    },
  },
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
