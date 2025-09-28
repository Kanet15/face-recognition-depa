import { getAuth, onAuthStateChanged } from "firebase/auth";
import { createRouter, createWebHistory } from "vue-router";
import Swal from 'sweetalert2';

import LoginView from "../views/Login.vue";
import StudentInputDataView from "../views/Student-input-data.vue";
import ReportView from "../views/Report.vue";
import HomeView from "../views/Home.vue"; // ตรวจสอบให้แน่ใจว่า HomeView ถูกนำเข้า
import CheckInView from "../views/CheckIn.vue";
import ManageSubjectsView from "../views/ManageSubjects.vue";
import SummaryView from "../views/Summary.vue";

const allowedEmails = ["student@cpssmail.com"]; // ตัวอย่างรายชื่ออีเมลที่มีข้อจำกัดพิเศษ
const restrictedPaths = ["/student-input-data"]; // ตัวอย่างเส้นทางที่จำกัด (ปกติ)

// Users in `allowedEmails` are only allowed to access the paths in this allowlist.
const allowedOnlyPathsForRestrictedUsers = {
  'student@cpssmail.com': ['/student-input-data']
};

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/login",
      name: "login",
      component: LoginView,
    },
    {
      path: "/student-input-data",
      name: "student-input-data",
      component: StudentInputDataView,
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: "/check-in",
      name: "check-in",
      component: CheckInView,
      meta: { requiresAuth: true },
    },
    {
      path: "/manage-subjects",
      name: "manage-subjects",
      component: ManageSubjectsView,
      meta: { requiresAuth: true },
    },
    {
      path: "/summary",
      name: "summary",
      component: SummaryView,
      meta: { requiresAuth: true },
    },
    {
      path: "/",
      name: "home",
      component: HomeView,
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: "/report",
      name: "report",
      component: ReportView,
      meta: {
        requiresAuth: true,
      },
    },
  ],
});

const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const removeListener = onAuthStateChanged(
      getAuth(),
      (user) => {
        removeListener();
        resolve(user);
      },
      reject
    );
  });
};

router.beforeEach(async (to, from, next) => {
  // Always resolve current user first so we can enforce special restrictions
  const user = await getCurrentUser();

  // If the user is one of the restricted users, only allow their allowedOnly paths
  if (user && allowedEmails.includes(user.email)) {
    const allowedPaths = allowedOnlyPathsForRestrictedUsers[user.email] || [];
    if (!allowedPaths.includes(to.path)) {
      Swal.fire({
        icon: 'error',
        title: 'การเข้าถึงถูกปฏิเสธ',
        text: 'บัญชีนี้สามารถเข้าถึงได้เฉพาะหน้าที่กำหนดเท่านั้น',
      });
      return next(false);
    }
  }

  // Existing auth flow for other users/routes
  if (to.matched.some((record) => record.meta.requiresAuth)) {
    if (user) {
      // If route itself is restricted (e.g., only certain emails), enforce it
      if (restrictedPaths.includes(to.path)) {
        if (allowedEmails.includes(user.email)) {
          next();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'การเข้าถึงถูกปฏิเสธ',
            text: 'คุณไม่สามารถเข้าถึงหน้านี้ได้.',
          });
          next(false);
        }
      } else {
        next();
      }
    } else {
      next({ name: 'login' });
    }
  } else {
    next();
  }
});

export default router;