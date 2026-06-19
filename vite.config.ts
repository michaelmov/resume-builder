/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/resume-builder/',
  server: {},
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
