import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
// npm run build  → gera o painel em site/gestao
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  base: '/gestao/',
  build: { outDir: '../site/gestao', emptyOutDir: false, assetsDir: 'app', chunkSizeWarningLimit: 1200 },
  server: { fs: { allow: ['..'] } }
}));
