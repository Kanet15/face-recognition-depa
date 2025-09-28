<template>
    <PageLayout>
        <div class="bg-white rounded-xl shadow p-6">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-2xl font-bold">รายงาน</h1>
                    <p class="text-sm text-gray-500">สรุปเหตุการณ์และประวัติการตรวจจับใบหน้า</p>
                </div>
                <PrimaryButton @click="exportReport">ส่งออก</PrimaryButton>
            </div>

            <div class="mt-6">
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-4 py-2 text-left text-sm font-medium text-gray-500">วันที่</th>
                                <th class="px-4 py-2 text-left text-sm font-medium text-gray-500">ชื่อ</th>
                                <th class="px-4 py-2 text-left text-sm font-medium text-gray-500">สถานะ</th>
                                <th class="px-4 py-2 text-left text-sm font-medium text-gray-500">การกระทำ</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-100">
                            <tr>
                                <td class="px-4 py-3 text-sm text-gray-700">2025-09-27</td>
                                <td class="px-4 py-3 text-sm text-gray-700">สมชาย ใจดี</td>
                                <td class="px-4 py-3 text-sm text-green-600">ตรวจพบ</td>
                                <td class="px-4 py-3 text-sm">
                                    <button class="text-blue-600 hover:underline">รายละเอียด</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </PageLayout>
</template>

<script setup>
import PageLayout from '../src/components/PageLayout.vue'
import PrimaryButton from '../src/components/PrimaryButton.vue'
import Swal from 'sweetalert2'

function exportReport() {
    Swal.fire('ส่งออก', 'ส่งออกรายงานเป็นไฟล์ CSV เรียบร้อย', 'success')
}
</script>