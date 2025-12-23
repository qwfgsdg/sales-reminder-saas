import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '@/supabase'
import MainLayout from '@/layouts/MainLayout.vue'
import ListPage from '@/pages/ListPage.vue'
import AnalyticsPage from '@/pages/AnalyticsPage.vue'
import CalendarPage from '@/pages/CalendarPage.vue'
import SettingsPage from '@/pages/SettingsPage.vue'
import LoginPage from '@/pages/LoginPage.vue'

const routes = [
    { path: '/login', component: LoginPage },
    {
        path: '/',
        component: MainLayout,
        meta: { requiresAuth: true },
        children: [
            { path: '', component: ListPage }, // Home is now List
            { path: 'analytics', component: AnalyticsPage }, // New Analytics Route
            { path: 'calendar', component: CalendarPage },
            { path: 'settings', component: SettingsPage }
        ]
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach(async (to, from, next) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (to.meta.requiresAuth && !session) {
        next('/login')
    } else if (to.path === '/login' && session) {
        next('/')
    } else {
        next()
    }
})

export default router
