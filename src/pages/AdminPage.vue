<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '@/supabase'
import { useQuasar } from 'quasar'
import dayjs from 'dayjs'
import { UserProfile } from '@/stores/authStore'

const $q = useQuasar()
const users = ref<UserProfile[]>([])
const loading = ref(false)

const columns = [
  { name: 'email', label: 'Email', field: 'email', align: 'left', sortable: true },
  { name: 'created_at', label: 'Joined', field: 'created_at', format: (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm'), sortable: true },
  { name: 'role', label: 'Role', field: 'role', sortable: true },
  { name: 'status', label: 'Status', field: 'is_approved', align: 'center', sortable: true },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'center' }
]

async function fetchUsers() {
  loading.value = true
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error(error)
    $q.notify({ type: 'negative', message: '사용자 목록 로드 실패' })
  } else {
    users.value = data as UserProfile[]
  }
  loading.value = false
}

async function toggleApproval(user: UserProfile) {
  const newValue = !user.is_approved
  
  // Optimistic UI update
  user.is_approved = newValue 

  const { error } = await supabase
    .from('profiles')
    .update({ is_approved: newValue })
    .eq('id', user.id)

  if (error) {
    // Revert on error
    user.is_approved = !newValue
    $q.notify({ type: 'negative', message: '변경 실패: ' + error.message })
  } else {
    $q.notify({ 
      type: newValue ? 'positive' : 'warning', 
      message: newValue ? '승인되었습니다.' : '승인이 취소되었습니다.' 
    })
  }
}

onMounted(() => {
  fetchUsers()
})
</script>

<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h5 text-bold">👥 사용자 관리 (Admin)</div>
      <q-btn icon="refresh" flat round @click="fetchUsers" />
    </div>

    <q-table
      :rows="users"
      :columns="columns"
      row-key="id"
      :loading="loading"
      flat
      bordered
    >
      <!-- Status Column Customization -->
      <template v-slot:body-cell-status="props">
        <q-td :props="props">
          <q-chip
            :color="props.row.is_approved ? 'green-1' : 'orange-1'"
            :text-color="props.row.is_approved ? 'green-9' : 'orange-9'"
            size="sm"
            class="text-weight-bold"
          >
            {{ props.row.is_approved ? 'Approved' : 'Pending' }}
          </q-chip>
        </q-td>
      </template>

      <!-- Actions Column (Toggle Button) -->
      <template v-slot:body-cell-actions="props">
        <q-td :props="props">
          <q-btn
            :label="props.row.is_approved ? '취소' : '승인'"
            :color="props.row.is_approved ? 'grey' : 'primary'"
            size="sm"
            dense
            flat
            @click="toggleApproval(props.row)"
            :disable="props.row.role === 'admin'" 
          />
          <!-- Disable for other admins to prevent accidental lockout, or self-lockout -->
        </q-td>
      </template>
    </q-table>
  </q-page>
</template>
