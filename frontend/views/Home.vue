<template>
    <PageLayout>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Left: Dashboard cards -->
            <div class="lg:col-span-2 space-y-6">
                <div class="bg-white rounded-xl shadow p-6">
                    <h1 class="text-2xl font-bold">ภาพรวมการเข้าเรียน</h1>
                    <p class="text-sm text-gray-500 mt-1">สรุปสถิติการเข้าเรียนและกิจกรรมล่าสุด</p>

                    <div class="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div class="p-4 bg-gradient-to-r from-blue-50 to-white rounded-lg border">
                            <div class="text-sm text-gray-500">รายวิชา</div>
                            <div class="text-2xl font-bold mt-2">{{ subjectsCount }}</div>
                        </div>
                        <div class="p-4 bg-gradient-to-r from-green-50 to-white rounded-lg border">
                            <div class="text-sm text-gray-500">จำนวนนักเรียนที่บันทึก</div>
                            <div class="text-2xl font-bold mt-2">{{ studentsCount }}</div>
                        </div>
                        <div class="p-4 bg-gradient-to-r from-yellow-50 to-white rounded-lg border">
                            <div class="text-sm text-gray-500">การเข้าเรียนวันนี้</div>
                            <div class="text-2xl font-bold mt-2">{{ todayAttendance }}</div>
                        </div>
                    </div>

                    <div class="mt-6">
                        <h3 class="text-lg font-semibold">กิจกรรมล่าสุด</h3>
                        <div v-if="recent.length === 0" class="text-sm text-gray-500 mt-2">ยังไม่มีข้อมูล</div>
                        <ul class="mt-3 space-y-2">
                            <li v-for="(r, i) in recent" :key="i" class="p-3 bg-gray-50 rounded-md">
                                <div class="text-sm font-medium">{{ r.title }}</div>
                                <div class="text-xs text-gray-500">{{ r.time }}</div>
                            </li>
                        </ul>
                    </div>
                
                                    <!-- Attendance chart -->
                                    <div class="bg-white rounded-xl shadow p-6 mt-6">
                                        <h3 class="text-lg font-semibold">กราฟการเข้าเรียน (7 วัน)</h3>
                                        <div class="mt-4">
                                            <canvas ref="attendanceChart" class="w-full h-56"></canvas>
                                        </div>
                                    </div>

                                                    <!-- Small charts: Pie (present/absent) and Bar (per-subject) -->
                                                    <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div class="bg-white rounded-xl shadow p-6">
                                                            <h3 class="text-lg font-semibold">สถานะการมาเรียน</h3>
                                                            <div class="mt-4 flex items-center justify-center">
                                                                <canvas ref="pieChart" class="w-48 h-48"></canvas>
                                                            </div>
                                                        </div>

                                                        <div class="bg-white rounded-xl shadow p-6">
                                                            <h3 class="text-lg font-semibold">สรุปตามรายวิชา</h3>
                                                            <div class="mt-4">
                                                                <canvas ref="barChart" class="w-full h-56"></canvas>
                                                            </div>
                                                        </div>
                                                    </div>
                </div>

                <div class="bg-white rounded-xl shadow p-6">
                    <h2 class="text-lg font-semibold">ลิงก์ด่วน</h2>
                    <div class="mt-4 flex flex-wrap gap-3">
                        <PrimaryButton @click="$router.push('/check-in')">เช็คชื่อ</PrimaryButton>
                        <PrimaryButton @click="$router.push('/manage-subjects')">จัดการรายวิชา</PrimaryButton>
                        <PrimaryButton @click="$router.push('/summary')">สรุปผล</PrimaryButton>
                    </div>
                </div>
            </div>

            <!-- Right: Subjects list -->
            <div>
                <div class="bg-white rounded-xl shadow p-6">
                    <div class="flex items-center justify-between">
                        <h3 class="text-lg font-semibold">รายวิชา</h3>
                        <button @click="goManageSubjects" class="text-sm text-blue-600 hover:underline">จัดการ</button>
                    </div>

                    <div class="mt-4 space-y-3">
                        <div v-if="subjects.length === 0" class="text-sm text-gray-500">ยังไม่มีรายวิชา</div>
                        <ul>
                            <li v-for="sub in subjects" :key="sub.id" class="p-3 border rounded-md mb-2">
                                <div class="flex justify-between items-center">
                                    <div>
                                        <div class="font-medium">{{ sub.name }}</div>
                                        <div class="text-xs text-gray-500">{{ sub.code }}</div>
                                    </div>
                                    <div class="text-xs text-gray-400">{{ sub.created_at ? new Date(sub.created_at).toLocaleString() : '' }}</div>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </PageLayout>
</template>

<script setup>
import PageLayout from '../src/components/PageLayout.vue'
import PrimaryButton from '../src/components/PrimaryButton.vue'
import Swal from 'sweetalert2'
import axios from 'axios'
import { firestore } from '../src/main.js'
import { collection, getDocs } from 'firebase/firestore'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

