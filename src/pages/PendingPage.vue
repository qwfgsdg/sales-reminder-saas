<script setup lang="ts">
import { useRouter } from 'vue-router'
import { supabase } from '@/supabase'
import { useQuasar } from 'quasar'

const router = useRouter()
const $q = useQuasar()

async function handleLogout() {
  await supabase.auth.signOut()
  $q.notify({ type: 'info', message: '로그아웃 되었습니다.' })
  router.push('/login')
}
</script>

<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <q-page class="flex flex-center bg-grey-2 column">
        <div class="text-h4 text-primary q-mb-md text-bold">🚧 승인 대기 중</div>
        <p class="text-body1 text-grey-8 q-mb-lg text-center" style="max-width: 400px;">
          회원가입이 완료되었습니다.<br/>
          현재 <strong>관리자 승인 대기 중</strong>입니다.<br/>
          승인이 완료되면 서비스를 이용하실 수 있습니다.
        </p>

        <q-btn 
          color="primary" 
          outline 
          label="로그아웃" 
          @click="handleLogout" 
        />
      </q-page>
    </q-page-container>
  </q-layout>
</template>
