<template>
  <PageLayout>
    <div class="max-w-4xl mx-auto">
      <div class="bg-white rounded-xl shadow p-6">
        <h1 class="text-2xl font-bold">เริ่มการเช็คชื่อ</h1>
        <p class="text-sm text-gray-600 mt-2">กรุณาเลือกรายวิชาที่ต้องการเช็คชื่อ และกล้องสำหรับการตรวจจับแบบเรียลไทม์</p>

        <!-- แสดงสถานะการรองรับเบราว์เซอร์ -->
        <div v-if="!browserSupported" class="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          ⚠️ เบราว์เซอร์ของคุณไม่รองรับการเข้าถึงกล้อง กรุณาใช้ Chrome, Firefox, Safari หรือ Edge เวอร์ชันล่าสุด
        </div>

        <!-- แสดงสถานะ HTTPS -->
        <div v-if="!isSecure" class="mt-4 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
          ⚠️ กรุณาใช้ HTTPS หรือ localhost เพื่อเข้าถึงกล้อง
        </div>

        <div class="mt-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">เลือกรายวิชา</label>
            <select v-model="selectedSubject" class="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
              <option value="">-- เลือกรายวิชา --</option>
              <option v-for="s in subjects" :key="s.id" :value="s.id">{{ s.code }} {{ s.name }}</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">เลือกกล้อง</label>
            <select v-model="selectedDeviceId" class="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" :disabled="loadingDevices">
              <option value="">ใช้กล้องเริ่มต้น</option>
              <option v-for="d in videoDevices" :key="d.deviceId" :value="d.deviceId">
                {{ d.label || `กล้อง ${d.deviceId.slice(0, 8)}...` }}
              </option>
            </select>
            <p v-if="loadingDevices" class="text-sm text-gray-500 mt-1">🔄 กำลังโหลดรายการกล้อง...</p>
          </div>

          <!-- ปุ่มควบคุม -->
          <div class="flex flex-wrap gap-3 mt-4">
            <button 
              @click="startCheckIn" 
              :disabled="isRunning || !selectedSubject || !browserSupported || !isSecure || startingCamera"
              class="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md transition-colors"
            >
              <span v-if="startingCamera">🔄 กำลังเปิดกล้อง...</span>
              <span v-else>📷 เริ่มเช็คชื่อ</span>
            </button>
            
            <button 
              @click="openManual" 
              class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md transition-colors"
            >
              📝 เช็คชื่อด้วยตนเอง
            </button>
            
            <button 
              v-if="isRunning" 
              @click="stopCheckIn" 
              class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              ⏹️ หยุด
            </button>
          </div>

          <!-- แสดงข้อความสถานะ -->
          <div v-if="statusMessage" class="mt-4 p-3 rounded-md" :class="statusMessageClass">
            {{ statusMessage }}
          </div>

          <!-- พื้นที่แสดงกล้อง -->
          <div class="mt-6">
            <div v-if="!isRunning" class="text-sm text-gray-500">
              ยังไม่ได้เริ่มการเช็คชื่อ
            </div>
            
            <!-- Video container -->
            <div class="mt-3 relative" :class="{ 'hidden': !isRunning }">
              <div class="text-sm text-gray-700 mb-2">📹 มุมมองกล้องสด</div>
              
              <div class="relative bg-black rounded-md overflow-hidden">
                <!-- Video element -->
                <video 
                  ref="videoElem" 
                  autoplay 
                  playsinline 
                  muted 
                  class="w-full h-[320px] md:h-[480px] object-cover rounded-md border bg-black"
                  @loadeddata="onVideoLoaded"
                  @error="onVideoError"
                  @playing="onVideoPlaying"
                ></video>
                
                <!-- Overlay สำหรับ loading -->
                <div v-if="isScanning || startingCamera" class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none bg-black/50">
                  <div class="animate-spin rounded-full h-16 w-16 border-4 border-gray-300 border-t-blue-500"></div>
                  <div class="mt-4 text-sm text-white">
                    <span v-if="startingCamera">กำลังเปิดกล้อง...</span>
                    <span v-else>กำลังเตรียมระบบ...</span>
                  </div>
                  <div v-if="currentSubjectLabel" class="text-xs text-blue-300 mt-1">
                    วิชา: {{ currentSubjectLabel }}
                  </div>
                </div>

                <!-- แสดงข้อมูลการทำงาน -->
                <div v-if="isRunning && !isScanning" class="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  🟢 กำลังทำงาน | วิชา: {{ currentSubjectLabel }}
                </div>
              </div>
            </div>

            <!-- Hidden video element เป็น fallback -->
            <video 
              v-if="!videoElem" 
              ref="fallbackVideoElem"
              style="display: none;"
              autoplay 
              playsinline 
              muted
            ></video>
          </div>

          <!-- รายการนักเรียน -->
          <div v-if="isRunning && attendanceList.length > 0" class="mt-6">
            <h3 class="text-lg font-medium mb-3">รายการนักเรียน ({{ attendanceList.length }} คน)</h3>
            <div class="bg-gray-50 rounded-md p-4 max-h-64 overflow-y-auto">
              <div v-for="student in attendanceList" :key="student.id" class="flex items-center justify-between py-2 border-b border-gray-200 last:border-b-0">
                <span class="text-sm">{{ student.name || student.user_id || 'ไม่มีชื่อ' }}</span>
                <div class="flex gap-2">
                  <button 
                    @click="setStatus(student, 'มาเรียน')"
                    :class="student.status === 'มาเรียน' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'"
                    class="px-2 py-1 text-xs rounded"
                  >
                    มาเรียน
                  </button>
                  <button 
                    @click="setStatus(student, 'ขาด')"
                    :class="student.status === 'ขาด' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'"
                    class="px-2 py-1 text-xs rounded"
                  >
                    ขาด
                  </button>
                </div>
              </div>
            </div>
            
            <div class="mt-4 flex gap-3">
              <button 
                @click="saveAttendanceAndFinish"
                class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                💾 บันทึกและเสร็จสิ้น
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </PageLayout>
</template>

