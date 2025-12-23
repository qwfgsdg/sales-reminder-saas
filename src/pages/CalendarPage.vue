<script setup lang="ts">
import { ref, computed } from 'vue'
import dayjs from 'dayjs'
import { useTaskStore } from '@/stores/taskStore'
import type { Task } from '@/stores/taskStore'
import SmartResultModal from '@/components/SmartResultModal.vue'

const taskStore = useTaskStore()
const currentDate = ref(dayjs())

// State for interaction
const showTaskModal = ref(false)
const selectedTask = ref<Task | null>(null)
const showDayModal = ref(false)
const dayModalDate = ref('')
const dayModalTasks = ref<Task[]>([])

// Navigation
function changeMonth(delta: number) {
  currentDate.value = currentDate.value.add(delta, 'month')
}
function goToday() {
  currentDate.value = dayjs()
}

// Calendar Logic
const calendarCells = computed(() => {
  const year = currentDate.value.year()
  const month = currentDate.value.month()
  const firstDay = dayjs(new Date(year, month, 1))
  const lastDay = dayjs(new Date(year, month + 1, 0))
  
  const cells = []
  
  // Prev Month Padding
  const startDow = firstDay.day() // 0(Sun) ~ 6(Sat)
  for(let i=0; i<startDow; i++) {
    const d = firstDay.subtract(startDow - i, 'day')
    cells.push({ date: d, isCurrentMonth: false, tasks: getTasksForDate(d) })
  }
  
  // Current Month
  for(let d=1; d<=lastDay.date(); d++) {
    const date = dayjs(new Date(year, month, d))
    cells.push({ date: date, isCurrentMonth: true, tasks: getTasksForDate(date) })
  }
  
  // Next Month Padding (to 42 cells)
  const remaining = 42 - cells.length
  for(let i=1; i<=remaining; i++) {
    const d = lastDay.add(i, 'day')
    cells.push({ date: d, isCurrentMonth: false, tasks: getTasksForDate(d) })
  }
  
  return cells
})

function getTasksForDate(date: dayjs.Dayjs) {
  return taskStore.activeTasks.filter(t => 
    dayjs(t.due_date).isSame(date, 'day')
  )
}

function openTask(task: Task) {
  selectedTask.value = task
  showTaskModal.value = true
}

function openDayDetail(date: dayjs.Dayjs, tasks: Task[]) {
  dayModalDate.value = date.format('M월 D일')
  dayModalTasks.value = tasks
  showDayModal.value = true
}

function isToday(date: dayjs.Dayjs) {
    return date.isSame(dayjs(), 'day')
}

function triggerQuickAdd(date: dayjs.Dayjs) {
    taskStore.triggerQuickAdd(date.format('YYYY/MM/DD'))
}

// Helpers for Template
function countType(task: Task, type: string): number {
    if (!task.history) return 0
    return task.history.filter(h => h.type === type).length
}

function formatTimeSimple(dateStr: string) {
    if(!dateStr) return ''
    return dayjs(dateStr).format('A h:mm').replace('AM', '오전').replace('PM', '오후')
}
</script>

