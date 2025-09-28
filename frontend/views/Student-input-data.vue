<template>
  <PageLayout>
    <div class="w-full max-w-3xl mx-auto">
      <div class="bg-white rounded-2xl shadow p-6 sm:p-8 border border-gray-100">
        <!-- Header -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
            <span class="text-2xl">🎭</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
            Face Recognition System
          </h1>
          <p class="text-sm text-gray-600">อัปโหลดรูปภาพเพื่อบันทึกข้อมูลใบหน้า</p>
        </div>
  <!-- Form -->
  <form @submit.prevent="handleSubmit" class="space-y-6">
            <div class="space-y-2">
            <label class="block text-sm font-semibold text-gray-700">
              <span class="flex items-center gap-2">👤 ชื่อ-นามสกุล <span class="text-red-500">*</span></span>
            </label>
            <input v-model="name" type="text" required
              class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 bg-white/70 backdrop-blur"/>
          </div>
            <div class="space-y-2">
            <label class="block text-sm font-semibold text-gray-700">
              <span class="flex items-center gap-2">🆔 รหัสประจำตัว <span class="text-red-500">*</span></span>
            </label>
            <input v-model="user_id" type="text" required
              class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 bg-white/70 backdrop-blur"/>
          </div>
            <div class="space-y-2">
            <label class="block text-sm font-semibold text-gray-700">
              <span class="flex items-center gap-2">🏫 ห้อง (ระดับชั้น) <span class="text-red-500">*</span></span>
            </label>
            <input v-model="room" type="text" required placeholder="ไม่ต้องพิมพ์/ให้เขียนติดกันเลย เช่น 611, 614"
              class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 bg-white/70 backdrop-blur"/>
          </div>
            <div class="space-y-2">
            <label class="block text-sm font-semibold text-gray-700">
              <span class="flex items-center gap-2">📷 รูปภาพใบหน้า <span class="text-red-500">*</span></span>
            </label>
            <div class="relative border-2 border-dashed border-gray-300 rounded-xl p-6 text-center bg-white/50"
              :class="{ 'border-blue-500 bg-blue-50': dragOver }"
              @dragover.prevent="dragOver = true" @dragleave="dragOver = false" @drop="onDrop">
              <input ref="fileInput" @change="onFileChange" type="file"
                accept="image/jpeg,image/jpg,image/png" required class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"/>
              <div class="pointer-events-none">
                <div class="text-4xl mb-2">📁</div>
                <p class="text-sm text-gray-600 mb-1"><span class="font-semibold text-blue-600">คลิกเพื่อเลือกไฟล์</span> หรือลากไฟล์มาวาง</p>
                <p class="text-xs text-gray-500">รองรับ: JPG, JPEG, PNG | ขนาดสูงสุด: 10MB</p>
              </div>
            </div>
          </div>
            <div v-if="previewUrl" class="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
            <div class="flex justify-between items-center mb-2">
              <p class="text-sm font-semibold text-gray-700 flex items-center gap-2">🖼️ ตัวอย่างรูปภาพ</p>
              <button type="button" @click="removeFile"
                class="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">✕</button>
            </div>
            <img :src="previewUrl" alt="รูปตัวอย่าง" class="w-full max-w-xs mx-auto rounded-lg shadow-md border border-gray-200"/>
          </div>
          <PrimaryButton type="submit" class="w-full" ref="submitBtn">
            <span class="flex items-center justify-center gap-2">
              <span class="text-lg">📤</span>
              อัปโหลดและบันทึกข้อมูล
            </span>
          </PrimaryButton>
        </form>

        <!-- Additional Buttons -->
        <div class="mt-6 space-y-3">
          <!-- ** NEW: Show Known Faces Button ** -->
          <PrimaryButton @click="showKnownFaces" ref="showFacesButton">👥 ดูรายชื่อที่บันทึกแล้ว</PrimaryButton>

          <!-- Others (e.g., Recognize Button) -->
          <!-- <button type="button" id="recognizeBtn" class="w-full py-3 px-6 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-200">...</button> -->
        </div>

        <!-- Footer -->
        <div class="mt-8 pt-6 border-t border-gray-200/50">
          <p class="text-center text-xs text-gray-500">
            ระบบปกป้องข้อมูลส่วนบุคคลตามมาตรฐาน PDPA
          </p>
        </div>
      </div>
    </div>
  </PageLayout>
</template>

