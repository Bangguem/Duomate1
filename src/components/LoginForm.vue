<template>
    <div id="app">
    <div class="login-container">
      <header class="header">
        <div class="logo">
        <div class="circle"></div>
        <span>로그인</span>
        </div>
        <nav class="nav">
          <a href="#" class="nav-link">홈</a>
          <a href="#" class="nav-link">회원가입</a>
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
          <div class="actions">
            <a href="#" class="action-link">아이디 찾기</a>
            <a href="#" class="action-link">비밀번호 찾기</a>
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
.login-page {
    max-width: 400px;
    margin: 50px auto;
    padding: 20px;
    border: 1px solid #ccc;
    border-radius: 8px;
    background-color: #f9f9f9;
    text-align: center;
}

form div {
    margin-bottom: 15px;
}

label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
}

input {
    width: 100%;
    padding: 10px;
    font-size: 16px;
    border: 1px solid #ccc;
    border-radius: 4px;
}

button {
    width: 100%;
    padding: 10px;
    font-size: 16px;
    background-color: #4caf50;
    color: white;
    border: none;
    cursor: pointer;
    border-radius: 4px;
}

button:hover {
    background-color: #45a049;
}
.error-message{
  color: red;
  margin-top: 10px;
}
</style>