<template>
  <q-page class="bg-white column no-wrap" style="height: 100vh; overflow:hidden">
    <!-- Header -->
    <div class="q-pa-md border-b flex justify-between items-center bg-white shadow-1 z-10">
      <div class="text-h6 text-bold text-grey-9">
        {{ currentDate.format('YYYY년 M월') }}
      </div>
      <div class="row q-gutter-xs">
        <q-btn flat round icon="chevron_left" @click="changeMonth(-1)" />
        <q-btn outline label="오늘" color="grey-8" @click="goToday" />
        <q-btn flat round icon="chevron_right" @click="changeMonth(1)" />
      </div>
    </div>

    <!-- Calendar Grid Header -->
    <div class="grid-cols-7 bg-grey-1 border-b">
      <div v-for="d in ['일','월','화','수','목','금','토']" :key="d" 
           class="text-center q-py-sm text-caption text-bold"
           :class="d==='일'?'text-red':'text-grey-7'">
        {{ d }}
      </div>
    </div>

    <!-- Calendar Grid Body -->
    <div class="col grid-cols-7 scroll bg-grey-2">
      <div v-for="(cell, i) in calendarCells" :key="i"
           class="bg-white border-right border-bottom relative cursor-pointer hover:bg-blue-1 transition-colors q-pa-xs column group"
           :class="{'bg-grey-1 text-grey-5': !cell.isCurrentMonth, 'bg-blue-1': isToday(cell.date)}"
           style="min-height: 100px">
        
        <!-- Date Number -->
        <div class="row justify-between items-start">
            <span class="text-bold q-pa-xs rounded-borders" 
                  :class="{'text-red': cell.date.day()===0, 'bg-red text-white': isToday(cell.date)}">
                {{ cell.date.date() }}
            </span>
            <!-- Quick Add Button (Hover) -->
            <q-btn icon="add" flat round dense size="xs" color="blue" 
                   class="opacity-0 group-hover:opacity-100 transition-opacity"
                   @click.stop="triggerQuickAdd(cell.date)" />
        </div>

        <!-- Task List (Limit 3) -->
        <div class="col column q-gutter-xs q-mt-xs overflow-hidden">
            <div v-for="task in cell.tasks.slice(0, 3)" :key="task.id"
                 @click.stop="openTask(task)"
                 class="task-chip text-caption ellipsis rounded-borders q-px-xs column"
                 :class="task.type==='visit' ? 'bg-blue-1 text-blue-9' : 'bg-grey-2 text-grey-9'">
                
                <div class="row items-center no-wrap">
                    <q-icon v-if="task.type==='visit'" name="handshake" size="10px" class="q-mr-xs" />
                    <span class="text-weight-bold q-mr-xs" style="font-size:10px">{{ formatTimeSimple(task.due_date) }}</span>
                    <span class="ellipsis">{{ task.content }}</span>
                </div>

                <!-- Badges -->
                <div v-if="task.history && task.history.length > 0" class="row q-gutter-x-xs q-mt-xs">
                     <span v-if="countType(task, 'absence') > 0" class="badge-custom bg-yellow-1 text-orange-9">
                        부재 {{ countType(task, 'absence') }}
                     </span>
                     <span v-if="countType(task, 'callback') > 0" class="badge-custom bg-orange-1 text-deep-orange-9">
                        재통 {{ countType(task, 'callback') }}
                     </span>
                     <span v-if="countType(task, 'visit') > 0" class="badge-custom bg-blue-1 text-blue-9">
                        내방 {{ countType(task, 'visit') }}
                     </span>
                </div>

            </div>
        </div>

        <!-- More Button -->
        <div v-if="cell.tasks.length > 3" 
             @click.stop="openDayDetail(cell.date, cell.tasks)"
             class="text-caption text-grey text-center q-mt-auto bg-grey-2 rounded-borders cursor-pointer">
            + {{ cell.tasks.length - 3 }}개 더보기
        </div>

      </div>
    </div>

    <!-- Smart Modal -->
    <SmartResultModal 
      v-if="selectedTask"
      v-model="showTaskModal" 
      :task="selectedTask" 
    />

    <!-- Day Detail Modal -->
    <q-dialog v-model="showDayModal">
      <q-card style="width: 400px">
        <q-toolbar class="bg-grey-1 border-b">
          <q-toolbar-title class="text-subtitle1 text-bold">{{ dayModalDate }} 일정</q-toolbar-title>
          <q-btn flat round dense icon="close" v-close-popup />
        </q-toolbar>
        <q-card-section class="scroll" style="max-height: 60vh">
           <div v-if="dayModalTasks.length === 0" class="text-center text-grey q-pa-lg">일정이 없습니다.</div>
           <div v-for="task in dayModalTasks" :key="task.id"
                @click="openTask(task)"
                class="q-mb-sm q-pa-sm bg-grey-1 rounded-borders cursor-pointer hover:bg-grey-2 column">
                <div class="row items-center no-wrap">
                  <q-icon v-if="task.type === 'visit'" name="handshake" size="10px" class="q-mr-xs" />
                  <div class="text-caption text-weight-bold q-mr-xs" style="font-size: 10px; opacity: 0.7">
                    {{ formatTimeSimple(task.due_date) }}
                  </div>
                  <div class="ellipsis" style="font-size: 11px">{{ task.content }}</div>
                </div>

                <!-- Badges (Restored) -->
                <div v-if="task.history && task.history.length > 0" class="row q-gutter-x-xs q-mt-xs">
                     <div v-if="countType(task, 'absence') > 0" 
                          class="badge-custom bg-yellow-1 text-orange-9">
                        부재 {{ countType(task, 'absence') }}
                     </div>
                     <div v-if="countType(task, 'callback') > 0" 
                          class="badge-custom bg-orange-1 text-deep-orange-9">
                        재통 {{ countType(task, 'callback') }}
                     </div>
                     <div v-if="countType(task, 'visit') > 0" 
                          class="badge-custom bg-blue-1 text-blue-9">
                        내방 {{ countType(task, 'visit') }}
                     </div>
                </div>

              </div>
        </q-card-section>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<style scoped>
.grid-cols-7 {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}
.border-b { border-bottom: 1px solid #e0e0e0; }
.border-right { border-right: 1px solid #e0e0e0; }
.border-bottom { border-bottom: 1px solid #e0e0e0; }
.task-chip {
    font-size: 11px;
    padding: 2px 4px;
    cursor: pointer;
}
.task-chip:hover { filter: brightness(0.95); }
.hover\:bg-blue-1:hover { background-color: #e3f2fd; }
.group:hover .group-hover\:opacity-100 { opacity: 1; }
.opacity-0 { opacity: 0; }

/* Badge Styles */
.badge-custom {
    font-size: 9px;
    padding: 1px 3px;
    border-radius: 3px;
    font-weight: bold;
    border: 1px solid rgba(0,0,0,0.1);
    line-height: 1;
}
.bg-yellow-1 { background-color: #fff9c4 !important; }
.bg-orange-1 { background-color: #ffe0b2 !important; }
.bg-blue-1 { background-color: #bbdefb !important; }
</style>
