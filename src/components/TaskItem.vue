<script setup lang="ts">
import { computed } from 'vue'
import dayjs from 'dayjs'
import isToday from 'dayjs/plugin/isToday'
import { Task } from '@/stores/taskStore'

dayjs.extend(isToday)

const props = defineProps<{
  task: Task
}>()

const emit = defineEmits(['click', 'toggle-check'])

// Computed Logic
const isOverdue = computed(() => {
  if (props.task.type === 'visit') return false
  return dayjs(props.task.due_date).isBefore(dayjs()) && !dayjs(props.task.due_date).isToday()
})

const isTodayTask = computed(() => dayjs(props.task.due_date).isToday())

const historyStats = computed(() => {
  const h = props.task.history || []
  const absence = h.filter(x => x.type === 'absence').length
  const retry = h.filter(x => x.type === 'reschedule' || x.type === 'call').length
  return { absence, retry }
})

// Format: 12/25 PM 3:30
const formattedDate = computed(() => {
  return dayjs(props.task.due_date).format('MM/DD A h:mm')
    .replace('AM', '오전').replace('PM', '오후')
})
</script>

<template>
  <q-item 
    clickable 
    v-ripple 
    @click="$emit('click', task)"
    class="q-mb-sm bg-white rounded-borders shadow-1 border-l-4"
    :class="{
      'border-blue-5': task.type === 'visit',
      'border-red-5': isOverdue,
      'border-grey-3': !isOverdue && task.type !== 'visit'
    }"
  >
    <!-- Checkbox Section -->
    <q-item-section avatar>
      <q-checkbox 
        :model-value="task.status === 'done'" 
        @update:model-value="$emit('toggle-check', task)"
        color="primary"
        keep-color
      />
    </q-item-section>

    <!-- Main Content -->
    <q-item-section>
      <q-item-label class="row items-center q-gutter-x-xs">
        <!-- Badges -->
        <q-badge v-if="isTodayTask" color="red-1" text-color="red-9" label="오늘" class="text-weight-bold" />
        <q-icon v-if="task.priority === 1" name="priority_high" color="red" size="xs" />
        
        <!-- Title -->
        <span :class="{'text-strike text-grey': task.status === 'done', 'text-weight-bold': true}">
          <q-icon v-if="task.type === 'visit'" name="handshake" color="blue" size="xs" class="q-mr-xs" />
          {{ task.content }}
        </span>
      </q-item-label>

      <!-- Sub Info -->
      <q-item-label caption class="row items-center q-gutter-x-sm q-mt-xs">
        
        <!-- Time -->
        <span :class="{'text-red text-weight-bold': isOverdue}">
          <q-icon name="schedule" size="xs" /> {{ formattedDate }}
        </span>

        <!-- History Badges (The Soul) -->
        <q-badge v-if="task.rescheduleCount > 0" color="orange-1" text-color="orange-9">
          ↻ {{ task.rescheduleCount }}
        </q-badge>
        
        <q-badge v-if="historyStats.absence > 0" color="grey-2" text-color="grey-9">
          부재 {{ historyStats.absence }}
        </q-badge>
        
        <q-badge v-if="historyStats.retry > 0" color="grey-2" text-color="grey-9">
          재통 {{ historyStats.retry }}
        </q-badge>
      </q-item-label>
    </q-item-section>

    <!-- Right Action (Phone) -->
    <q-item-section side v-if="task.phone">
      <q-btn round flat color="green" icon="phone" type="a" :href="`tel:${task.phone}`" @click.stop />
    </q-item-section>
  </q-item>
</template>

<style scoped>
.border-l-4 {
  border-left-width: 4px;
  border-left-style: solid;
}
.border-blue-5 { border-left-color: #2196F3; }
.border-red-5 { border-left-color: #F44336; }
.border-grey-3 { border-left-color: #EEEEEE; }
</style>
