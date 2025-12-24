<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/supabase'
import { useQuasar } from 'quasar'

const router = useRouter()
const $q = useQuasar()

const email = ref('')
const password = ref('')
const loading = ref(false)
const isSignUp = ref(false)

async function handleLogin() {
  if (!email.value || !password.value) return
  
  loading.value = true
  try {
    if (isSignUp.value) {
      const { error } = await supabase.auth.signUp({
        email: email.value,
        password: password.value,
      })
      if (error) throw error
      $q.notify({
        type: 'positive',
        message: '회원가입 성공! 로그인해주세요.'
      })
      isSignUp.value = false
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.value,
        password: password.value,
      })
      if (error) throw error
      
      $q.notify({
        type: 'positive',
        message: '로그인 성공'
      })
      router.push('/')
    }
  } catch (err: any) {
    console.error(err)
    $q.notify({
      type: 'negative',
      message: err.message || '오류가 발생했습니다.'
    })
  } finally {
    loading.value = false
  }
}

// Debug Logic
const debugUrl = ref(import.meta.env.VITE_SUPABASE_URL)
const debugKey = ref(import.meta.env.VITE_SUPABASE_ANON_KEY)
const debugError = ref('')

async function testConnection() {
    try {
        debugError.value = 'Testing...'
        const { error } = await supabase.from('tasks').select('count').limit(1)
        if (error) throw error
        debugError.value = 'Connection Success!'
        $q.notify({ type: 'positive', message: 'Connected to Supabase!' })
    } catch (e: any) {
        debugError.value = e.message || JSON.stringify(e)
        $q.notify({ type: 'negative', message: 'Connection Failed' })
    }
}
</script>

<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <q-page class="flex flex-center bg-grey-2">
        <q-card class="q-pa-lg shadow-2" style="width: 400px; max-width: 90vw;">
          <q-card-section class="text-center">
            <div class="text-h5 text-bold text-primary q-mb-md">대한 콜 리마인더</div>
            <div class="text-grey-7">{{ isSignUp ? '새 계정 만들기' : '로그인' }}</div>
          </q-card-section>

          <q-card-section>
            <q-form @submit.prevent="handleLogin" class="q-gutter-md">
              <q-input
                v-model="email"
                label="이메일"
                type="email"
                outlined
                dense
                :rules="[val => !!val || '이메일을 입력해주세요']"
              />
              
              <q-input
                v-model="password"
                label="비밀번호"
                type="password"
                outlined
                dense
                :rules="[val => !!val || '비밀번호를 입력해주세요', val => val.length >= 6 || '6자리 이상 입력해주세요']"
                @keyup.enter="handleLogin"
              />

              <q-btn
                type="submit"
                color="primary"
                class="full-width q-mt-md"
                :label="isSignUp ? '가입하기' : '로그인'"
                :loading="loading"
              />
            </q-form>
          </q-card-section>

          <q-card-section class="text-center q-pt-none">
            <q-btn
              flat
              size="sm"
              color="grey-7"
              :label="isSignUp ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 회원가입'"
              @click="isSignUp = !isSignUp"
            />
          </q-card-section>
          
          <!-- Debug Section -->
          <q-expansion-item label="Debug Info (개발자용)" class="bg-grey-3 text-caption">
            <div class="q-pa-md">
               <div><strong>URL:</strong> {{ debugUrl }}</div>
               <div><strong>Key:</strong> {{ debugKey ? 'Loaded (' + debugKey.length + ' chars)' : 'Missing' }}</div>
               <div v-if="debugError" class="text-negative q-mt-sm">Error: {{ debugError }}</div>
               <q-btn label="Test Connection" size="sm" color="warning" class="full-width q-mt-sm" @click="testConnection" />
            </div>
          </q-expansion-item>

        </q-card>
      </q-page>
    </q-page-container>
  </q-layout>
</template>
