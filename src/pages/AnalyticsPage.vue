<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTaskStore } from '@/stores/taskStore'
import type { Task, HistoryItem } from '@/stores/taskStore'
import SmartResultModal from '@/components/SmartResultModal.vue'
import dayjs from 'dayjs'

const taskStore = useTaskStore()

// State
const selectedStat = ref<'today' | 'success' | 'retry' | 'reject' | null>(null)
const timeFilter = ref<'today' | 'week' | 'all'>('week') // Renamed from timeRange
const showModal = ref(false)
const selectedTaskId = ref<string | null>(null)

// Computed for Modal
const selectedTask = computed(() => {
    if (!selectedTaskId.value) return null
    return taskStore.tasks.find(t => t.id === selectedTaskId.value) || null
})

// Helper: Get task by ID
function getTask(id: string) {
    return taskStore.tasks.find(t => t.id === id)
}

function openTask(taskId: string) {
    selectedTaskId.value = taskId
    showModal.value = true
}

// Helper: Filter Logic
function isWithinFilter(timestamp: string) {
    const d = dayjs(timestamp)
    const now = dayjs()

    if (timeFilter.value === 'today') {
        return d.isSame(now, 'day')
    } else if (timeFilter.value === 'week') {
        return d.isAfter(now.subtract(7, 'day'))
    }
    return true // all
}

// Stats Computation
const stats = computed(() => {
    const tasks = taskStore.tasks
    const logs = tasks.flatMap((t: Task) => t.history || []).filter((h: HistoryItem) => isWithinFilter(h.timestamp))

    return {
        totalAttempt: logs.length,
        success: logs.filter((h: HistoryItem) => ['success', 'visit_success', 'deposit_complete', 'visit'].includes(h.type)).length,
        retry: logs.filter((h: HistoryItem) => ['absence', 'call', 'callback', 'reschedule'].includes(h.type)).length,
        reject: logs.filter((h: HistoryItem) => h.type === 'reject').length
    }
})

// Drill-down Logs
const drillDownLogs = computed(() => {
    if (!selectedStat.value) return []

    const tasks = taskStore.tasks
    const logs = tasks.flatMap((t: Task) => {
        return (t.history || []).map((h: HistoryItem) => ({
            taskId: t.id,
            taskContent: t.content,
            ...h
        }))
    })
    
    // 1. Time Filter
    const timeFiltered = logs.filter((h: any) => isWithinFilter(h.timestamp))

    // 2. Type Filter
    if (selectedStat.value === 'success') return timeFiltered.filter((h: any) => ['success', 'visit_success', 'deposit_complete', 'visit'].includes(h.type))
    if (selectedStat.value === 'retry') return timeFiltered.filter((h: any) => ['absence', 'call', 'callback', 'reschedule'].includes(h.type))
    if (selectedStat.value === 'reject') return timeFiltered.filter((h: any) => h.type === 'reject')
    if (selectedStat.value === 'today') return timeFiltered // Show all for 'total' click

    return []
})

function handleStatClick(type: 'today'|'success'|'retry'|'reject') {
    if (selectedStat.value === type) selectedStat.value = null
    else selectedStat.value = type
}

function formatType(type: string) {
    const map: Record<string, string> = {
        'visit_success': '내방성공', 'deposit_complete': '입금', 'visit': '내방예약',
        'absence': '부재', 'call': '재통화', 'callback': '재통화', 'reschedule': '변경', 'reject': '거절',
        'success': '성공'
    }
    return map[type] || type
}
</script>

