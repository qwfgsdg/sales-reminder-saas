import { createApp } from 'vue'
import { Quasar, Notify, Dialog, Loading } from 'quasar'
import { createPinia } from 'pinia'
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'

// Import Quasar css
import '@quasar/extras/material-icons/material-icons.css'
import '@quasar/extras/fontawesome-v6/fontawesome-v6.css'
import 'quasar/src/css/index.sass'

// Assumes App.vue exists
import App from './App.vue'

const app = createApp(App)

// 1. State Management
const pinia = createPinia()
app.use(pinia)

// 2. Data Sync Engine
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 3,
            staleTime: 1000 * 60 * 5, // 5 minutes
        },
    },
})
app.use(VueQueryPlugin, { queryClient })

import router from './router'
app.use(router)

// 3. UI Framework
app.use(Quasar, {
    plugins: {
        Notify,
        Dialog,
        Loading
    },
})

app.mount('#app')
