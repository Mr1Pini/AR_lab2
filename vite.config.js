import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  base: '/AR_lab2/', 
  plugins: [
    basicSsl()
  ]
});