<script setup>
import PageLayout from '../src/components/PageLayout.vue'
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import { firestore } from '../src/main.js'
import { collection, getDocs, addDoc } from 'firebase/firestore'

// State variables
const subjects = ref([])
const videoDevices = ref([])
const selectedSubject = ref('')
const selectedDeviceId = ref('')
const isRunning = ref(false)
const videoElem = ref(null)
const fallbackVideoElem = ref(null)
const isScanning = ref(false)
const attendanceList = ref([])
const loadingDevices = ref(false)
const startingCamera = ref(false)

// Status message
const statusMessage = ref('')
const statusType = ref('info')

// Browser compatibility checks
const browserSupported = ref(false)
const isSecure = ref(false)

let stream = null
let videoLoadTimeout = null

// Computed properties
const statusMessageClass = computed(() => {
  const baseClass = 'p-3 rounded-md border '
  switch (statusType.value) {
    case 'success': return baseClass + 'bg-green-100 border-green-400 text-green-700'
    case 'warning': return baseClass + 'bg-yellow-100 border-yellow-400 text-yellow-700'
    case 'error': return baseClass + 'bg-red-100 border-red-400 text-red-700'
    default: return baseClass + 'bg-blue-100 border-blue-400 text-blue-700'
  }
})

const currentSubjectLabel = computed(() => {
  const sel = subjects.value.find(s => s.id === selectedSubject.value)
  return sel ? `${sel.code} ${sel.name}` : ''
})

// Utility functions
function setStatusMessage(message, type = 'info', duration = 5000) {
  statusMessage.value = message
  statusType.value = type
  if (duration > 0) {
    setTimeout(() => {
      statusMessage.value = ''
    }, duration)
  }
}

function checkBrowserSupport() {
  browserSupported.value = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
  isSecure.value = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1'
}

// ฟังก์ชันสำหรับหา video element ที่พร้อมใช้งาน
function getVideoElement() {
  if (videoElem.value) {
    return videoElem.value
  }
  
  if (fallbackVideoElem.value) {
    return fallbackVideoElem.value
  }
  
  const video = document.createElement('video')
  video.autoplay = true
  video.playsInline = true
  video.muted = true
  return video
}

async function ensureVideoElement() {
  await nextTick()
  
  return new Promise((resolve) => {
    const checkElement = () => {
      const element = getVideoElement()
      if (element) {
        resolve(element)
      } else {
        setTimeout(checkElement, 100)
      }
    }
    checkElement()
  })
}

async function requestPermissions() {
  try {
    const tempStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    tempStream.getTracks().forEach(track => track.stop())
    return true
  } catch (e) {
    console.log('Permission request failed:', e)
    return false
  }
}

async function enumerateCameras() {
  if (!browserSupported.value) return
  
  try {
    loadingDevices.value = true
    
    await requestPermissions()
    
    const devices = await navigator.mediaDevices.enumerateDevices()
    videoDevices.value = devices.filter(d => d.kind === 'videoinput')
    
    console.log('Found video devices:', videoDevices.value)
  } catch (e) {
    console.error('Error enumerating devices:', e)
    setStatusMessage('ไม่สามารถโหลดรายการกล้องได้', 'warning')
  } finally {
    loadingDevices.value = false
  }
}

