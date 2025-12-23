<script setup lang="ts">
import { ref, computed } from 'vue'
import { useNLP } from '@/composables/useNLP'

const input = ref('')
const emit = defineEmits(['submit'])
const { parseInput } = useNLP()
const taskStore = useTaskStore()
import { useTaskStore } from '@/stores/taskStore'
import { nextTick } from 'vue'

// Watch for Quick Add Trigger
taskStore.$subscribe((mutation, state) => {
    if (state.quickAddDate) {
        input.value = `[${state.quickAddDate}] `
        state.quickAddDate = null // Reset
        nextTick(() => {
            const el = document.querySelector('input.smart-input-field') as HTMLInputElement
            if(el) el.focus()
        })
    }
})



// Live Preview Logic
const parsed = computed(() => parseInput(input.value))

function onSubmit() {
  if (!input.value.trim()) return
  
  const p = parseInput(input.value)
  // If content is empty but date exists (e.g. "내일 3시"), set default title
  const finalContent = p.content || '📅 새로운 일정'
  
  emit('submit', {
    content: finalContent,
    date: p.date, 
    phone: p.phone,
    priority: p.priority
  })
  input.value = ''
}
</script>

<template>
  <div class="smart-input-container q-mb-md">
    <!-- Live Preview Chips -->
    <div class="flex gap-2 q-mb-sm min-h-6">
      <transition-group name="fade">
        <q-chip v-if="parsed.dateStr && input" key="date" size="sm" color="grey-9" text-color="white" icon="event">
          {{ parsed.dateStr }}
        </q-chip>
        <q-chip v-if="parsed.phone" key="phone" size="sm" color="green-6" text-color="white" icon="phone">
          {{ parsed.phone }}
        </q-chip>
        <q-chip v-if="parsed.priority === 1" key="p1" size="sm" color="red-6" text-color="white" icon="priority_high">
          중요 (P1)
        </q-chip>
      </transition-group>
    </div>

    <q-input
      v-model="input"
      placeholder="예: 다음주 수요일 오후4시 4532 신디비 재컨택"
      outlined
      bg-color="white"
      class="text-body1 shadow-1 smart-input-field"
      @keydown.enter="onSubmit"
    >
      <template v-slot:prepend>
        <q-icon name="edit_note" color="primary" />
      </template>
      <template v-slot:append>
        <q-btn round dense flat icon="send" color="primary" @click="onSubmit" />
      </template>
    </q-input>
    
    <div class="q-px-sm q-pt-sm flex gap-2 text-xs text-grey-6">
      <span>💡 팁: '330' = 3:30 PM, '!!1' = 중요</span>
    </div>
  </div>
</template>

<style scoped>
.smart-input-container {
  max-width: 800px;
  margin: 0 auto;
}
.min-h-6 {
  min-height: 24px;
}
</style>
