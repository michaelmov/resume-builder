import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '^/api/exportPDF': {
        target:
          'http://localhost:5001/resume-builder-dev-e1417/us-central1/exportPDF',
        changeOrigin: true,
      },
    },
  },
});
