<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useTaskStore } from '@/stores/taskStore'
import type { Task } from '@/stores/taskStore'
import TaskItem from '@/components/TaskItem.vue'
import SmartResultModal from '@/components/SmartResultModal.vue'

const taskStore = useTaskStore()
const { completedTasks, overdueTasks, todayTasks, upcomingTasks } = storeToRefs(taskStore)

// State
const showModal = ref(false)
const selectedTask = ref<Task | null>(null)
const showCompleted = ref(false)
const searchQuery = ref('')

function openModal(task: Task) {
  selectedTask.value = task
  showModal.value = true
}

// Deep Search Logic
function matchesSearch(t: Task) {
    if (!searchQuery.value.trim()) return true
    const q = searchQuery.value.toLowerCase()
    
    // 1. Basic Fields
    if (t.content.toLowerCase().includes(q)) return true
    if (t.phone && t.phone.includes(q)) return true
    if (t.memo && t.memo.toLowerCase().includes(q)) return true
    if (t.resultText && t.resultText.toLowerCase().includes(q)) return true

    // 2. History Deep Search
    if (t.history && t.history.length > 0) {
        return t.history.some((h: any) => { // Using any for history item to be safe, or Import HistoryItem
             // Search in history note
             if (h.note && h.note.toLowerCase().includes(q)) return true
             // Search in history type (optional, e.g. searching 'reject')
             if (h.type && h.type.includes(q)) return true
             return false
        })
    }

    return false
}

// Filtered Lists
const filteredOverdue = computed(() => overdueTasks.value.filter(matchesSearch))
const filteredToday = computed(() => todayTasks.value.filter(matchesSearch))
const filteredUpcoming = computed(() => upcomingTasks.value.filter(matchesSearch))
const filteredCompleted = computed(() => completedTasks.value.filter(matchesSearch))

// Logic for initial empty state fallback (Legacy behavior: if nothing overdue/upcoming, show today section even if empty)
// AND if we are NOT searching (if searching, we just show what matches)
const showTodaySection = computed(() => {
    if (searchQuery.value) return filteredToday.value.length > 0
    return filteredToday.value.length > 0 || (filteredOverdue.value.length === 0 && filteredUpcoming.value.length === 0 && !showCompleted.value)
})
</script>

<template>
  <q-page class="bg-white" style="padding-bottom: 80px">
    
    <!-- Sticky Header (Search & Toggle) -->
    <div class="sticky top-0 bg-white z-10 q-px-md q-py-sm border-b">
        <div class="row q-gutter-sm items-center">
            <div class="col relative-position">
                <q-icon name="search" class="absolute-left q-ml-sm text-grey-5" style="top: 10px" />
                <input v-model="searchQuery" type="text" placeholder="이름, 번호, 태그, 메모 검색..."
                       class="w-full q-pl-xl q-pr-md q-py-sm bg-grey-1 rounded-lg text-body2 outline-none border-none">
            </div>
            <div class="col-auto">
                <q-toggle v-model="showCompleted" label="완료 보기" color="blue" size="sm" class="text-xs text-grey-7" />
            </div>
        </div>
    </div>

    <div class="q-pa-md max-w-800 q-mx-auto">

        <!-- 1. Overdue Section (Red) -->
        <section v-if="filteredOverdue.length > 0" class="q-mb-lg">
            <div class="row items-center q-mb-sm">
                <div class="bg-red-50 text-red text-caption text-bold q-px-sm q-py-xs rounded">
                    <q-icon name="warning" class="q-mr-xs" /> 놓친 일정 ({{ filteredOverdue.length }})
                </div>
            </div>
            <div class="column q-gutter-y-sm">
                <TaskItem v-for="task in filteredOverdue" :key="task.id" :task="task" @click="openModal" 
                          class="border-left-red" />
            </div>
        </section>

        <!-- 2. Today Section (Blue) -->
        <section v-if="showTodaySection" class="q-mb-lg">
            <div class="row items-center q-mb-sm">
                <div class="bg-blue-50 text-blue text-caption text-bold q-px-sm q-py-xs rounded">
                    <q-icon name="wb_sunny" class="q-mr-xs" /> 오늘 할 일 ({{ filteredToday.length }})
                </div>
            </div>
            
            <div class="column q-gutter-y-sm">
                <!-- Empty State -->
                <div v-if="filteredToday.length === 0" class="text-center q-pa-lg bg-grey-1 rounded-lg border-dashed text-grey">
                    <q-icon name="free_breakfast" size="md" class="q-mb-sm text-grey-4" />
                    <div class="text-caption">검색 결과가 없습니다.</div>
                </div>

                <TaskItem v-for="task in filteredToday" :key="task.id" :task="task" @click="openModal" 
                          class="border-left-blue" />
            </div>
        </section>

        <!-- 3. Upcoming Section (Gray) -->
        <section v-if="filteredUpcoming.length > 0" class="q-mb-lg">
             <div class="row items-center q-mb-sm">
                <div class="bg-grey-2 text-grey-8 text-caption text-bold q-px-sm q-py-xs rounded">
                    <q-icon name="event" class="q-mr-xs" /> 예정된 일정 ({{ filteredUpcoming.length }})
                </div>
            </div>
            <div class="column q-gutter-y-sm">
                <TaskItem v-for="task in filteredUpcoming" :key="task.id" :task="task" @click="openModal" 
                          class="border-left-grey" />
            </div>
        </section>

        <!-- 4. Completed Section -->
        <section v-if="(showCompleted || searchQuery) && filteredCompleted.length > 0" class="q-pt-md border-t border-dashed">
            <div class="text-caption text-grey q-mb-sm text-bold">
                완료됨 ({{ filteredCompleted.length }}) 
                <span v-if="searchQuery" class="text-xs text-blue-500">*검색됨</span>
            </div>
            <div class="column q-gutter-y-sm opacity-60">
                <TaskItem v-for="task in filteredCompleted" :key="task.id" :task="task" @click="openModal" />
            </div>
        </section>

    </div>

    <!-- Modal -->
    <SmartResultModal v-if="selectedTask" v-model="showModal" :task="selectedTask" />
  </q-page>
</template>

<style scoped>
.max-w-800 { max-width: 800px; margin: 0 auto; }
.sticky { position: sticky; }
.top-0 { top: 0; }
.z-10 { z-index: 10; }
.border-b { border-bottom: 1px solid #f0f0f0; }
.border-t { border-top: 1px solid #e0e0e0; }
.border-dashed { border-style: dashed; }
.bg-red-50 { background-color: #fef2f2; }
.bg-blue-50 { background-color: #eff6ff; }
.bg-grey-1 { background-color: #f9fafb; }
.bg-grey-2 { background-color: #f3f4f6; }
.opacity-60 { opacity: 0.6; }

/* Custom Borders for TaskItem styling injection */
:deep(.border-left-red) { border-left: 4px solid #ef4444 !important; }
:deep(.border-left-blue) { border-left: 4px solid #3b82f6 !important; }
:deep(.border-left-grey) { border-left: 4px solid #d1d5db !important; }
</style>
