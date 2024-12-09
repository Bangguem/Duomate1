import { createRouter, createWebHistory } from 'vue-router';
import SignupForm from '../components/SignupForm.vue';
import LoginForm from '@/components/LoginForm.vue';
import RequestPasswordReset from '@/components/RequestPasswordReset.vue';
import ResetPassword from '@/components/ResetPassword.vue';
import FindPassword from '@/components/FindPassword.vue';
import FindId from '@/components/FindId.vue';
import MypageEdit from '@/components/MypageEdit.vue';

const routes = [
    {
        path: '/signup',
        name: 'Signup',
        component: SignupForm,
    },
    {
        path: '/login',
        name: 'Login',
        component: LoginForm,
    },
    { path: '/request-password-reset', component: RequestPasswordReset },
    { path: '/reset-password', component: ResetPassword },
    {path: '/find-password', component: FindPassword},
    {path:'/find-id', component: FindId},
    {path:'/mypage-edit', component: MypageEdit, meta: { requiresAuth: true }}
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

function isAuthenticated() {
    // 실제 구현 시, JWT 토큰 유효성 검사나 로그인 상태 체크 함수로 대체하세요.
    return !!localStorage.getItem('authToken');
  }

router.beforeEach((to, from, next) => {
    if (to.meta.requiresAuth && !isAuthenticated()) {
      // 인증되지 않은 상태로 보호된 페이지 접근 시 로그인 페이지로 리다이렉트
      next({ name: 'Login' });
    } else {
      // 정상적으로 이동
      next();
    }
  });

export default router;