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
import patchNotesDisplay from '@/components/patchNotesDisplay.vue'; // 새 컴포넌트 추가
import MatchQueue from '@/components/MatchQueue.vue';
import ChatRoom from '@/components/ChatRoom.vue';
import axios from 'axios';
import NoticePage from '../components/NoticePage.vue'; // 공지사항 페이지 컴포넌트
import UpdatePage from '@/components/UpdatePage.vue'; // 업데이트 페이지 추가
import UpdateDetail from '@/components/UpdateDetail.vue'; // 상세 페이지 컴포넌트
import InquiryForm from '@/components/InquiryForm.vue';
import InquiryList from '@/components/InquiryList.vue';
import InquiryDetail from '@/components/InquiryDetail.vue';

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
  { path: '/find-password', component: FindPassword },
  { path: '/find-id', component: FindId },
  { path: '/mypage-edit', component: MypageEdit, meta: { requiresAuth: true } /* 비로그인 상태일 때 로그인 페이지로 이동 */ },
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
  { path: '/matchqueue', component: MatchQueue },
  {
    path: '/chatroom',
    name: 'ChatRoom',
    component: ChatRoom,
    props: true, // params를 컴포넌트 props로 전달
  },
  {
    path: '/patch-notes',
    name: 'PatchNotesDisplay',
    component: patchNotesDisplay,  // 새로운 컴포넌트 등록
  },
  {
    path: '/notices',
    name: 'Notices',
    component: NoticePage, // 공지사항 페이지 컴포넌트
  },
  {
    path: '/updates', // 업데이트 페이지 라우트 추가
    name: 'UpdatePage',
    component: UpdatePage,
  },
   // 업데이트 상세 페이지
  {
      path: '/updates/:id',
      name: 'UpdateDetail',
      component: UpdateDetail,
      props: true,
  },
  {
    path: '/inquiries',
    name: 'InquiryList',
    component: InquiryList,
    meta: { requiresAuth: true },
  },
  {
    path: '/inquiries/new',
    name: 'InquiryForm',
    component: InquiryForm,
    meta: { requiresAuth: true },
  },
  {
    path: '/inquiries/:id',
    name: 'InquiryDetail',
    component: InquiryDetail,
    props: true,
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

async function isLoggedIn() {
  try {
    const response = await axios.get(`${process.env.VUE_APP_API_URL}auth/check-login`, {
      withCredentials: true, // 쿠키 포함 요청
    });
    return response.data.loggedIn;
  } catch (error) {
    console.error('Error checking login status:', error);
    return false; // 오류 발생 시 비로그인 상태로 간주
  }
}

// Navigation Guard 설정
router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.meta.requiresAuth;

  if (requiresAuth) {
    // 인증이 필요한 페이지 접근 시 로그인 상태 확인
    const loggedIn = await isLoggedIn();

    if (!loggedIn) {
      // 로그인 상태가 아니면 로그인 페이지로 이동
      return next({ name: 'Login', query: { redirect: to.fullPath } });
    }
  }

  next(); // 인증이 필요하지 않거나 로그인 상태라면 다음 라우트로 이동
});

export default router;