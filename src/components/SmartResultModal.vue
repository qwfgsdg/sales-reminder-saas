<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import dayjs from 'dayjs'
import { Task, useTaskStore, HistoryType } from '@/stores/taskStore'
import { useQuasar } from 'quasar'

const props = defineProps<{
  task: Task
  modelValue: boolean
}>()

const emit = defineEmits(['update:modelValue'])
const taskStore = useTaskStore()
const $q = useQuasar()

// State
const step = ref<'main' | 'reschedule' | 'visit' | 'success'>('main')
const actionType = ref<HistoryType | ''>('')
const memo = ref('')
const utilityMode = ref<'memo' | 'history' | ''>('')
const isEditing = ref(false)

// Edit Form State
const editForm = ref({
  content: '',
  phone: '',
  datePart: '',
  timePart: '',
  ampm: 'pm'
})

// Reschedule State
const customDate = ref('')
const customTimeStr = ref('')
const customAmpm = ref('pm')

// Initialize on open
watch(() => props.modelValue, (val) => {
  if (val) {
    initialize()
  }
})

function initialize() {
  step.value = 'main'
  utilityMode.value = ''
  isEditing.value = false
  memo.value = ''
  actionType.value = ''
  
  // Init Edit Form
  const d = dayjs(props.task.due_date)
  editForm.value = {
    content: props.task.content,
    phone: props.task.phone || '',
    datePart: d.format('YYYY-MM-DD'),
    timePart: d.format('h:mm'),
    ampm: d.hour() >= 12 ? 'pm' : 'am'
  }
}

// --- Header Editing Logic ---
function toggleEdit() {
  if (isEditing.value) {
    // Save Changes
    let newDate = dayjs(props.task.due_date)
    
    // Parse Date/Time from Edit Form
    if (editForm.value.datePart && editForm.value.timePart) {
        // Simple parser for the edit form
        const [h, m] = editForm.value.timePart.split(':').map(Number)
        let hour = h
        if (editForm.value.ampm === 'pm' && hour < 12) hour += 12
        if (editForm.value.ampm === 'am' && hour === 12) hour = 0
        newDate = dayjs(editForm.value.datePart).hour(hour).minute(m || 0)
    }

    taskStore.updateTask(props.task.id, {
        content: editForm.value.content,
        phone: editForm.value.phone,
        due_date: newDate.format()
    })
    $q.notify({ message: '수정되었습니다.', color: 'positive', timeout: 500 })
  }
  isEditing.value = !isEditing.value
}

// --- Utility Logic ---
function saveMemo() {
    if(!editForm.value.memo.trim()) return
    taskStore.addHistory(props.task.id, { type: 'memo', timestamp: dayjs().format(), note: editForm.value.memo })
    taskStore.updateTask(props.task.id, { memo: editForm.value.memo }) // Update persistent memo
    editForm.value.memo = ''
    utilityMode.value = 'history' // Switch to history to see it
}

// --- Action Logic ---
function handleAction(type: HistoryType) {
  actionType.value = type
  
  if (type === 'absence' || type === 'call' || type === 'callback') {
    // Pre-fill reschedule defaults
    customDate.value = dayjs().format('YYYY-MM-DD')
    customTimeStr.value = ''
    customAmpm.value = 'pm'
    step.value = 'reschedule'
  } else if (type === 'visit') {
    customDate.value = dayjs().format('YYYY-MM-DD')
    customTimeStr.value = ''
    step.value = 'visit'
  } else if (type === 'reject') {
    if(confirm('정말 거절 처리하시겠습니까?')) {
      taskStore.addHistory(props.task.id, { type: 'reject', timestamp: dayjs().format() })
      taskStore.completeTask(props.task.id, '거절')
      close()
      $q.notify({ message: '거절 처리되었습니다.', color: 'grey-8' })
    }
  } else if (type === 'success') {
    step.value = 'success'
  }
}

// --- Reschedule Logic ---
function applyShortcut(type: '1h' | '3h' | 'tm_am' | 'tm_pm') {
  let target = dayjs()
  if (type === '1h') target = target.add(1, 'hour')
  if (type === '3h') target = target.add(3, 'hour')
  if (type === 'tm_am') target = target.add(1, 'day').hour(11).minute(0)
  if (type === 'tm_pm') target = target.add(1, 'day').hour(19).minute(0)
  
  applyReschedule(target)
}

