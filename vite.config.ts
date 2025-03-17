import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import tailwindcss from '@tailwindcss/vite'
import ui from '@nuxt/ui/vite'
export default defineConfig({
  plugins: [vue(), tailwindcss(), ui()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'YYDSSeekChat',
      fileName: (format) => `yydsseek-chat.${format}.js`
    },
    rollupOptions: {
      external: ['vue', 'openai', '@nuxt/ui', 'vue-i18n'],
      output: {
        globals: {
          vue: 'Vue',
          openai: 'OpenAI',
          '@nuxt/ui': 'NuxtUI',
          'vue-i18n': 'VueI18n'
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
}) 