async function loadSubjects() {
  try {
    const q = await getDocs(collection(firestore, 'subjects'))
    subjects.value = q.docs.map(d => ({ id: d.id, ...d.data() }))
    
    if (subjects.value.length > 0) {
      selectedSubject.value = subjects.value[0].id
    }
    
    console.log('Loaded subjects:', subjects.value)
  } catch (e) {
    console.error('Error loading subjects:', e)
    setStatusMessage('ไม่สามารถโหลดรายวิชาได้ ตรวจสอบการเชื่อมต่อฐานข้อมูล', 'error')
  }
}

async function startCheckIn() {
  if (!browserSupported.value || !isSecure.value || !selectedSubject.value) return
  
  try {
    startingCamera.value = true
    isScanning.value = true
    setStatusMessage('กำลังเริ่มระบบเช็คชื่อ...', 'info', 0)
    
    // รอให้ video element พร้อมก่อน
    console.log('Ensuring video element is ready...')
    const videoElement = await ensureVideoElement()
    console.log('Video element ready:', videoElement)
    
    // Load attendance roster
    await loadAttendanceRoster()
    
    // Start camera
    await startCameraWithFallback(videoElement)
    
    isRunning.value = true
    setStatusMessage('✅ ระบบเช็คชื่อพร้อมใช้งาน', 'success')
    
  } catch (e) {
    console.error('Failed to start check-in:', e)
    setStatusMessage(`❌ ไม่สามารถเริ่มเช็คชื่อได้: ${e.message}`, 'error')
  } finally {
    startingCamera.value = false
    isScanning.value = false
  }
}

async function startCameraWithFallback(videoElement) {
  if (!videoElement) {
    throw new Error('Video element not available after ensuring')
  }

  const strategies = []
  
  // Strategy 1: Use selected device with exact deviceId
  if (selectedDeviceId.value) {
    strategies.push({
      video: {
        deviceId: { exact: selectedDeviceId.value },
        width: { ideal: 640 },
        height: { ideal: 480 },
        frameRate: { ideal: 15 }
      }
    })
  }
  
  // Strategy 2: Use selected device with ideal deviceId
  if (selectedDeviceId.value) {
    strategies.push({
      video: {
        deviceId: { ideal: selectedDeviceId.value },
        width: { ideal: 640 },
        height: { ideal: 480 }
      }
    })
  }
  
  // Strategy 3: Use default camera
  strategies.push({
    video: {
      width: { ideal: 640 },
      height: { ideal: 480 },
      frameRate: { ideal: 15 }
    }
  })
  
  // Strategy 4: Basic video only
  strategies.push({ video: true })
  
  let lastError = null
  
  for (let i = 0; i < strategies.length; i++) {
    try {
      console.log(`Trying camera strategy ${i + 1}:`, strategies[i])
      
      stream = await navigator.mediaDevices.getUserMedia(strategies[i])
      
      videoElement.srcObject = stream
      await waitForVideoReady(videoElement)
      
      console.log('Camera started successfully with strategy', i + 1)
      return
      
    } catch (e) {
      console.log(`Strategy ${i + 1} failed:`, e)
      lastError = e
      
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
        stream = null
      }
      
      continue
    }
  }
  
  throw new Error(lastError?.message || 'ไม่สามารถเปิดกล้องได้')
}

async function waitForVideoReady(videoElement) {
  return new Promise((resolve, reject) => {
    if (!videoElement) {
      reject(new Error('Video element not provided'))
      return
    }
    
    let resolved = false
    
    const cleanup = () => {
      videoElement.removeEventListener('loadeddata', onLoaded)
      videoElement.removeEventListener('error', onError)
      if (videoLoadTimeout) {
        clearTimeout(videoLoadTimeout)
        videoLoadTimeout = null
      }
    }
    
    const onLoaded = () => {
      if (!resolved) {
        resolved = true
        cleanup()
        
        videoElement.play().then(() => {
          resolve()
        }).catch((playError) => {
          console.log('Auto-play failed (expected in some browsers):', playError)
          resolve()
        })
      }
    }
    
    const onError = (e) => {
      if (!resolved) {
        resolved = true
        cleanup()
        reject(new Error('Video loading failed: ' + e.message))
      }
    }
    
    videoElement.addEventListener('loadeddata', onLoaded)
    videoElement.addEventListener('error', onError)
    
    videoLoadTimeout = setTimeout(() => {
      if (!resolved) {
        resolved = true
        cleanup()
        reject(new Error('Video loading timeout'))
      }
    }, 10000)
    
    if (videoElement.readyState >= 2) {
      onLoaded()
    }
  })
}