function applyCustomReschedule() {
    // Smart Parsing Logic (Simplified port)
    // Combine date + timeStr + ampm
    let target = dayjs(customDate.value)
    
    // Parse time string (e.g. 230, 14:30)
    let h = 0, m = 0
    const raw = customTimeStr.value.replace(/[^0-9]/g, '')
    
    if (raw.length >= 3) {
        const val = parseInt(raw)
        h = Math.floor(val / 100)
        m = val % 100
    } else if (raw.length > 0) {
        h = parseInt(raw)
    }

    if (customAmpm.value === 'pm' && h < 12) h += 12
    if (customAmpm.value === 'am' && h === 12) h = 0

    target = target.hour(h).minute(m)
    applyReschedule(target)
}

function applyReschedule(dateObj: dayjs.Dayjs) {
    taskStore.updateTask(props.task.id, {
        due_date: dateObj.format(),
        rescheduleCount: (props.task.rescheduleCount || 0) + 1
    })
    
    // Log history
    let logType: HistoryType = 'reschedule'
    if (actionType.value === 'absence') logType = 'absence'
    else if (actionType.value === 'call') logType = 'callback'

    taskStore.addHistory(props.task.id, { 
        type: logType, 
        timestamp: dayjs().format(),
        note: memo.value
    })
    
    close()
    $q.notify({ message: logType === 'absence' ? '부재 처리됨' : '일정이 변경되었습니다.', color: 'orange-9' })
}

// --- Visit Logic ---
function applyVisit() {
    // Same parsing as custom reschedule
    let target = dayjs(customDate.value)
    let h = 0, m = 0
    // Try to parse input like "1430" or "2:30"
    // For simplicity, reusing the simple parser. 
    // In production, we'd use the robust Regex from legacy.
    const raw = customTimeStr.value.replace(/[^0-9]/g, '')
    if (raw.length >= 3) {
        const val = parseInt(raw)
        h = Math.floor(val / 100)
        m = val % 100
    } else if (raw.length > 0) h = parseInt(raw)

    // Visit usually implies explicit 24h or logic. Let's assume user inputs 24h or we need am/pm toggle for visit too?
    // Legacy had separate am/pm for visit? No, logic used smart parser.
    // For now, let's assume 24h if > 12, or just standard logic.
    // Let's rely on the user typing 1430 for 2:30 PM for now, or add AM/PM to visit UI.
    
    target = target.hour(h).minute(m)

    taskStore.updateTask(props.task.id, {
        type: 'visit',
        due_date: target.format(),
        content: `[미팅] ${props.task.content}`
    })
    taskStore.addHistory(props.task.id, { type: 'visit', timestamp: dayjs().format() })
    
    close()
    $q.notify({ message: '내방 예약이 잡혔습니다! 🎉', color: 'blue-9' })
}

// --- Success Logic ---
function applySuccess(subType: 'visit_success' | 'deposit_complete') {
    taskStore.addHistory(props.task.id, { type: subType, timestamp: dayjs().format(), note: memo.value })
    taskStore.completeTask(props.task.id, subType === 'visit_success' ? '내방 성공' : '콜 입금 완료')
    close()
    $q.notify({ message: '축하합니다! 성과를 달성했습니다 🏆', color: 'green-9' })
}

function close() {
  emit('update:modelValue', false)
}

// Helpers
function formatHistoryType(type: string) {
    const map: Record<string, string> = {
        'memo': '메모', 'absence': '부재', 'call': '재통화', 'callback': '재통화', 'reschedule': '변경',
        'visit': '내방', 'reject': '거절', 'visit_success': '내방성공', 'deposit_complete': '입금'
    }
    return map[type] || type
}
</script>

