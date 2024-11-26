import { createRouter, createWebHistory } from 'vue-router';
import HelloWorld from '../components/HelloWorld.vue';
import SignupForm from '../components/SignupForm.vue';
import LoginForm from '@/components/LoginForm.vue';

const routes = [
    {
        path: '/',
        name: 'Home',
        component: HelloWorld,
    },
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
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;