import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    // port: 5173, // optional but recommended
    // Allow tunneling domains (e.g., ngrok) while keeping strict file serving
    allowedHosts: ['warner-evolutionary-supertragically.ngrok-free.dev'],
    fs: {
      strict: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
