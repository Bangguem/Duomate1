<template>
  <div id="app">
  <div class="login-container">
    <header class="header">
      <div class="logo">
      <div class="circle"></div>
      <span>로그인</span>
      </div>
      <nav class="nav-links">
        <router-link to ="/">홈</router-link>
        <router-link to ="/signup">회원가입</router-link>
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
        <div class="actions-link">
          <a href="#">아이디 찾기</a>
          <router-link to ="/find-password">비밀번호 찾기</router-link>
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
      };
  },
  methods: {
      async handleLogin() {
          try {
              const response = await fetch('http://localhost:3000/login', {
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

html,body {
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
  width : 100vw;
  height : 100vh;
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
}

.action-link a:hover,
.action-link router-link:hover {
text-decoration: underline;
}
.error-message{
color: red;
margin-top: 10px;
}
</style>