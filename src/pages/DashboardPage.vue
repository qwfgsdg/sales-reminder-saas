<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useQuasar } from 'quasar'
import dayjs from 'dayjs'
import { useTaskStore, Task } from '@/stores/taskStore'
import TaskItem from '@/components/TaskItem.vue'
import SmartResultModal from '@/components/SmartResultModal.vue'
import DashboardAnalytics from '@/components/DashboardAnalytics.vue'

const $q = useQuasar()
const taskStore = useTaskStore()
const { activeTasks, tasks } = storeToRefs(taskStore)

// State
const showModal = ref(false)
const selectedTask = ref<Task | null>(null)
const selectedStat = ref<'today'|'success'|'retry'|'reject' | null>(null) // Drill down

// Stats Computation
const stats = computed(() => {
    // Only count actions from TODAY logs
    const todayLogs = tasks.value.flatMap(t => t.history || []).filter(h => dayjs(h.timestamp).isSame(dayjs(), 'day'))
    
    return {
        todayAttempt: todayLogs.length,
        success: todayLogs.filter(h => ['success', 'visit_success', 'deposit_complete', 'visit'].includes(h.type)).length,
        retry: todayLogs.filter(h => ['absence', 'call', 'callback', 'reschedule'].includes(h.type)).length,
        // Since reject completes task, we check tasks status or history? History is safer.
        // Actually reject is a final state, so history is accurate.
        reject: todayLogs.filter(h => h.type === 'reject').length
    }
})

// Drill down logs
const drillDownLogs = computed(() => {
    if (!selectedStat.value) return []
    const todayLogs = tasks.value.flatMap(t => {
        // Map history to a flat structure with task content
        return (t.history || []).map(h => ({
            ...h,
            taskContent: t.content,
            taskId: t.id
        }))
    }).filter(h => dayjs(h.timestamp).isSame(dayjs(), 'day'))

    if (selectedStat.value === 'success') return todayLogs.filter(h => ['success', 'visit_success', 'deposit_complete', 'visit'].includes(h.type))
    if (selectedStat.value === 'retry') return todayLogs.filter(h => ['absence', 'call', 'callback', 'reschedule'].includes(h.type))
    if (selectedStat.value === 'reject') return todayLogs.filter(h => h.type === 'reject')
    if (selectedStat.value === 'today') return todayLogs // All attempts
    return []
})

function openModal(task: Task) {
  selectedTask.value = task
  showModal.value = true
}

function handleStatClick(type: 'today'|'success'|'retry'|'reject') {
    if (selectedStat.value === type) selectedStat.value = null
    else selectedStat.value = type
}

function formatType(type: string) {
    const map: Record<string, string> = {
        'visit_success': '내방성공', 'deposit_complete': '입금', 'visit': '내방예약',
        'absence': '부재', 'call': '재통화', 'reschedule': '변경', 'reject': '거절'
    }
    return map[type] || type
}
</script>

