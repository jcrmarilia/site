import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
// npm run build  → gera site/gestao (sistema real) e site/testes (ambiente de testes)
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  base: mode === 'teste' ? '/testes/' : '/gestao/',
  build: { outDir: mode === 'teste' ? '../site/testes' : '../site/gestao', emptyOutDir: false, assetsDir: 'app', chunkSizeWarningLimit: 1200 },
  server: { fs: { allow: ['..'] } }
}));
