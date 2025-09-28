<template>
  <PageLayout>
    <div class="min-h-screen flex items-center justify-center">
      <div class="grid md:grid-cols-2 items-center gap-6 w-full max-w-4xl bg-white rounded-xl shadow p-6">
        <div class="md:max-w-md w-full px-4 py-6">
          <form @submit.prevent="login">
            <div class="mb-6 text-center">
              <h3 class="text-gray-800 text-3xl font-extrabold">เข้าสู่ระบบ</h3>
            </div>

            <div>
              <label class="text-gray-800 text-sm font-medium block mb-2">Email</label>
              <input v-model="email" name="email" type="text" required
                class="w-full text-gray-800 text-sm border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-200 outline-none" placeholder="Email" />
            </div>

            <div class="mt-4">
              <label class="text-gray-800 text-sm font-medium block mb-2">Password</label>
              <input v-model="password" name="password" type="password" required
                class="w-full text-gray-800 text-sm border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-200 outline-none" placeholder="รหัสผ่าน" />
            </div>

            <div class="mt-6">
              <PrimaryButton type="submit" class="w-full">เข้าสู่ระบบ</PrimaryButton>
            </div>
          </form>
        </div>

        <div class="hidden md:block md:h-full bg-blue-900 rounded-xl p-8">
          <img src="https://readymadeui.com/signin-image.webp" class="w-full h-full object-contain" alt="login-image" />
        </div>
      </div>
    </div>
  </PageLayout>
</template>

<script setup>
import { ref } from 'vue'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'
import PageLayout from '../src/components/PageLayout.vue'
import PrimaryButton from '../src/components/PrimaryButton.vue'

const email = ref('')
const password = ref('')
const router = useRouter()

const studentEmail = 'student@cpssmail.com'

function showError(message) {
  Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: message })
}

const login = async () => {
  const auth = getAuth()
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email.value, password.value)
    if (userCredential.user.email === studentEmail) {
      router.push('/student-input-data')
    } else {
      router.push('/')
    }
  } catch (error) {
    console.log(error.code)
    switch (error.code) {
      case 'auth/invalid-email':
        showError('อีเมลไม่ถูกต้อง')
        break
      case 'auth/wrong-password':
        showError('รหัสผ่านไม่ถูกต้อง')
        break
      default:
        showError('อีเมล/รหัสผ่าน ไม่ถูกต้อง')
        break
    }
  }
}
</script>