<template>
  <PageLayout>
    <div class="max-w-4xl mx-auto">
      <div class="bg-white rounded-xl shadow p-6">
        <h1 class="text-2xl font-bold">เริ่มการเช็คชื่อ</h1>
        <p class="text-sm text-gray-600 mt-2">กรุณาเลือกรายวิชาที่ต้องการเช็คชื่อ และกล้องสำหรับการตรวจจับแบบเรียลไทม์</p>

        <div class="mt-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">เลือกรายวิชา</label>
            <select v-model="selectedSubject" class="mt-2 block w-full rounded-md border-gray-300 shadow-sm">
              <option v-for="s in subjects" :key="s.id" :value="s.id">{{ s.code }} {{ s.name }}</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">เลือกกล้อง</label>
            <select v-model="selectedDeviceId" class="mt-2 block w-full rounded-md border-gray-300 shadow-sm">
              <option value="">ใช้กล้องเริ่มต้น</option>
              <option v-for="d in videoDevices" :key="d.deviceId" :value="d.deviceId">{{ d.label || d.deviceId }}</option>
            </select>
          </div>

          <div class="flex gap-3 mt-4">
            <button @click="startCheckIn" :disabled="isRunning || !selectedSubject" class="bg-blue-600 text-white px-4 py-2 rounded-md">📷 เริ่มเช็คชื่อ</button>
            <button @click="openManual" class="bg-gray-200 text-gray-800 px-4 py-2 rounded-md">📝 เช็คชื่อ/แก้ไข ด้วยตนเอง</button>
            <button v-if="isRunning" @click="stopCheckIn" class="bg-red-600 text-white px-4 py-2 rounded-md">หยุด</button>
          </div>

          <div class="mt-6">
            <div v-if="!isRunning" class="text-sm text-gray-500">ยังไม่ได้เริ่มการเช็คชื่อ</div>
            <div v-if="isRunning" class="mt-3 relative">
              <div class="text-sm text-gray-700 mb-2">มุมมองกล้องสด</div>
              <div class="relative bg-black rounded-md overflow-hidden">
                <video ref="videoElem" autoplay playsinline muted class="w-full h-[480px] md:h-[640px] object-cover rounded-md border bg-black"></video>
                <!-- scanning overlay -->
                <div v-if="isScanning" class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <div class="animate-spin rounded-full h-16 w-16 border-4 border-gray-300 border-t-transparent"></div>
                  <div class="mt-4 text-sm text-white/90">กำลังสแกน... | วิชา: <span class="text-blue-400">{{ currentSubjectLabel }}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </PageLayout>
</template>

<script setup>
import PageLayout from '../src/components/PageLayout.vue'
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { firestore } from '../src/main.js'
import { collection, getDocs } from 'firebase/firestore'

const subjects = ref([])
const videoDevices = ref([])
const selectedSubject = ref('')
const selectedDeviceId = ref('')
const isRunning = ref(false)
const videoElem = ref(null)
let stream = null
const isScanning = ref(false)
const attendanceList = ref([])

import { addDoc, collection as collRef } from 'firebase/firestore'
import { watch } from 'vue'

async function loadSubjects() {
  try {
    const q = await getDocs(collection(firestore, 'subjects'))
    subjects.value = q.docs.map(d => ({ id: d.id, ...d.data() }))
    if (subjects.value.length) selectedSubject.value = subjects.value[0].id
  } catch (e) {
    console.error('load subjects', e)
  }
}

async function enumerateCameras() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    videoDevices.value = devices.filter(d => d.kind === 'videoinput')
  } catch (e) {
    console.error('enumerate devices', e)
  }
}

