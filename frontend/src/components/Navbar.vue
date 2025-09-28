
<template>
	<nav class="bg-white border-b border-gray-200">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between h-16">
				<div class="flex items-center">
					<router-link to="/" class="flex items-center space-x-2" @click="closeMenu">
						<img src="/vite.svg" alt="logo" class="h-8 w-8" />
						<span class="text-lg font-semibold text-gray-800">ระบบเช็คชื่อนักเรียนอัจฉริยะ</span>
					</router-link>
				</div>

				<div class="hidden md:flex md:items-center md:space-x-6">
			    <router-link to="/" class="text-gray-700 hover:text-blue-600" @click="closeMenu">หน้าหลัก</router-link>
					  <router-link to="/check-in" class="text-gray-700 hover:text-blue-600" @click="closeMenu">เช็คชื่อ</router-link>
					  <router-link to="/manage-subjects" class="text-gray-700 hover:text-blue-600" @click="closeMenu">จัดการรายวิชา</router-link>
					  <router-link to="/summary" class="text-gray-700 hover:text-blue-600" @click="closeMenu">สรุปผล</router-link>
					  <router-link to="/report" class="text-gray-700 hover:text-blue-600" @click="closeMenu">รายงาน</router-link>
					<button @click="onLogout" class="text-red-600 hover:text-red-800">ออกจากระบบ</button>
				</div>

				<!-- Mobile menu button -->
				<div class="flex items-center md:hidden">
					<button @click="toggleMenu" aria-label="Toggle menu" class="p-2 rounded-md text-gray-700 hover:bg-gray-100">
						<font-awesome-icon :icon="menuOpen ? ['fas','times'] : ['fas','bars']" />
					</button>
				</div>
			</div>
		</div>

		<!-- Mobile Menu -->
		<div v-show="menuOpen" class="md:hidden">
			<div class="px-2 pt-2 pb-3 space-y-1 sm:px-3">
			<router-link to="/" class="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50" @click="closeMenu">หน้าหลัก</router-link>
			<router-link to="/check-in" class="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50" @click="closeMenu">เช็คชื่อ</router-link>
			<router-link to="/manage-subjects" class="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50" @click="closeMenu">จัดการรายวิชา</router-link>
			<router-link to="/summary" class="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50" @click="closeMenu">สรุปผล</router-link>
			<router-link to="/report" class="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50" @click="closeMenu">รายงาน</router-link>
						<div class="flex gap-2 px-3 py-2">
							<button @click="onLogout" class="w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-gray-50">ออกจากระบบ</button>
						</div>
			</div>
		</div>
	</nav>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import Swal from 'sweetalert2';
import { getAuth, signOut } from 'firebase/auth';

const menuOpen = ref(false);
const router = useRouter();
// ...existing code...

function toggleMenu() {
	menuOpen.value = !menuOpen.value;
}

function closeMenu() {
	menuOpen.value = false;
}

// dark-mode toggle removed

async function onLogout() {
	try {
		const result = await Swal.fire({
			title: 'ออกจากระบบ',
			text: 'คุณแน่ใจหรือไม่ว่าต้องการออกจากระบบ?',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: 'ใช่, ออกจากระบบ',
			cancelButtonText: 'ยกเลิก',
		});

		if (result.isConfirmed) {
			const auth = getAuth();
			await signOut(auth);
			await Swal.fire('ออกจากระบบแล้ว', 'คุณได้ออกจากระบบเรียบร้อยแล้ว', 'success');
			router.push({ name: 'login' });
		}
	} catch (error) {
		console.error('Logout error', error);
		Swal.fire('เกิดข้อผิดพลาด', error.message || 'ไม่สามารถออกจากระบบได้', 'error');
	} finally {
		closeMenu();
	}
}
</script>

<!-- No component-scoped CSS; Tailwind utility classes used -->
