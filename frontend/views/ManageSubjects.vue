<template>
  <PageLayout>
    <div class="max-w-3xl mx-auto">
      <div class="bg-white rounded-xl shadow p-6">
        <div class="flex items-center justify-between">
                <h1 class="text-2xl font-bold">จัดการรายวิชา</h1>
                <button @click="showAdd" class="text-sm text-blue-600 hover:underline">เพิ่มรายวิชา</button>
              </div>

        <div class="mt-4">
          <div v-if="subjects.length === 0" class="text-sm text-gray-500">ยังไม่มีรายวิชา</div>
          <ul class="space-y-3 mt-3">
            <li v-for="s in subjects" :key="s.id" class="p-3 border rounded-md flex justify-between items-center">
              <div>
                <div class="font-medium">{{ s.name }}</div>
                <div class="text-xs text-gray-500">{{ s.code }} • ครูผู้สอน: <span class="text-sm text-gray-700">{{ s.teacher || '-' }}</span></div>
              </div>
              <div class="flex items-center gap-2">
                <button @click="editSubject(s)" class="text-sm text-yellow-600">แก้ไข</button>
                <button @click="confirmDelete(s)" class="text-sm text-red-600">ลบ</button>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Add/Edit Modal (SweetAlert2 driven) -->
  </PageLayout>
</template>

<script setup>
import PageLayout from '../src/components/PageLayout.vue'
import { ref, onMounted } from 'vue'
import Swal from 'sweetalert2'
import { firestore } from '../src/main.js'
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore'

const subjects = ref([])

async function loadSubjects() {
  try {
    const q = await getDocs(collection(firestore, 'subjects'))
    subjects.value = q.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (err) {
    console.error(err)
    subjects.value = []
  }
}

function showAdd() {
  Swal.fire({
    title: 'เพิ่มรายวิชา',
    html: `<input id="swal-input1" class="swal2-input" placeholder="รหัสวิชา">
             <input id="swal-input2" class="swal2-input" placeholder="ชื่อวิชา">
             <input id="swal-input3" class="swal2-input" placeholder="ครูผู้สอน">`,
    focusConfirm: false,
    preConfirm: () => {
      const code = document.getElementById('swal-input1').value
      const name = document.getElementById('swal-input2').value
      if (!code || !name) {
        Swal.showValidationMessage('กรุณากรอกข้อมูลให้ครบ')
        return false
      }
  const teacher = document.getElementById('swal-input3').value
  return { code, name, teacher }
    }
  }).then(async (result) => {
    if (result.isConfirmed && result.value) {
      try {
        await addDoc(collection(firestore, 'subjects'), {
          code: result.value.code,
          name: result.value.name,
          teacher: result.value.teacher || '',
          created_at: Date.now()
        })
        Swal.fire('เพิ่มแล้ว', '', 'success')
        await loadSubjects()
      } catch (err) {
        console.error(err)
        Swal.fire('เกิดข้อผิดพลาด', '', 'error')
      }
    }
  })
}

function editSubject(s) {
  Swal.fire({
    title: 'แก้ไขรายวิชา',
    html: `<input id="swal-input1" class="swal2-input" value="${s.code}" placeholder="รหัสวิชา">
             <input id="swal-input2" class="swal2-input" value="${s.name}" placeholder="ชื่อวิชา">
             <input id="swal-input3" class="swal2-input" value="${s.teacher || ''}" placeholder="ครูผู้สอน">`,
    focusConfirm: false,
    preConfirm: () => {
      const code = document.getElementById('swal-input1').value
      const name = document.getElementById('swal-input2').value
      if (!code || !name) {
        Swal.showValidationMessage('กรุณากรอกข้อมูลให้ครบ')
        return false
      }
  const teacher = document.getElementById('swal-input3').value
  return { code, name, teacher }
    }
  }).then(async (result) => {
    if (result.isConfirmed && result.value) {
      try {
        const d = doc(firestore, 'subjects', s.id)
  await updateDoc(d, { code: result.value.code, name: result.value.name, teacher: result.value.teacher || '' })
        Swal.fire('บันทึกแล้ว', '', 'success')
        await loadSubjects()
      } catch (err) {
        console.error(err)
        Swal.fire('เกิดข้อผิดพลาด', '', 'error')
      }
    }
  })
}

function confirmDelete(s) {
  Swal.fire({
    title: `ต้องการลบ ${s.name} ?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'ลบ',
    cancelButtonText: 'ยกเลิก'
  }).then(async (r) => {
    if (r.isConfirmed) {
      try {
        await deleteDoc(doc(firestore, 'subjects', s.id))
        Swal.fire('ลบแล้ว', '', 'success')
        await loadSubjects()
      } catch (err) {
        console.error(err)
        Swal.fire('เกิดข้อผิดพลาด', '', 'error')
      }
    }
  })
}

onMounted(loadSubjects)
</script>

