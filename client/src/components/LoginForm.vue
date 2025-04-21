<template>
  <div id="app">
    <div class="login-container">
      <header class="header">
        <div class="logo">
          <div class="circle">
            <img src="/favicon.ico" class="circle" @click="$router.push('/')" style="cursor: pointer;" alt="" />
          </div>
          <span>로그인</span>
        </div>
        <nav class="nav-links">
          <div class="nav-button" @click="$router.push('/')">홈</div>
          <div class="nav-button" @click="$router.push('/signup')">회원가입</div>
        </nav>
      </header>

      <main class="login-main">
        <div class="login-box">
          <h1 class="login-title">로그인 정보를 입력해주세요</h1>
          <form @submit.prevent="handleLogin">
            <div class="input-group">
              <input type="text" v-model="form.userid" placeholder="아이디" required />
            </div>
            <div class="input-group">
              <input type="password" v-model="form.password" placeholder="비밀번호" required />
            </div>
            <button type="submit" class="login-button">로그인</button>
            <p class="error-message" v-if="errorMessage">{{ errorMessage }}</p>
          </form>
          <br />
          <div class="actions-link">
            <a @click="openFindIdModal">아이디 찾기</a>
            <div class="modal-overlay" v-if="rqid == true">
              <div class="modal-content">
                <h1>아이디 찾기</h1>
                <form @submit.prevent="requestUserId">
                  <div>
                    <label for="email">이메일: </label>
                    <input type="email" id="email" v-model="emailForId" placeholder="이메일을 입력하세요" required />
                  </div>
                  <button class="submit-button" type="submit" :disabled="isButtonDisabledId">{{ isButtonDisabledId ?
                    `${timerId}초 후 다시 요청` : '아이디 보내기' }}</button>
                  <button class="cancel-button" @click="rqid = false">닫기</button>
                </form>
                <br />
                <p v-if="messageId" :class="successId ? 'success' : 'error'">{{ messageId }}</p>
              </div>

            </div>
            <a @click="openPasswordResetModal">비밀번호 재설정</a>
            <div class="modal-overlay" v-if="rqpassword == true">
              <div class="modal-content">
                <h1>비밀번호 재설정 요청</h1>
                <form @submit.prevent="requestResetLink">
                  <div>
                    <label for="email">이메일: </label>
                    <input type="email" id="email" v-model="emailForPassword" placeholder="이메일을 입력하세요" required />
                  </div>
                  <button class="submit-button" type="submit" :disabled="isButtonDisabledPassword">{{
                    isButtonDisabledPassword ? `${timerPassword}초 후 다시 요청` : '비밀번호 재설정 링크 전송' }}</button>
                  <button class="cancel-button" @click="rqpassword = false">닫기</button>
                </form>
                <br />
                <p v-if="messagePassword" :class="successPassword ? 'success' : 'error'">{{ messagePassword }}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      form: {
        userid: '',
        password: '',
      },
      errorMessage: '',

      // 아이디 찾기용
      rqid: false,
      emailForId: '',
      isButtonDisabledId: false,
      timerId: 0,
      messageId: '',
      successId: false,

      // 비밀번호 재설정용
      rqpassword: false,
      emailForPassword: '',
      isButtonDisabledPassword: false,
      timerPassword: 0,
      messagePassword: '',
      successPassword: false,
    };
  },
  methods: {
    openFindIdModal() {
      this.rqid = true;
      this.messageId = '';
      this.successId = false;
      this.emailForId = '';
    },
    openPasswordResetModal() {
      this.rqpassword = true;
      this.messagePassword = '';
      this.successPassword = false;
      this.emailForPassword = '';
    },
    async handleLogin() {
      try {
        const response = await fetch(`${process.env.VUE_APP_API_URL}/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // 쿠키 포함
          body: JSON.stringify(this.form),
        });

        if (response.ok) {
          // 성공적으로 로그인하면 홈으로 이동
          window.location.href = '/';
        } else {
          // 에러 메시지 처리
          const errorText = await response.json();
          this.errorMessage = errorText.message;
        }
      } catch (error) {
        console.error('Login error:', error);
        this.errorMessage = '로그인 중 오류가 발생했습니다. 다시 시도해주세요.';
      }
    },
    async requestUserId() {
      if (this.isButtonDisabledId) return;

      this.isButtonDisabledId = true;
      this.timerId = 60;

      const countdownId = setInterval(() => {
        this.timerId--;
        if (this.timerId <= 0) {
          clearInterval(countdownId);
          this.isButtonDisabledId = false;
        }
      }, 1000);

      try {
        const response = await fetch(`${process.env.VUE_APP_API_URL}/request-userid`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: this.emailForId }),
        });

        const result = await response.json();

        if (result.success) {
          this.successId = true;
          this.messageId = '아이디가 이메일로 전송되었습니다.';
        } else {
          this.successId = false;
          this.messageId = result.message;
        }
      } catch (error) {
        console.error('Error requesting user ID:', error);
        this.successId = false;
        this.messageId = '아이디 요청 중 오류가 발생했습니다.';
      }
    },
    async requestResetLink() {
      if (this.isButtonDisabledPassword) return; // 버튼이 비활성화된 상태면 요청 막기

      this.isButtonDisabledPassword = true; // 버튼 비활성화
      this.timerPassword = 60; // 10초 대기 시간 설정
      this.messagePassword = '';

      const countdown = setInterval(() => {
        this.timerPassword--;
        if (this.timerPassword <= 0) {
          clearInterval(countdown);
          this.isButtonDisabledPassword = false; // 대기 시간 종료 시 버튼 활성화
        }
      }, 1000);
      try {
        const response = await fetch(`${process.env.VUE_APP_API_URL}/request-password-reset`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: this.emailForPassword }),
        });

        const result = await response.json();
        this.successPassword = result.success;
        this.messagePassword = result.message;
      } catch (error) {
        console.error('Error requesting password reset:', error);
        this.successPassword = false;
        this.messagePassword = '비밀번호 재설정 요청 중 오류가 발생했습니다.';
      }
    },
  },
};
</script>



<style scoped>
/* 전체 스타일 초기화 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
}

body {
  margin: 0;
  font-family: Arial, sans-serif;
  background-color: #f4f4f4;
}

#app {
  width: 100vw;
  height: 100vh;
}

.login-container {
  height: 100vh;
  display: flex;
  width: 100%;
  height: 100%;
  flex-direction: column;
  background-color: #212121;
  color: #fff;
  font-family: 'Arial', sans-serif;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background-color: #424242;
  color: #FAFAFA;
  height: 50px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.circle {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: #15513775;
}

.nav-links {
  display: flex;
  gap: 4px;
  align-items: stretch;
}

.nav-button {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 50px;
  width: 80px;
  padding: 0 16px;
  background-color: transparent;
  color: #FAFAFA;
  border-radius: 0;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.nav-button:hover {
  background-color: #212121;
}

.nav-links a,
.nav-links router-link {
  gap: 10px;
  margin-left: 20px;
  color: #FAFAFA;
  text-decoration: none;
  font-size: 10px;
}

.nav-links a:hover,
.nav-links router-link:hover {
  text-decoration: underline;
}

.login-main {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.login-box {
  background-color: #212121;
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 400px;
  text-align: center;
}

.login-title {
  font-size: 20px;
  margin-bottom: 20px;
}

.input-group {
  margin-bottom: 15px;
}

input[type="text"],
input[type="password"] {
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
}

.login-button {
  width: 40%;
  padding: 8px;
  background-color: #15513775;
  color: #fafafa;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
}

.login-button:hover {
  background-color: #15513775;
}

.actions-link a,
.actions-link router-link {
  color: #fafafa;
  text-decoration: none;
  font-size: 12px;
  margin: 0px 10px 0px 10px;
  cursor: pointer;
}

.actions-link a:hover,
.actions-link router-link:hover {
  text-decoration: underline;
}

.error-message {
  color: red;
  margin-top: 10px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: #2a2a2a;
  color: white;
  width: 80%;
  max-width: 500px;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.modal-content h1 {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 20px;
}

.modal-content label {
  font-size: 14px;
  margin-bottom: 5px;
}

.modal-content input {
  padding: 8px;
  font-size: 14px;
  border: 1px solid #555;
  border-radius: 4px;
  background-color: #FFFFFF;
  color: #000000;
  width: 90%;
  /* 인풋 박스 너비를 늘림 */
  max-width: 300px;
  /* 최대 너비 제한 */
}

.modal-content input::placeholder {
  color: #888;
}

.modal-content input:focus {
  outline: none;
  border-color: #15513775;
}

.cancel-button {
  flex: 1;
  padding: 8px;
  font-size: 14px;
  background-color: transparent;
  border: 1px solid #fafafa;
  color: #fff;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
  /* 버튼과 위 요소 사이 간격 */
  margin-left: 10px;

}

.cancel-button:hover {
  background-color: #444;
}

.submit-button {
  flex: 1;
  padding: 8px;
  font-size: 14px;
  background-color: #15513775;
  border: none;
  color: #fff;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
  /* 버튼과 위 요소 사이 간격 */
  margin-right: 30px;
}

.submit-button:hover {
  background-color: #15513775;
}
</style>