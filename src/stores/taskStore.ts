import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import dayjs from 'dayjs'
import { supabase } from '@/supabase'
import { Notify } from 'quasar'

export type HistoryType = 'call' | 'visit' | 'reschedule' | 'absence' | 'callback' | 'reject' | 'success' | 'visit_success' | 'deposit_complete' | 'memo'

export interface HistoryItem {
    type: HistoryType
    timestamp: string
    note?: string
}

export interface Task {
    id: string
    content: string
    phone?: string
    due_date: string // ISO string
    type: 'call' | 'visit'
    status: 'active' | 'done'
    priority: number
    rescheduleCount: number
    history: HistoryItem[]
    memo?: string // Persistent memo
    resultText?: string // For completed items
}

export const useTaskStore = defineStore('tasks', () => {
    const tasks = ref<Task[]>([])
    const loading = ref(false)

    const activeTasks = computed(() => tasks.value.filter(t => t.status === 'active').sort((a, b) => dayjs(a.due_date).diff(dayjs(b.due_date))))
    const completedTasks = computed(() => tasks.value.filter(t => t.status === 'done').sort((a, b) => dayjs(b.due_date).diff(dayjs(a.due_date))))

    // Legacy Section Logic (Strict Time-Based + Visit Included)
    const overdueTasks = computed(() => {
        const now = dayjs()
        return activeTasks.value.filter(t => {
            if (!t.due_date) return false
            return dayjs(t.due_date).isBefore(now) // Any task strictly in the past is overdue
        })
    })

    const todayTasks = computed(() => {
        const now = dayjs()
        return activeTasks.value.filter(t => {
            if (!t.due_date) return true
            const d = dayjs(t.due_date)
            // It is today AND it is in the future (not overdue)
            return d.isSame(now, 'day') && (d.isSame(now) || d.isAfter(now))
        })
    })

    const upcomingTasks = computed(() => {
        const todayEnd = dayjs().endOf('day')
        return activeTasks.value.filter(t => dayjs(t.due_date).isAfter(todayEnd))
    })

    // --- Supabase Actions ---

    async function loadTasks() {
        loading.value = true
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .order('due_date', { ascending: true })

        if (error) {
            console.error('Error loading tasks:', error)
            Notify.create({ type: 'negative', message: '데이터 로드 실패' })
        } else if (data) {
            tasks.value = data as Task[]
        }
        loading.value = false
    }

    async function addTask(task: Task) {
        // Remove ID to let DB generate it, or use the one provided if valid UUID
        // But usually we let DB handle ID. However, frontend might generate temp ID.
        // Let's strip ID and let Supabase generate it, OR ensure we send a valid UUID.
        // The mock data used simples IDs '1', '2'. We should cleanup.

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            Notify.create({ type: 'warning', message: '로그인이 필요합니다.' })
            return
        }

        const { id, ...taskData } = task // eslint-disable-line @typescript-eslint/no-unused-vars

        const { data, error } = await supabase
            .from('tasks')
            .insert({
                ...taskData,
                user_id: user.id,
                history: task.history || [] // Ensure JSON array
            })
            .select()
            .single()

        if (error) {
            console.error('Error adding task:', error)
            Notify.create({ type: 'negative', message: '저장 실패' })
        } else if (data) {
            tasks.value.push(data as Task)
            Notify.create({ type: 'positive', message: '저장되었습니다.' })
        }
    }

    async function updateTask(id: string, updates: Partial<Task>) {
        const { error } = await supabase
            .from('tasks')
            .update(updates)
            .eq('id', id)

        if (error) {
            console.error('Error updating task:', error)
            Notify.create({ type: 'negative', message: '수정 실패' })
        } else {
            // Optimistic Update
            const index = tasks.value.findIndex(t => t.id === id)
            if (index !== -1) {
                tasks.value[index] = { ...tasks.value[index], ...updates } as Task
            }
        }
    }

    async function completeTask(id: string, resultText: string) {
        await updateTask(id, { status: 'done', resultText })
    }

    async function addHistory(id: string, item: HistoryItem) {
        const t = tasks.value.find(x => x.id === id)
        if (t) {
            const newHistory = [...(t.history || []), item]
            await updateTask(id, { history: newHistory })
        }
    }

    // Deletion
    async function deleteTask(id: string) {
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', id)

        if (error) {
            Notify.create({ type: 'negative', message: '삭제 실패' })
        } else {
            tasks.value = tasks.value.filter(t => t.id !== id)
            Notify.create({ type: 'positive', message: '삭제되었습니다.' })
        }
    }

    // Initialize
    loadTasks()

    // Quick Add Global State
    const quickAddDate = ref<string | null>(null)
    function triggerQuickAdd(dateStr: string) {
        quickAddDate.value = dateStr
    }

    // Backup & Restore (Still works with local JSON, but fetches from memory)
    function exportData() {
        const data = {
            tasks: tasks.value,
            version: 'v5_supabase',
            timestamp: new Date().toISOString()
        }
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `SalesReminder_Backup_${dayjs().format('YYYYMMDD')}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    async function importData(file: File): Promise<boolean> {
        // For Supabase, import means "Bulk Insert". 
        // We'll parse the file and insert each task.
        return new Promise((resolve) => {
            const reader = new FileReader()
            reader.onload = async (e) => {
                try {
                    const json = JSON.parse(e.target?.result as string)
                    if (json.tasks && Array.isArray(json.tasks)) {
                        const { data: { user } } = await supabase.auth.getUser()
                        if (!user) return resolve(false)

                        const newTasks = json.tasks.map((t: any) => ({
                            content: t.content,
                            phone: t.phone,
                            status: t.status,
                            memo: t.memo,
                            created_at: t.created_at || new Date().toISOString(),
                            due_date: t.due_date,
                            history: t.history || [],
                            user_id: user.id
                        }))

                        const { error } = await supabase.from('tasks').insert(newTasks)

                        if (!error) {
                            await loadTasks()
                            resolve(true)
                        } else {
                            console.error(error)
                            resolve(false)
                        }
                    } else {
                        resolve(false)
                    }
                } catch (err) {
                    console.error('Import failed', err)
                    resolve(false)
                }
            }
            reader.readAsText(file)
        })
    }

    return {
        tasks, activeTasks, completedTasks,
        overdueTasks, todayTasks, upcomingTasks,
        addTask, updateTask, completeTask, addHistory, deleteTask,
        quickAddDate, triggerQuickAdd,
        exportData, importData, loadTasks
    }
})
