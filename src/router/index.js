import { createRouter, createWebHistory } from 'vue-router';
import SignupForm from '../components/SignupForm.vue';
import LoginForm from '@/components/LoginForm.vue';
import RequestPasswordReset from '@/components/RequestPasswordReset.vue';
import ResetPassword from '@/components/ResetPassword.vue';
import FindPassword from '@/components/FindPassword.vue';
import FindId from '@/components/FindId.vue';
import MypageEdit from '@/components/MypageEdit.vue';
import BoardForm from '@/components/BoardForm.vue'; // BoardForm 컴포넌트 불러오기
import BoardDetail from '@/components/BoardDetail.vue'; //BoardDetail 컴포넌트 불러오기

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
    {path:'/mypage-edit', component: MypageEdit},
    {
        path: '/board',
        name: 'BoardForm',
        component: BoardForm, // 게시판 페이지 추가
    },
    {
        path: '/board/:id',
        name: 'BoardDetail',
        component: BoardDetail,
        props: true, // 게시글 ID를 컴포넌트에 전달
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;