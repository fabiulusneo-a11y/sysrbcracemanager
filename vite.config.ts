
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 2000, // Aumenta o limite para 2MB para acomodar bibliotecas de exportação de Excel
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-utils': ['lucide-react', 'xlsx', 'exceljs'],
        },
      },
    },
  },
});
