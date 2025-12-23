<script setup lang="ts">
import { computed } from 'vue'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line } from 'vue-chartjs'
import dayjs from 'dayjs'
import { Task } from '@/stores/taskStore'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const props = defineProps<{
  tasks: Task[]
}>()

const chartData = computed(() => {
  const labels = []
  const data = []
  
  // Last 7 days
  for (let i = 6; i >= 0; i--) {
    const d = dayjs().subtract(i, 'day')
    labels.push(d.format('MM/DD'))
    
    // Count history logs for this day
    const count = props.tasks.reduce((acc, t) => {
      if (!t.history) return acc
      const dayLogs = t.history.filter(h => dayjs(h.timestamp).isSame(d, 'day'))
      return acc + dayLogs.length
    }, 0)
    
    data.push(count)
  }

  return {
    labels,
    datasets: [
      {
        label: '활동량',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: '#3B82F6',
        pointBackgroundColor: '#3B82F6',
        borderWidth: 2,
        fill: true,
        tension: 0.4, // Smooth curve
        data
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false }
  },
  scales: {
    y: { beginAtZero: true, ticks: { precision: 0 } },
    x: { grid: { display: false } }
  }
}
</script>

<template>
  <q-card class="shadow-1 q-mb-lg bg-white overflow-hidden">
    <q-card-section>
      <div class="text-subtitle1 text-weight-bold text-grey-8 q-mb-sm">
        <q-icon name="show_chart" class="q-mr-sm" /> 주간 활동 추이
      </div>
      <div style="height: 200px">
        <Line :data="chartData" :options="chartOptions" />
      </div>
    </q-card-section>
  </q-card>
</template>
