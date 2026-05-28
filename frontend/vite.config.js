import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('firebase')) return 'vendor-firebase';
          if (id.includes('gsap')) return 'vendor-gsap';
          return undefined;
        },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.DEV_PROXY_TARGET || 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
