import { createApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'
import ui from '@nuxt/ui/vue-plugin'
import './style/style.css'

const pinia = createPinia()

const app = createApp(App)
app.use(pinia)
app.use(ui)
app.mount('#app')
