import type { App } from 'vue'
import YYDSSeekChat from './components/Chat.vue'
import { useChatStore } from './stores/chat'
import { useChatSettingsStore } from './stores/chatSettings'

export { YYDSSeekChat, useChatStore, useChatSettingsStore }


export default {
  install: (app: App) => {
    app.component('YYDSSeekChat', YYDSSeekChat)
  }
} 