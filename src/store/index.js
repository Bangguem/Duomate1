import Vue from 'vue';
import Vuex from 'vuex';
 
Vue.use(Vuex);
 
export default new Vuex.Store({
  state: {
    userid: '',
  },
  getters: {
    isLogin(state) {
      // state.username 값의 유무에 따라 true, false를 리턴한다.
      return state.userid !== '';
    },
  },
  mutations: {
    setUsername(state, userid) {
      state.userid = userid;
    },
    // 로그아웃을 username 값을 공백으로 하는것으로 처리
    clearUsername(state) {
      state.userid = '';
    },
  },
});
 
// main.js
import Vue from 'vue';
import App from './App.vue';
import router from '@/routes/index';
import store from '@/store/index';
 
Vue.config.productionTip = false;
 
new Vue({
  render: h => h(App),
  router,
  // store(Vuex) 등록
  store,
}).$mount('#app');