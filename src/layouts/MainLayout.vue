<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTaskStore } from '@/stores/taskStore'
import SmartInput from '@/components/SmartInput.vue'
import NotificationStack from '@/components/NotificationStack.vue'
import dayjs from 'dayjs'
import { useQuasar } from 'quasar'

const leftDrawerOpen = ref(true) 
const router = useRouter()
const taskStore = useTaskStore()
const $q = useQuasar()

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

function handleGlobalAdd(payload: any) {
  taskStore.addTask({
    id: Date.now().toString(),
    content: payload.content,
    phone: payload.phone,
    due_date: payload.date ? dayjs(payload.date).format() : dayjs().format(),
    type: 'call',
    status: 'active',
    priority: payload.priority,
    rescheduleCount: 0,
    history: []
  })
  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
  $q.notify({ message: '등록되었습니다!', color: 'positive', position: 'top', timeout: 800 })
}

const fileInput = ref<HTMLInputElement | null>(null)

function handleBackup() {
  taskStore.exportData()
  $q.notify({ message: '백업 파일이 다운로드됩니다.', color: 'positive', timeout: 1000 })
}

function triggerRestore() {
  fileInput.value?.click()
}

async function handleRestore(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    const success = await taskStore.importData(target.files[0])
    if (success) {
      $q.notify({ message: '복원 완료! 데이터를 새로고침합니다.', color: 'positive' })
      setTimeout(() => window.location.reload(), 500) // Safety reload to ensure full state sync
    } else {
      $q.notify({ message: '복원 실패: 올바른 백업 파일인지 확인하세요.', color: 'negative' })
    }
  }
}

const menuItems = [
  { icon: 'list', label: '리스트 (Home)', to: '/' },
  { icon: 'calendar_month', label: '캘린더', to: '/calendar' },
  { icon: 'analytics', label: '분석 (Dashboard)', to: '/analytics' },
]
</script>

<template>
  <q-layout view="lHh Lpr lFf">
    
    <q-header class="bg-white text-grey-9 shadow-1">
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />
        <q-toolbar-title class="text-weight-bold flex items-center">
          <q-icon name="gps_fixed" color="red" class="q-mr-sm" />
          대한 콜 리마인더 <span class="text-caption bg-yellow-4 text-dark q-px-xs rounded q-ml-sm text-bold">SaaS</span>
        </q-toolbar-title>
        <q-space />
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above class="bg-slate-900 text-grey-4" :width="240">
      <div class="q-pa-md text-white text-weight-bold row items-center">
         메뉴
      </div>
      <q-list padding>
        <q-item v-for="item in menuItems" :key="item.label" clickable v-ripple :to="item.to" active-class="text-white bg-slate-800">
          <q-item-section avatar><q-icon :name="item.icon" /></q-item-section>
          <q-item-section>{{ item.label }}</q-item-section>
        </q-item>
      </q-list>
      
      <div class="absolute-bottom q-pa-md border-t border-slate-700 row q-gutter-sm">
         <q-btn size="sm" outline color="grey-5" class="col" icon="download" label="백업" @click="handleBackup" />
         <q-btn size="sm" outline color="grey-5" class="col" icon="upload" label="복원" @click="triggerRestore" />
         <input type="file" ref="fileInput" style="display: none" accept=".json" @change="handleRestore" />
      </div>
    </q-drawer>

    <q-page-container class="bg-grey-1 relative-position">
      <router-view />
      <NotificationStack />
    </q-page-container>

    <!-- Persistent Bottom Footer Input -->
    <q-footer bordered class="bg-white text-dark shadow-up-2">
        <div class="q-pa-sm max-w-800 q-mx-auto">
            <SmartInput @submit="handleGlobalAdd" />
        </div>
    </q-footer>

  </q-layout>
</template>

<style scoped>
/* Imitating Tailwind Colors */
.bg-slate-900 { background-color: #0f172a; }
.bg-slate-800 { background-color: #1e293b; }
.border-slate-700 { border-color: #334155; }
.text-grey-4 { color: #94a3b8; }
.max-w-800 { max-width: 800px; margin: 0 auto; }
</style>