<script setup>
import { ref } from 'vue'
import Swal from 'sweetalert2'
import axios from 'axios'
import PageLayout from '../src/components/PageLayout.vue'
import PrimaryButton from '../src/components/PrimaryButton.vue'
import { firestore } from '../src/main.js'
import { doc, setDoc } from 'firebase/firestore'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000' // ตรวจสอบ URL ของ Backend คุณ

const name = ref('')
const user_id = ref('')
const room = ref('')
const fileInput = ref(null)
const file = ref(null)
const previewUrl = ref('')
const dragOver = ref(false)
const showFacesButton = ref(null) // Ref for the button to manage loading state
const submitBtn = ref(null)

function showAlert(message, type='info') {
  Swal.fire({
    text: message,
    icon: type,
    confirmButtonText: 'ตกลง',
    customClass: {
      confirmButton: 'gradient-button !bg-none px-6 py-2 text-white font-semibold rounded-lg',
      popup: 'rounded-2xl'
    },
    buttonsStyling: false
  })
}

function onFileChange(e) {
  const f = e.target.files && e.target.files[0]
  if (f) {
    if (!['image/jpeg','image/jpg','image/png'].includes(f.type)) {
      showAlert('ประเภทไฟล์ไม่ถูกต้อง\n\nกรุณาเลือกไฟล์ JPG, JPEG หรือ PNG เท่านั้น', 'error');
      resetFileInput();
      return;
    }
    if (f.size > 10*1024*1024) { // 10MB limit
      showAlert('ขนาดไฟล์ใหญ่เกินไป\n\nขนาดต้องไม่เกิน 10MB', 'error');
      resetFileInput();
      return;
    }
    file.value = f
    previewUrl.value = URL.createObjectURL(f)
  } else {
    file.value = null
    previewUrl.value = ''
  }
}

function removeFile() {
  file.value = null
  previewUrl.value = ''
  resetFileInput()
}

function resetFileInput() {
  if (fileInput.value) {
    fileInput.value.value = '' // Reset the file input element
  }
}

function onDrop(e) {
  dragOver.value = false
  e.preventDefault()
  const files = e.dataTransfer.files
  if (files && files[0]) {
    // Update the file input's files property if available
    if (fileInput.value) fileInput.value.files = files
    onFileChange({ target: { files: files } })
  }
}

// Function to manage loading state for buttons
const setLoading = (buttonRef, isLoading, loadingText = 'กำลังประมวลผล...') => {
  // Accept: template ref to component (with $el), template ref to DOM element, or a DOM element
  if (!buttonRef) return;
  let el = null;
  // If it's a Vue ref object
  if (buttonRef.value !== undefined) {
    const val = buttonRef.value;
    // component instance exposes $el
    el = val && val.$el ? val.$el : val;
  } else {
    // direct element
    el = buttonRef;
  }
  if (!el) return;

  if (isLoading) {
    el.disabled = true;
    el.setAttribute('data-original-html', el.innerHTML || '');
    el.innerHTML = `
      <span class="flex items-center justify-center gap-2">
        <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spinner"></div>
        ${loadingText}
      </span>`;
  } else {
    el.disabled = false;
    const originalHTML = el.getAttribute && el.getAttribute('data-original-html');
    if (originalHTML) {
      el.innerHTML = originalHTML;
    }
  }
};


// ** NEW: Function to show known faces **
async function showKnownFaces() {
  setLoading(showFacesButton, true, 'กำลังโหลด...'); // Show loading on the button

  try {
    const response = await axios.get(`${API_BASE_URL}/known-faces`);
    const faces = response.data.faces;

    if (faces && faces.length > 0) {
      const faceList = faces.map((face, index) =>
        `${index + 1}. ${face.name} (รหัส: ${face.id})` // Assuming backend returns `name` and `id`
      ).join('\n');

      showAlert(
        `👥 รายชื่อที่บันทึกในระบบ (${faces.length} คน):\n\n${faceList}`,
        'info'
      );
    } else {
      showAlert('📭 ยังไม่มีข้อมูลใบหน้าในระบบ\n\nกรุณาอัปโหลดข้อมูลใบหน้าก่อน', 'info');
    }
  } catch (error) {
    console.error('Error fetching known faces:', error);
    let errorMessage = '❌ ไม่สามารถดึงข้อมูลได้';
    if (error.response && error.response.data?.detail) {
        errorMessage = error.response.data.detail;
    } else if (error.request) {
        errorMessage = '🌐 ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้\n\nกรุณาตรวจสอบ URL API และการเชื่อมต่ออินเทอร์เน็ต';
    } else if (error.message) {
        errorMessage = error.message;
    }
    showAlert(errorMessage, 'error');
  } finally {
    setLoading(showFacesButton, false); // Hide loading on the button
  }
}

