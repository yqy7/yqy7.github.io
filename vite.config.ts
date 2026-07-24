import path from 'node:path'
import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'


// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // pinyin 的 browser 字段指向 UMD，强制用 ESM
      pinyin: path.resolve(__dirname, './node_modules/pinyin/lib/esm/pinyin.js'),
      // xmorse 的 browser 字段指向 UMD，强制用 ESM
      xmorse: path.resolve(__dirname, './node_modules/xmorse/esm/index.js'),
    },
  },
})