<template>
  <q-dialog :model-value="modelValue" @update:model-value="close" position="bottom">
    <q-card class="full-width q-pb-md" style="border-top-left-radius: 16px; border-top-right-radius: 16px">
      
      <!-- Smart Header -->
      <div class="q-pa-md bg-grey-1 border-b flex justify-between items-start">
        <div v-if="!isEditing" class="col text-left">
            <div class="text-h6 text-weight-bold ellipsis text-grey-9 row items-center">
                {{ task.content }}
            </div>
            <div class="text-caption text-grey-6 q-mt-xs">
                <q-icon name="phone" size="xs" /> {{ task.phone || '번호 없음' }}
            </div>
        </div>
        <div v-else class="col column q-gutter-xs">
            <q-input dense outlined v-model="editForm.content" class="bg-white" />
            <q-input dense outlined v-model="editForm.phone" class="bg-white" />
            <div class="row no-wrap q-gutter-xs">
                <q-input dense outlined v-model="editForm.datePart" type="date" class="bg-white col" />
                <div class="bg-white border rounded row no-wrap items-center">
                    <q-btn flat dense size="sm" :color="editForm.ampm==='am'?'primary':'grey'" label="AM" @click="editForm.ampm='am'" />
                    <q-btn flat dense size="sm" :color="editForm.ampm==='pm'?'primary':'grey'" label="PM" @click="editForm.ampm='pm'" />
                </div>
                <q-input dense outlined v-model="editForm.timePart" class="bg-white col" />
            </div>
        </div>
        <q-btn flat round color="primary" :icon="isEditing ? 'save' : 'edit'" @click="toggleEdit" class="q-ml-sm" />
      </div>

      <q-card-section class="q-pt-md">
        
        <!-- Step 1: Main -->
        <div v-if="step === 'main'">
            <div class="row q-col-gutter-sm">
                <!-- Action Buttons -->
                <div class="col-6"><q-btn class="full-width py-4" color="orange-1" text-color="orange-9" stack @click="handleAction('call')"><q-icon name="history" size="md" /><div>재통화 (미룸)</div></q-btn></div>
                <div class="col-6"><q-btn class="full-width py-4" color="grey-3" text-color="grey-8" stack @click="handleAction('absence')"><q-icon name="phone_missed" size="md" /><div>부재 (안받음)</div></q-btn></div>
                <div class="col-6"><q-btn class="full-width py-4" color="blue-1" text-color="blue-9" stack @click="handleAction('visit')"><q-icon name="handshake" size="md" /><div>내방 예약</div></q-btn></div>
                <div class="col-6"><q-btn class="full-width py-4" color="green-1" text-color="green-9" stack @click="handleAction('success')"><q-icon name="emoji_events" size="md" /><div>성공 (입금)</div></q-btn></div>
                <div class="col-12"><q-btn outline color="red-4" class="full-width q-mt-sm" label="거절 / 삭제" icon="block" @click="handleAction('reject')" /></div>
            </div>

            <!-- Utilities -->
            <div class="row q-col-gutter-xs q-mt-md border-t q-pt-sm">
                <div class="col">
                    <q-btn :outline="utilityMode!=='memo'" :color="utilityMode==='memo'?'warning':'grey'" class="full-width" size="sm" icon="note" label="메모" @click="utilityMode=utilityMode==='memo'?'':'memo'" />
                </div>
                <div class="col">
                    <q-btn :outline="utilityMode!=='history'" :color="utilityMode==='history'?'dark':'grey'" class="full-width" size="sm" icon="history" label="히스토리" @click="utilityMode=utilityMode==='history'?'':'history'">
                        <q-badge color="red" floating v-if="task.history && task.history.length">{{ task.history.length }}</q-badge>
                    </q-btn>
                </div>
            </div>

            <!-- Inline Utilities Content -->
            <div v-if="utilityMode === 'memo'" class="q-mt-sm bg-yellow-1 q-pa-sm rounded-borders">
                <q-input v-model="editForm.memo" type="textarea" rows="2" borderless dense placeholder="고객 특이사항 입력..." class="text-caption" />
                <div class="text-right"><q-btn size="sm" color="warning" label="저장 (Enter)" dense push @click="saveMemo" /></div>
            </div>

            <div v-if="utilityMode === 'history'" class="q-mt-sm bg-grey-1 q-pa-sm rounded-borders scroll" style="max-height: 150px">
                <div v-if="!task.history || !task.history.length" class="text-center text-caption text-grey">기록이 없습니다.</div>
                <div v-for="(h, i) in (task.history || []).slice().reverse()" :key="i" class="bg-white q-mb-xs q-pa-xs rounded-borders border text-caption">
                    <div class="row items-center justify-between">
                        <span class="text-bold text-grey-8">
                            <q-icon name="circle" size="6px" :color="h.type==='visit'?'blue':(h.type==='absence'?'orange':'grey')" class="q-mr-xs"/>
                            {{ formatHistoryType(h.type) }}
                        </span>
                        <span class="text-grey-5" style="font-size: 10px">{{ dayjs(h.timestamp).format('MM/DD HH:mm') }}</span>
                    </div>
                    <div v-if="h.note" class="text-grey-7 q-pl-sm border-l">{{ h.note }}</div>
                </div>
            </div>
        </div>

        <!-- Step 2: Reschedule -->
        <div v-if="step === 'reschedule'">
            <div class="text-center text-subtitle1 text-bold q-mb-sm text-primary">
                {{ actionType === 'absence' ? '부재중 처리' : '재통화 시간 설정' }}
            </div>
            <div class="row q-col-gutter-sm q-mb-md">
                <div class="col-3"><q-btn outline size="sm" class="full-width" label="1시간" @click="applyShortcut('1h')" /></div>
                <div class="col-3"><q-btn outline size="sm" class="full-width" label="3시간" @click="applyShortcut('3h')" /></div>
                <div class="col-3"><q-btn outline size="sm" class="full-width" label="내일 11시" @click="applyShortcut('tm_am')" /></div>
                <div class="col-3"><q-btn outline size="sm" class="full-width" label="내일 7시" @click="applyShortcut('tm_pm')" /></div>
            </div>
            
            <div class="row items-center bg-grey-2 q-pa-sm rounded-borders">
                <input type="date" v-model="customDate" class="no-border bg-transparent text-caption q-mr-sm" style="width: 100px" />
                <div class="row no-wrap border bg-white rounded-borders q-mr-sm">
                    <div :class="customAmpm==='am'?'bg-dark text-white':'text-grey'" class="q-px-xs cursor-pointer text-caption" @click="customAmpm='am'">AM</div>
                    <div :class="customAmpm==='pm'?'bg-dark text-white':'text-grey'" class="q-px-xs cursor-pointer text-caption" @click="customAmpm='pm'">PM</div>
                </div>
                <input type="text" v-model="customTimeStr" placeholder="예: 230" class="col no-border bg-transparent text-center" @keyup.enter="applyCustomReschedule"/>
                <q-btn color="dark" size="sm" label="저장" dense @click="applyCustomReschedule" />
            </div>
            <q-input v-model="memo" placeholder="메모 (선택)" dense class="q-mt-sm" />
            <q-btn flat class="full-width q-mt-sm text-grey" label="뒤로가기" @click="step='main'" />
        </div>

        <!-- Step 3: Visit -->
        <div v-if="step === 'visit'">
             <div class="text-center q-mb-md">
                <q-avatar color="blue-1" text-color="blue" icon="handshake" size="lg" />
                <div class="text-h6 text-blue-9 text-bold q-mt-xs">내방 약속 잡기</div>
            </div>
            <div class="bg-blue-1 q-pa-md rounded-borders q-mb-md">
                <div class="text-caption text-blue-9 text-bold">날짜</div>
                <q-input v-model="customDate" type="date" dense outlined bg-color="white" class="q-mb-sm" />
                <div class="text-caption text-blue-9 text-bold">시간</div>
                <q-input v-model="customTimeStr" placeholder="예: 1430 (오후 2시 30분)" dense outlined bg-color="white" />
            </div>
            <q-btn class="full-width" color="blue-8" label="약속 확정하기" size="lg" @click="applyVisit" />
            <q-btn flat class="full-width q-mt-sm text-grey" label="취소" @click="step='main'" />
        </div>

        <!-- Step 4: Success -->
        <div v-if="step === 'success'">
             <div class="text-center q-mb-md">
                <q-avatar color="green-1" text-color="green" icon="emoji_events" size="lg" />
                <div class="text-h6 text-green-9 text-bold q-mt-xs">성과 달성!</div>
            </div>
            <q-input v-model="memo" type="textarea" rows="3" filled label="성공 내역 메모 (금액 등)" class="q-mb-md" />
            <div class="row q-col-gutter-sm">
                <div class="col-6"><q-btn class="full-width py-3" color="blue-7" label="내방 성공" stack @click="applySuccess('visit_success')" /></div>
                <div class="col-6"><q-btn class="full-width py-3" color="green-7" label="콜 입금 완료" stack @click="applySuccess('deposit_complete')" /></div>
            </div>
            <q-btn flat class="full-width q-mt-sm text-grey" label="뒤로가기" @click="step='main'" />
        </div>

      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<style scoped>
.py-4 { padding-top: 16px; padding-bottom: 16px; }
.py-3 { padding-top: 12px; padding-bottom: 12px; }
.border-b { border-bottom: 1px solid #eee; }
.border-t { border-top: 1px solid #eee; }
.border-l { border-left: 2px solid #eee; }
</style>