<template>
  <q-page class="q-pa-md bg-grey-1">
    <div class="max-w-800 q-mx-auto">
      
      <!-- Analytics Chart -->
      <DashboardAnalytics :tasks="tasks" />

      <!-- Header Stats -->
      <div class="row q-col-gutter-sm q-mb-lg">
        <div class="col-3">
          <q-card v-ripple @click="handleStatClick('today')" class="text-center q-pa-sm shadow-1 cursor-pointer relative-position" :class="selectedStat==='today'?'bg-grey-3 ring': 'bg-white'">
            <div class="text-caption text-grey">오늘 시도</div>
            <div class="text-h6 text-weight-bold">{{ stats.todayAttempt }}</div>
          </q-card>
        </div>
        <div class="col-3">
          <q-card v-ripple @click="handleStatClick('success')" class="text-center q-pa-sm shadow-1 no-border border-green cursor-pointer relative-position" :class="selectedStat==='success'?'bg-green-2 ring': 'bg-green-1'">
            <div class="text-caption text-green-9">성공</div>
            <div class="text-h6 text-weight-bold text-green-8">{{ stats.success }}</div>
          </q-card>
        </div>
        <div class="col-3">
          <q-card v-ripple @click="handleStatClick('retry')" class="text-center q-pa-sm shadow-1 no-border border-orange cursor-pointer relative-position" :class="selectedStat==='retry'?'bg-orange-2 ring': 'bg-orange-1'">
            <div class="text-caption text-orange-9">재통화</div>
            <div class="text-h6 text-weight-bold text-orange-8">{{ stats.retry }}</div>
          </q-card>
        </div>
        <div class="col-3">
          <q-card v-ripple @click="handleStatClick('reject')" class="text-center q-pa-sm shadow-1 no-border border-red cursor-pointer relative-position" :class="selectedStat==='reject'?'bg-red-2 ring': 'bg-red-1'">
            <div class="text-caption text-red-9">거절</div>
            <div class="text-h6 text-weight-bold text-red-8">{{ stats.reject }}</div>
          </q-card>
        </div>
      </div>

      <!-- Drill Down List -->
      <transition 
        enter-active-class="animated fadeInDown"
        leave-active-class="animated fadeOutUp"
      >
        <q-card v-if="selectedStat" class="q-mb-lg bg-white shadow-1 text-grey-8">
            <q-card-section class="q-py-sm border-b row justify-between items-center bg-grey-1">
                <div class="text-subtitle2 text-bold">
                    <q-icon name="filter_list" class="q-mr-xs" />
                    상세 내역 ({{ drillDownLogs.length }})
                </div>
                <q-btn flat round dense icon="close" size="sm" @click="selectedStat=null" />
            </q-card-section>
            <q-card-section class="q-pa-none scroll" style="max-height: 250px">
                <div v-if="drillDownLogs.length === 0" class="text-center q-pa-md text-caption text-grey">내역이 없습니다.</div>
                <q-list separator>
                    <q-item v-for="(log, i) in drillDownLogs" :key="i" class="q-py-sm text-caption">
                        <q-item-section avatar style="min-width: 30px">
                             <q-icon :name="log.type==='visit'?'handshake':(log.type==='absence'?'phone_missed':'check')" 
                                     size="xs" :color="log.type==='reject'?'red':'primary'" />
                        </q-item-section>
                        <q-item-section>
                            <div class="text-bold">{{ log.taskContent }}</div>
                            <div class="text-grey-6">{{ dayjs(log.timestamp).format('HH:mm') }} - {{ formatType(log.type) }}</div>
                        </q-item-section>
                        <q-item-section side v-if="log.note">
                            <div class="bg-yellow-1 q-px-sm rounded-borders text-grey-8 ellipsis" style="max-width: 100px">{{ log.note }}</div>
                        </q-item-section>
                    </q-item>
                </q-list>
            </q-card-section>
        </q-card>
      </transition>

      <!-- Task List -->
      <div>
        <div class="text-h6 q-mb-md text-grey-8 flex items-center gap-2">
          <q-icon name="list_alt" />
          오늘 해야 할 일
        </div>
        
        <q-list separator class="bg-transparent">
          <transition-group name="list">
            <TaskItem 
              v-for="task in activeTasks" 
              :key="task.id" 
              :task="task"
              @click="openModal"
              @toggle-check="openModal"
            />
          </transition-group>
        </q-list>

        <div v-if="activeTasks.length === 0" class="text-center q-pa-xl text-grey">
          <q-icon name="check_circle" size="4rem" color="grey-3" />
          <div class="q-mt-md">오늘 예정된 업무가 없습니다.</div>
          <div class="text-caption text-grey">우측 하단 (+) 버튼으로 일정을 등록하세요!</div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <SmartResultModal 
      v-if="selectedTask"
      v-model="showModal"
      :task="selectedTask"
    />
  </q-page>
</template>

<style scoped>
.max-w-800 {
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}
.border-green { border: 1px solid #a5d6a7; }
.border-orange { border: 1px solid #ffcc80; }
.border-red { border: 1px solid #ef9a9a; }
.ring { box-shadow: 0 0 0 2px currentColor; }
.border-b { border-bottom: 1px solid #eee; }

/* List Transition */
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