async function handleSubmit() {
  // Validation
  if (name.value.trim().length < 2) {
    showAlert('กรุณากรอกชื่อ-นามสกุล (อย่างน้อย 2 ตัวอักษร)', 'error');
    return;
  }
  if (user_id.value.trim() === '') {
    showAlert('กรุณากรอกรหัสประจำตัว', 'error');
    return;
  }
  if (room.value.trim() === '') {
    showAlert('กรุณากรอกห้อง (ระดับชั้น)', 'error');
    return;
  }
  if (!file.value) {
    showAlert('กรุณาเลือกไฟล์รูปภาพ', 'error');
    return;
  }

  // Prepare FormData
  const formData = new FormData()
  formData.append('name', name.value)
  formData.append('user_id', user_id.value)
  formData.append('room', room.value)
  formData.append('image', file.value)

  // Disable submit button and show loading indicator - prefer component ref when available
  let submitElement = null;
  if (submitBtn && submitBtn.value) {
    submitElement = submitBtn.value.$el ? submitBtn.value.$el : submitBtn.value;
  } else if (typeof document !== 'undefined') {
    submitElement = document.getElementById('submitBtn') || document.querySelector('button[type="submit"]');
  }

  if (submitElement) {
    const originalHTML = submitElement.innerHTML;
    submitElement.disabled = true;
    submitElement.innerHTML = `<div class="flex items-center justify-center gap-2">
                                <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spinner"></div>
                                กำลังประมวลผล...
                              </div>`;
    submitElement.setAttribute('data-original-html', originalHTML); // Store original HTML for restoration
  }

  try {
    // Send to server
    const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000 // 60 seconds timeout recommended for image processing
    });

    // Success
    let successMessage = response.data.message || 'อัปโหลดและประมวลผลข้อมูลสำเร็จ!'

    // If backend returned encoding, save to Firestore under collection = room, doc id = user_id
    if (response.data.encoding) {
      try {
        const collectionName = room.value || 'unknown_room'
        const documentId = user_id.value || response.data.id || Date.now().toString()
        const docRef = doc(firestore, collectionName, documentId)
        await setDoc(docRef, {
          name: name.value,
          id: documentId,
          room: room.value,
          encoding: response.data.encoding,
          created_at: new Date().toISOString()
        })
        successMessage += '\nบันทึกข้อมูลไปยัง Firestore แล้ว'
      } catch (err) {
        console.error('Firestore save error:', err)
        showAlert('อัปโหลดสำเร็จ แต่ไม่สามารถบันทึกลง Firestore ได้', 'warning')
      }
    }

    showAlert(successMessage, 'success');

    // Reset form
    name.value = ''
    user_id.value = ''
    room.value = ''
    removeFile()

  } catch (err) {
    console.error('Upload error:', err);
    let errorMessage = 'เกิดข้อผิดพลาดในการอัปโหลด';
    if (err.response && err.response.data?.detail) {
        errorMessage = err.response.data.detail;
    } else if (err.request) {
        errorMessage = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้\n\nกรุณาตรวจสอบ URL API และการเชื่อมต่ออินเทอร์เน็ต';
    } else if (err.message) {
        errorMessage = err.message;
    }
    showAlert(errorMessage, 'error');
  } finally {
    // Re-enable submit button
    if (submitElement) {
      submitElement.disabled = false;
      const originalHTML = submitElement.getAttribute('data-original-html');
      if (originalHTML) {
        submitElement.innerHTML = originalHTML;
      } else {
        // Fallback
        submitElement.innerHTML = `<span class="flex items-center justify-center gap-2">
              <span class="text-lg">📤</span>
              อัปโหลดและบันทึกข้อมูล
            </span>`;
      }
    }
  }
}

</script>

<style scoped>
.gradient-bg {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.gradient-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.gradient-button:hover {
  background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
}
.glass-effect {
  backdrop-filter: blur(10px);
  background: rgba(255,255,255,0.95);
}
.spinner {
    animation: spin 1s linear infinite;
}
@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
</style>