<template>
  <q-page class="q-pa-md bg-grey-1">
    <div class="max-w-800 q-mx-auto">
      
      <div class="row justify-between items-center q-mb-md">
          <div class="text-h6 text-grey-8">
              <q-icon name="analytics" /> 분석 대시보드
          </div>
          <!-- Time Filter -->
          <div class="bg-white rounded-borders shadow-1 row no-wrap">
              <q-btn flat dense size="sm" :color="timeFilter==='today'?'primary':'grey'" label="오늘" @click="timeFilter='today'" class="q-px-sm" />
              <q-separator vertical />
              <q-btn flat dense size="sm" :color="timeFilter==='week'?'primary':'grey'" label="7일" @click="timeFilter='week'" class="q-px-sm" />
              <q-separator vertical />
              <q-btn flat dense size="sm" :color="timeFilter==='all'?'primary':'grey'" label="전체" @click="timeFilter='all'" class="q-px-sm" />
          </div>
      </div>

      <!-- Stats Cards -->
      <div class="row q-col-gutter-sm q-mb-lg">
        <div class="col-3">
          <q-card v-ripple @click="handleStatClick('today')" class="text-center q-pa-sm shadow-1 cursor-pointer relative-position" :class="selectedStat==='today'?'bg-grey-3 ring': 'bg-white'">
            <div class="text-caption text-grey">시도 ({{ timeFilter === 'all' ? '전체' : (timeFilter === 'week' ? '7일' : '오늘') }})</div>
            <div class="text-h6 text-weight-bold">{{ stats.totalAttempt }}</div>
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
            <q-card-section class="q-pa-none scroll" style="max-height: 400px">
                <div v-if="drillDownLogs.length === 0" class="text-center q-pa-md text-caption text-grey">내역이 없습니다.</div>
                <q-list separator>
                    <q-expansion-item 
                        v-for="(log, i) in drillDownLogs" :key="i"
                        group="analytics-logs"
                        class="bg-white overflow-hidden"
                        header-class="q-px-sm"
                    >
                        <template v-slot:header>
                             <q-item-section avatar style="min-width: 30px">
                                 <q-icon :name="log.type==='visit'?'handshake':(log.type==='absence'?'phone_missed':'check')" 
                                         size="xs" :color="log.type==='reject'?'red':'primary'" />
                            </q-item-section>
                            
                            <q-item-section>
                                <div class="text-bold text-sm">{{ log.taskContent }}</div>
                                <div class="text-xs text-grey-6 row items-center">
                                    {{ dayjs(log.timestamp).format('MM/DD HH:mm') }}
                                    <q-badge v-if="(getTask(log.taskId)?.history?.length ?? 0) > 1" color="grey-3" text-color="grey-8" class="q-ml-sm text-xxs px-1">
                                        {{ getTask(log.taskId)?.history?.length }}번째 시도
                                    </q-badge>
                                </div>
                            </q-item-section>

                            <q-item-section side>
                                <div class="row items-center">
                                    <q-badge :color="log.type==='reject'?'red-1':'blue-1'" :text-color="log.type==='reject'?'red-9':'blue-9'">
                                        {{ formatType(log.type) }}
                                    </q-badge>
                                </div>
                            </q-item-section>
                        </template>

                        <!-- Expanded Body: Inline Timeline -->
                        <div class="q-px-md q-pb-md bg-grey-1 relative-position">
                             <!-- 1. Full Context Note -->
                            <div v-if="log.note" class="q-ma-sm q-pa-sm bg-yellow-1 rounded-borders text-grey-9 text-body2 shadow-1 border-left-yellow">
                                <q-icon name="format_quote" class="q-mr-xs text-orange" />
                                <strong>메모:</strong> {{ log.note }}
                            </div>

                            <!-- 2. Full History Timeline -->
                            <div class="q-mt-md q-pl-sm">
                                <div class="text-caption text-grey-7 q-mb-xs font-bold">📋 전체 히스토리</div>
                                <q-timeline color="secondary" class="q-ml-sm">
                                    <q-timeline-entry
                                        v-for="(h, idx) in getTask(log.taskId)?.history" :key="idx"
                                        :title="formatType(h.type)"
                                        :subtitle="dayjs(h.timestamp).format('YYYY-MM-DD A h:mm')"
                                        :icon="h.type==='reject'?'close':(h.type==='visit'?'handshake':'phone')"
                                        :color="h.type==='reject'?'red':'primary'"
                                        dense
                                    >
                                        <div v-if="h.note" class="text-grey-8">{{ h.note }}</div>
                                    </q-timeline-entry>
                                </q-timeline>
                            </div>

                            <!-- 3. Action Button -->
                            <div class="row justify-end q-mt-sm">
                                <q-btn size="sm" outline color="primary" label="상세 편집" icon="edit" @click.stop="openTask(log.taskId)" />
                            </div>
                        </div>
                    </q-expansion-item>
                </q-list>
            </q-card-section>
        </q-card>
      </transition>
      
      <!-- Smart Modal Interaction -->
      <SmartResultModal 
        v-if="selectedTask"
        v-model="showModal" 
        :task="selectedTask" 
      />

    </div>
  </q-page>
</template>



<style scoped>
.max-w-800 { max-width: 800px; margin: 0 auto; }
.border-green { border: 1px solid #a5d6a7; }
.border-orange { border: 1px solid #ffcc80; }
.border-red { border: 1px solid #ef9a9a; }
.ring { box-shadow: 0 0 0 2px currentColor; }
.border-left-yellow { border-left: 4px solid #fbc02d; }
.text-xxs { font-size: 10px; }
</style>
