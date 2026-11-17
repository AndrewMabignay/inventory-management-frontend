import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router/index.js'
import { AUTH_SESSION_EXPIRED_EVENT } from './services/auth-session.js'
import { useAuthStore } from './stores/auth.js'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

const authStore = useAuthStore(pinia)

window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, () => {
  authStore.clearSession()

  if (router.currentRoute.value.name !== 'login') {
    void router.replace({ name: 'login' })
  }
})

app.use(router)
app.mount('#app')
