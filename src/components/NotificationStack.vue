<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useTaskStore, Task } from '@/stores/taskStore'
import dayjs from 'dayjs'
import { useQuasar } from 'quasar'

const taskStore = useTaskStore()
const $q = useQuasar()

interface Alert {
  id: number
  taskId: string
  title: string
  body: string
  timestamp: Date
}

const activeAlerts = ref<Alert[]>([])
const titleInterval = ref<any>(null)
const originalTitle = document.title
const checkInterval = ref<any>(null)

// Permission
const notifPermission = ref(Notification.permission)

function requestPermission() {
  Notification.requestPermission().then(p => {
    notifPermission.value = p
    if (p === 'granted') $q.notify({ message: '알림이 활성화되었습니다.', color: 'positive' })
  })
}

// Logic similar to legacy checkAlarm
function checkAlarm() {
  if (notifPermission.value !== 'granted') return
  const now = dayjs()
  let updated = false

  taskStore.activeTasks.forEach((t: any) => {
    if (!t.due_date) return
    const diffMin = dayjs(t.due_date).diff(now, 'minute')
    
    // Ensure alertState exists (runtime patch)
    if (!t.alertState) t.alertState = { ready: false, fire: false }

    // 1. Visit: 1 Hour Before
    if (t.type === 'visit') {
        if (diffMin <= 60 && diffMin > 0 && !t.alertState.ready) {
            addAlert(t, `🚗 내방 1시간 전!`, t.content)
            new Notification(`🚗 내방 1시간 전!`, { body: t.content })
            t.alertState.ready = true
            updated = true
        }
    } 
    // 2. Call: 10 Min Before
    else {
        if (diffMin <= 10 && diffMin > 0 && !t.alertState.ready) {
            addAlert(t, `📞 재통화 10분 전!`, t.content)
            new Notification(`📞 재통화 10분 전!`, { body: t.content })
            t.alertState.ready = true
            updated = true
        }
    }

    // 3. Action Time (Now)
    if (diffMin <= 0 && !t.alertState.fire) {
        const title = t.type === 'visit' ? '🏃‍♂️ 미팅 출발하세요!' : '📞 지금 전화하세요!'
        addAlert(t, title, t.content)
        new Notification(title, { body: t.content })
        t.alertState.fire = true
        updated = true
    }
  })

  // We need to persist alertState back to store if changed
  // In a real app, we'd use an action. For now, since `t` is a reactive object from store, it might auto-update if we are careful. 
  // However, Pinia state mutation outside of actions is generally okay in setup stores but better to be explicit.
  if (updated) {
     // Trigger save in store (hacky but works if store watches deep, or we call a dummy save)
     taskStore.updateTask('dummy', {}) // trigger save
  }
}

function addAlert(task: Task, title: string, body: string) {
    if (activeAlerts.value.some(a => a.taskId === task.id && a.title === title)) return
    
    activeAlerts.value.push({
        id: Date.now() + Math.random(),
        taskId: task.id,
        title,
        body,
        timestamp: new Date()
    })
    blinkTitle(title)
}

function removeAlert(id: number) {
    const idx = activeAlerts.value.findIndex(a => a.id === id)
    if (idx !== -1) activeAlerts.value.splice(idx, 1)
}

function blinkTitle(msg: string) {
    if (titleInterval.value) clearInterval(titleInterval.value)
    let toggle = false
    titleInterval.value = setInterval(() => {
        document.title = toggle ? `(🔔) ${msg}` : originalTitle
        toggle = !toggle
    }, 1000)
    setTimeout(() => {
        if (titleInterval.value) clearInterval(titleInterval.value)
        document.title = originalTitle
    }, 10000)
}

onMounted(() => {
    checkInterval.value = setInterval(checkAlarm, 5000) // Check every 5 sec
})

onUnmounted(() => {
    if (checkInterval.value) clearInterval(checkInterval.value)
    if (titleInterval.value) clearInterval(titleInterval.value)
})
</script>

<template>
  <div class="fixed-top-right q-ma-md z-max column q-gutter-sm" style="pointer-events: none">
    
    <!-- Permission Request -->
    <div v-if="notifPermission !== 'granted'" class="pointer-events-auto">
        <q-btn color="primary" icon="notifications" label="알림 권한 켜기" size="sm" @click="requestPermission" class="shadow-2" />
    </div>

    <!-- Stack -->
    <transition-group name="list">
        <div v-for="alert in activeAlerts.slice(0, 3)" :key="alert.id" 
             class="bg-white q-pa-sm rounded-borders shadow-4 pointer-events-auto row no-wrap items-start" 
             style="width: 300px; border-left: 4px solid #ef5350">
            <q-icon name="notifications_active" color="red" size="sm" class="q-mr-sm q-mt-xs" />
            <div class="col">
                <div class="text-subtitle2 text-bold">{{ alert.title }}</div>
                <div class="text-caption text-grey-8">{{ alert.body }}</div>
                <div class="text-caption text-grey-5" style="font-size: 10px">{{ dayjs(alert.timestamp).format('HH:mm') }}</div>
            </div>
            <q-btn flat round dense icon="close" size="xs" color="grey" @click="removeAlert(alert.id)" />
        </div>
    </transition-group>

    <div v-if="activeAlerts.length > 3" 
         class="bg-grey-9 text-white q-px-md q-py-xs rounded-full self-end pointer-events-auto cursor-pointer shadow-2 text-caption text-bold"
         @click="activeAlerts = []">
        +{{ activeAlerts.length - 3 }}개의 알림 더보기 (모두 지우기)
    </div>
  </div>
</template>

<style scoped>
.z-max { z-index: 9999; }
.pointer-events-auto { pointer-events: auto; }
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(50px);
}
</style>
