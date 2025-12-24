import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/supabase'
import type { User } from '@supabase/supabase-js'

export interface UserProfile {
    id: string
    email: string
    role: 'admin' | 'user'
    is_approved: boolean
    created_at: string
}

export const useAuthStore = defineStore('auth', () => {
    const user = ref<User | null>(null)
    const profile = ref<UserProfile | null>(null)
    const loading = ref(false)

    const isAuthenticated = computed(() => !!user.value)
    const isAdmin = computed(() => profile.value?.role === 'admin')
    const isApproved = computed(() => profile.value?.is_approved === true)

    async function fetchProfile() {
        loading.value = true
        try {
            // 1. Get Session User
            const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

            if (authError || !authUser) {
                user.value = null
                profile.value = null
                return
            }

            user.value = authUser

            // 2. Get Profile from DB
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authUser.id)
                .single()

            if (error) {
                console.error('Error fetching profile:', error)
                // If profile doesn't exist (shouldn't happen due to trigger), handle gracefully
            }

            if (data) {
                profile.value = data as UserProfile
            }

        } catch (e) {
            console.error('Auth Store Error:', e)
        } finally {
            loading.value = false
        }
    }

    // Initial fetch
    fetchProfile()

    // Listen to Auth State Changes (Login/Logout)
    supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN') {
            user.value = session?.user || null
            fetchProfile()
        } else if (event === 'SIGNED_OUT') {
            user.value = null
            profile.value = null
        }
    })

    return {
        user,
        profile,
        loading,
        isAuthenticated,
        isAdmin,
        isApproved,
        fetchProfile
    }
})