async function loadAttendanceRoster() {
  try {
    const sel = subjects.value.find(s => s.id === selectedSubject.value)
    if (!sel) throw new Error('ไม่พบข้อมูลวิชาที่เลือก')
    
    const collectionName = (sel.code || selectedSubject.value).replace(/\//g, '-')
    const q = await getDocs(collection(firestore, collectionName))
    
    attendanceList.value = q.docs.map(d => ({
      id: d.id,
      ...d.data(),
      status: 'ขาด'
    }))
    
    console.log('Loaded attendance roster:', attendanceList.value.length, 'students')
    
  } catch (e) {
    console.error('Error loading attendance roster:', e)
    attendanceList.value = []
  }
}

function stopCheckIn() {
  try {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      stream = null
    }
    
    const videoElement = getVideoElement()
    if (videoElement) {
      videoElement.srcObject = null
    }
    
  } catch (e) {
    console.error('Error stopping camera:', e)
  }
  
  isRunning.value = false
  isScanning.value = false
  startingCamera.value = false
  setStatusMessage('ระบบเช็คชื่อหยุดทำงานแล้ว', 'info')
}

function openManual() {
  window.location.href = '/student-input-data'
}

function setStatus(student, status) {
  const idx = attendanceList.value.findIndex(x => x.id === student.id)
  if (idx !== -1) {
    attendanceList.value[idx].status = status
    setStatusMessage(`✅ อัพเดทสถานะ: ${student.name || student.user_id} - ${status}`, 'success', 2000)
  }
}

async function saveAttendanceAndFinish() {
  try {
    const sel = subjects.value.find(s => s.id === selectedSubject.value)
    if (!sel) throw new Error('ไม่พบข้อมูลวิชา')
    
    const subjectCode = (sel.code || selectedSubject.value).replace(/\//g, '-')
    const payload = {
      subject: subjectCode,
      subjectName: `${sel.code} ${sel.name}`,
      timestamp: Date.now(),
      date: new Date().toISOString().split('T')[0],
      records: attendanceList.value.map(x => ({
        id: x.id,
        name: x.name || x.user_id || x.title || 'ไม่มีชื่อ',
        status: x.status || 'ขาด'
      }))
    }
    
    await addDoc(collection(firestore, 'attendance'), payload)
    
    setStatusMessage('✅ บันทึกการเช็คชื่อเรียบร้อยแล้ว', 'success')
    
    setTimeout(() => {
      stopCheckIn()
    }, 2000)
    
  } catch (e) {
    console.error('Error saving attendance:', e)
    setStatusMessage(`❌ บันทึกไม่สำเร็จ: ${e.message}`, 'error')
  }
}

// Event handlers
function onVideoLoaded() {
  console.log('Video loaded successfully')
}

function onVideoError(e) {
  console.error('Video error:', e)
  setStatusMessage('❌ เกิดข้อผิดพลาดในการแสดงวิดีโอ', 'error')
}

function onVideoPlaying() {
  console.log('Video started playing')
  if (isScanning.value) {
    setTimeout(() => {
      isScanning.value = false
    }, 500)
  }
}

// Watch for device changes
watch(selectedDeviceId, async (newId, oldId) => {
  if (!isRunning.value || newId === oldId) return
  
  try {
    setStatusMessage('กำลังเปลี่ยนกล้อง...', 'info', 0)
    isScanning.value = true
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      stream = null
    }
    
    const videoElement = getVideoElement()
    await startCameraWithFallback(videoElement)
    setStatusMessage('✅ เปลี่ยนกล้องเรียบร้อย', 'success')
    
  } catch (e) {
    console.error('Error switching camera:', e)
    setStatusMessage(`❌ ไม่สามารถเปลี่ยนกล้องได้: ${e.message}`, 'error')
  } finally {
    isScanning.value = false
  }
})

// Lifecycle
onMounted(async () => {
  console.log('Component mounted')
  
  checkBrowserSupport()
  
  if (browserSupported.value && isSecure.value) {
    await loadSubjects()
    await enumerateCameras()
    setStatusMessage('ระบบพร้อมใช้งาน', 'success')
  } else {
    setStatusMessage('เบราว์เซอร์หรือสภาพแวดล้อมไม่รองรับ', 'error', 0)
  }
  
  await nextTick()
  console.log('Video element after mount:', videoElem.value)
})

onUnmounted(() => {
  stopCheckIn()
})
</script>

<style scoped>
.transition-colors {
  transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out;
}

.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