import { ref, onMounted, onUnmounted, watch } from 'vue'
import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)
const subjects = ref([])
const subjectsCount = ref(0)
const studentsCount = ref(0)
const todayAttendance = ref(0)
const recent = ref([])
const attendanceChart = ref(null)
const pieChart = ref(null)
const barChart = ref(null)
let chartInstance = null
let pieInstance = null
let barInstance = null

async function loadSubjects() {
    try {
        const q = await getDocs(collection(firestore, 'subjects'))
        subjects.value = q.docs.map(d => ({ id: d.id, ...d.data() }))
        subjectsCount.value = subjects.value.length
    } catch (err) {
        console.error('Failed to load subjects', err)
        subjects.value = []
        subjectsCount.value = 0
    }
}

async function loadStudentsCount() {
    try {
        const res = await axios.get(`${API_BASE_URL}/known-faces`)
        studentsCount.value = res.data.total || (res.data.faces && res.data.faces.length) || 0
    } catch (err) {
        studentsCount.value = 0
    }
}

function goManageSubjects() {
    // navigate to manage subjects
    window.location.href = '/manage-subjects'
}

onMounted(async () => {
    await loadSubjects()
    await loadStudentsCount()
    // placeholder recent
    recent.value = [{ title: 'ระบบพร้อมใช้งาน', time: new Date().toLocaleString() }]

        // create a simple demo 7-day attendance chart
        const ctx = attendanceChart.value && attendanceChart.value.getContext ? attendanceChart.value.getContext('2d') : null
        if (ctx) {
            const labels = Array.from({length:7}).map((_,i)=>{
                const d = new Date(); d.setDate(d.getDate()- (6-i)); return `${d.getMonth()+1}/${d.getDate()}`
            })
            const data = {
                labels,
                datasets: [{
                    label: 'จำนวนผู้เข้าเรียน',
                    data: labels.map(()=> Math.max(0, Math.round(studentsCount.value * (0.6 + Math.random()*0.8)))),
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59,130,246,0.1)',
                    tension: 0.3,
                }]
            }

            chartInstance = new Chart(ctx, {
                type: 'line',
                data,
                options: { responsive: true, maintainAspectRatio: false }
            })
        }

        // pie chart (present vs absent) demo
        const pieCtx = pieChart.value && pieChart.value.getContext ? pieChart.value.getContext('2d') : null
        if (pieCtx) {
            const present = Math.round((studentsCount.value || 0) * 0.85)
            const absent = Math.max(0, (studentsCount.value || 0) - present)
            pieInstance = new Chart(pieCtx, {
                type: 'pie',
                data: {
                    labels: ['มาเรียน', 'ขาดลา'],
                    datasets: [{ data: [present, absent], backgroundColor: ['#10b981','#ef4444'] }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            })
        }

        // bar chart per subject demo
        const barCtx = barChart.value && barChart.value.getContext ? barChart.value.getContext('2d') : null
        if (barCtx) {
            const labels = subjects.value.slice(0,6).map(s=> s.name || s.code || 'ไม่มีชื่อ')
            const dataPoints = labels.map(()=> Math.max(0, Math.round((studentsCount.value||0) * (0.2 + Math.random()*0.8))))
            barInstance = new Chart(barCtx, {
                type: 'bar',
                data: { labels, datasets: [{ label: 'จำนวนผู้เข้าเรียน', data: dataPoints, backgroundColor: '#3b82f6' }] },
                options: { responsive: true, maintainAspectRatio: false }
            })
        }
})

// update demo chart when studentsCount changes
watch(studentsCount, (n)=>{
    if (chartInstance && chartInstance.data && chartInstance.data.datasets) {
        chartInstance.data.datasets[0].data = chartInstance.data.datasets[0].data.map(()=> Math.max(0, Math.round(n * (0.6 + Math.random()*0.8))))
        chartInstance.update()
    }
    if (pieInstance) {
      const present = Math.round((n || 0) * 0.85)
      const absent = Math.max(0, (n || 0) - present)
      pieInstance.data.datasets[0].data = [present, absent]
      pieInstance.update()
    }
    if (barInstance) {
      const labels = subjects.value.slice(0,6).map(s=> s.name || s.code || 'ไม่มีชื่อ')
      const dataPoints = labels.map(()=> Math.max(0, Math.round((n||0) * (0.2 + Math.random()*0.8))))
      barInstance.data.datasets[0].data = dataPoints
      barInstance.update()
    }
})

onUnmounted(()=>{
    try { chartInstance && chartInstance.destroy() } catch(e){}
    try { pieInstance && pieInstance.destroy() } catch(e){}
    try { barInstance && barInstance.destroy() } catch(e){}
})
</script>