async function startCheckIn() {
  try {
    // show scanning overlay immediately
    isScanning.value = true

    // Prefer a moderate resolution to speed up camera start and reduce bandwidth
    const baseVideo = { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 15 } }
    const constraints = selectedDeviceId.value
      ? { video: { deviceId: { exact: selectedDeviceId.value }, ...baseVideo } }
      : { video: baseVideo }

    stream = await navigator.mediaDevices.getUserMedia(constraints)
    if (videoElem.value) {
      // attach stream and wait for the video to start playing before hiding the overlay
      videoElem.value.srcObject = stream
      console.log('attached stream to video element', videoElem.value)
      // try to play (may require user gesture in some browsers)
      try { await videoElem.value.play() } catch (e) { /* ignore */ }
    }

    // mark running
    isRunning.value = true

    // refresh device labels now that we have permission (helps show human friendly names)
    try { await enumerateCameras() } catch(e) {}

    // load roster from Firestore: try to use subject.code as collection name
    try {
      const sel = subjects.value.find(s=> s.id === selectedSubject.value)
      const collectionName = (sel && sel.code) ? String(sel.code) : selectedSubject.value
      // normalize collection name: replace slashes
      const collNameSafe = collectionName.replace(/\//g, '-')
      const q = await getDocs(collRef(firestore, collNameSafe))
      attendanceList.value = q.docs.map(d => ({ id: d.id, ...d.data(), status: 'มาเรียน' }))
    } catch (e) {
      console.error('load roster for checkin', e)
      attendanceList.value = []
    }

    // Wait until the video is actually playing (or timeout) then hide the scanning overlay.
    if (videoElem.value) {
      const waitForPlaying = new Promise((resolve) => {
        let settled = false
        const onPlay = () => { if (!settled) { settled = true; cleanup(); resolve(true) } }
        const cleanup = () => {
          videoElem.value && videoElem.value.removeEventListener('playing', onPlay)
        }
        videoElem.value.addEventListener('playing', onPlay)
        // fallback timeout
        setTimeout(() => { if (!settled) { settled = true; cleanup(); resolve(false) } }, 2500)
      })
      try { await waitForPlaying } catch(e){}
      isScanning.value = false
    } else {
      isScanning.value = false
    }

    // In a real setup, you'd process frames and mark recognized students automatically.
  } catch (e) {
    console.error('start camera', e)
    alert('ไม่สามารถเข้าถึงกล้องได้: ' + (e.message || e))
  }
}

function stopCheckIn() {
  try {
    if (stream) {
      stream.getTracks().forEach(t => t.stop())
      stream = null
    }
  } catch (e) {}
  isRunning.value = false
  isScanning.value = false
}

function openManual() {
  // navigate to manual student check page
  window.location.href = '/student-input-data'
}

onMounted(async () => {
  await loadSubjects()
  await enumerateCameras()
})

// restart camera if device changes while running
watch(selectedDeviceId, async (id, old) => {
  if (!isRunning.value) return
  try {
    // show overlay while switching
    isScanning.value = true
    // stop existing
    if (stream) { stream.getTracks().forEach(t=>t.stop()); stream = null }
    const baseVideo = { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 15 } }
    const constraints = id ? { video: { deviceId: { exact: id }, ...baseVideo } } : { video: baseVideo }
    stream = await navigator.mediaDevices.getUserMedia(constraints)
    if (videoElem.value) {
      videoElem.value.srcObject = stream
      try { await videoElem.value.play() } catch(e){}
    }
    // refresh labels
    try { await enumerateCameras() } catch(e){}
    // hide overlay when playing
    if (videoElem.value) {
      const onPlay = () => { isScanning.value = false; videoElem.value && videoElem.value.removeEventListener('playing', onPlay) }
      videoElem.value.addEventListener('playing', onPlay)
      setTimeout(()=>{ isScanning.value = false }, 2000)
    } else { isScanning.value = false }
  } catch (e) {
    console.error('restart camera', e)
  }
})

onUnmounted(()=>{
  stopCheckIn()
})

const currentSubjectLabel = computed(()=>{
  const sel = subjects.value.find(s=> s.id === selectedSubject.value)
  return sel ? `${sel.code} ${sel.name}` : ''
})


// attendance actions
function setStatus(student, status) {
  const idx = attendanceList.value.findIndex(x=> x.id === student.id)
  if (idx !== -1) attendanceList.value[idx].status = status
}

async function saveAttendanceAndFinish() {
  try {
    const sel = subjects.value.find(s=> s.id === selectedSubject.value)
    const subjectCode = (sel && sel.code) ? String(sel.code).replace(/\//g,'-') : selectedSubject.value
    const payload = {
      subject: subjectCode,
      subjectName: sel ? `${sel.code} ${sel.name}` : subjectCode,
      timestamp: Date.now(),
      records: attendanceList.value.map(x=> ({ id: x.id, name: x.name || x.user_id || x.title || '', status: x.status || 'ขาด' }))
    }
    await addDoc(collRef(firestore, 'attendance'), payload)
    alert('บันทึกและเสร็จสิ้น')
    stopCheckIn()
  } catch (e) {
    console.error('save attendance', e)
    alert('บันทึกไม่สำเร็จ: ' + (e.message || e))
  }
}

</script>
