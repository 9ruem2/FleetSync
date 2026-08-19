import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Netlify Dev (yarn dev) 환경에서는 Netlify Functions (/api/*)가 8888 포트에서 가로채므로
    // 별도 localhost:4000 프록시 설정 없이 /api 로 바로 통신하거나 8888을 바라봅니다.
    proxy: {
      '/api': {
        target: 'http://localhost:8888',
        changeOrigin: true,
      },
    },
  },
});
