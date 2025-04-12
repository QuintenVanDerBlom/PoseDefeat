import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
/** @type {import('vite').UserConfig} */

// https://vite.dev/config/
export default defineConfig({
  base: "",

  plugins: [react()],

  build: {
    outDir: 'docs',
    emptyOutDir: true, // empty the build dir before new build
  }
});
