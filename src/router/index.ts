import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '@/supabase'
import { useAuthStore } from '@/stores/authStore'
import MainLayout from '@/layouts/MainLayout.vue'
import ListPage from '@/pages/ListPage.vue'
import AnalyticsPage from '@/pages/AnalyticsPage.vue'
import CalendarPage from '@/pages/CalendarPage.vue'
import SettingsPage from '@/pages/SettingsPage.vue'
import LoginPage from '@/pages/LoginPage.vue'
import PendingPage from '@/pages/PendingPage.vue'
import AdminPage from '@/pages/AdminPage.vue'

const routes = [
    { path: '/login', component: LoginPage },
    { path: '/pending', component: PendingPage },
    {
        path: '/',
        component: MainLayout,
        meta: { requiresAuth: true },
        children: [
            { path: '', component: ListPage },
            { path: 'analytics', component: AnalyticsPage },
            { path: 'calendar', component: CalendarPage },
            { path: 'settings', component: SettingsPage },
            {
                path: 'admin',
                component: AdminPage,
                meta: { requiresAdmin: true }
            }
        ]
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach(async (to, _, next) => {
    const authStore = useAuthStore()
    const { data: { session } } = await supabase.auth.getSession()

    // 1. Handle Login Redirects
    if (to.meta.requiresAuth && !session) {
        return next('/login')
    }
    if (to.path === '/login' && session) {
        return next('/')
    }

    // 2. Profile Check (Gatekeeper)
    if (session) {
        // Ensure profile is loaded
        if (!authStore.profile) {
            await authStore.fetchProfile()
        }

        const isApproved = authStore.isApproved
        const isAdmin = authStore.isAdmin

        // A. Unapproved Users -> Pending Jail
        if (!isApproved && to.path !== '/pending') {
            return next('/pending')
        }

        // B. Approved Users -> No Pending Jail
        if (isApproved && to.path === '/pending') {
            return next('/')
        }

        // C. Admin Route Protection
        if (to.meta.requiresAdmin && !isAdmin) {
            return next('/')
        }
    }

    next()
})

export default router
