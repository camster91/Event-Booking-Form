import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    emptyDirOnBuild: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        thank_you: resolve(__dirname, 'thank_you.html')
      }
    }
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3000'
    }
  }
});
