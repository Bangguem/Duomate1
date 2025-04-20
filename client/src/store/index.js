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
 
