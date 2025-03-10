<template>
  <div id="app">
  <div class="signup-container">
    <header class="header">
      <div class="logo">
      <div class="circle">
        <img src="/favicon.ico" class="circle" @click="$router.push('/')" style="cursor: pointer;" alt="" />
      </div>
      <span>회원가입</span>
      </div>
      <nav>
        <a href="/">홈 화면</a>
        <a href="/login">로그인</a>
        <a href="/contact">Contact</a>
      </nav>
    </header>
    <main>
      <div class="form-container">
        <h2>계정 생성</h2>
        <p>계정 생성에 필요한 정보를 입력해주세요. </p>
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label for="userid">아이디</label>
            <input id="userid" type="text" placeholder="아이디를 입력해주세요" v-model="form.userid" @input="checkDuplicateUserId" required />
            <div :style="{ color: duplicateCheck.color }">{{ duplicateCheck.message }}</div>
          </div>
          <div class="form-group password-field">
  <label for="password">비밀번호</label>
  <div class="password-container">
    <input
      id="password"
      :type="passwordVisible ? 'text' : 'password'"
      placeholder="비밀번호를 입력해주세요"
      v-model="form.password"
      required
    />
    <img
      :src="passwordVisible ? openIcon : closeIcon"
      alt="Show Password"
      class="toggle-password"
      @click="togglePasswordVisibility('password')"
    />
  </div>
</div>
          <div class="form-group password-field">
            <label for="passwordcheck">비밀번호 확인</label>
            <div class="password-container">
              <input
      id="passwordcheck"
      :type="passwordCheckVisible ? 'text' : 'password'"
      placeholder="비밀번호를 다시 입력해주세요"
      v-model="form.passwordcheck"
      required
    />
    <img
      :src="passwordCheckVisible ? openIcon : closeIcon"
      alt="Show Password"
      class="toggle-password"
      @click="togglePasswordVisibility('passwordcheck')"
    />
  </div>
          </div>
          <div class="form-group">
            <label for="email">이메일</label>
            <input id="email" type="email" v-model="form.email" placeholder="이메일을 입력해주세요(비밀번호 또는 아이디 찾기에 사용)" />
          </div>
          <div class="form-group">
            <label for="nickname">닉네임</label>
            <input id="nickname" type="text" placeholder="닉네임을 입력해주세요" v-model="form.nickname" required />
          </div>
          <!-- <div class="form-group">
            <label for="birthdate">생년월일</label>
            <input id="birthdate" type="date" v-model="form.birthdate" placeholder="생년월일을 입력해주세요" />
          </div> -->
          <!-- <div class="form-group">
            <label for="gender">성별</label>
            <select id="gender" v-model="form.gender" require>
              <option value="male">남성</option>
              <option value="female">여성</option>
              <option value="other">기타</option>
            </select>
          </div> -->
          <div class="button-group">
            <button type="button" class="cancel-button">Cancel</button>
            <button type="submit" class="signup-button">Sign Up</button>
          </div>
          </form>
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
              passwordcheck: '',
              email: '',
              nickname: '',
              birthdate: '',
              gender: 'other',
          },
          duplicateCheck: {
              message: '',
              color: '',
          },
          passwordVisible: false,
          passwordCheckVisible: false,
          openIcon: require('@/assets/open.png'), 
      closeIcon: require('@/assets/close.png'),
      };
  },
  methods: {
    togglePasswordVisibility(field) {
      if (field === 'password') {
      this.passwordVisible = !this.passwordVisible;
    } else if (field === 'passwordcheck') {
      this.passwordCheckVisible = !this.passwordCheckVisible;
    }
    },
      async checkDuplicateUserId() {
          const userid = this.form.userid;

          if (!userid) {
              this.duplicateCheck.message = '';
              return;
          }

          try {
              const response = await fetch('http://localhost:3000/check-duplicate', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include', // 쿠키를 포함한 요청
                  body: JSON.stringify({ userid }),
              });

              const result = await response.json();
              if (response.ok) {
                  this.duplicateCheck.message = result.message;
                  this.duplicateCheck.color = 'green';
              } else {
                  this.duplicateCheck.message = result.message;
                  this.duplicateCheck.color = 'red';
              }
          } catch (error) {
              console.error('Error checking duplicate:', error);
              this.duplicateCheck.message = '중복 확인 중 오류가 발생했습니다.';
              this.duplicateCheck.color = 'red';
          }
      },
      async handleSubmit() {
        const { userid, password, passwordcheck, nickname, email } = this.form;

    if (!userid || !password || !passwordcheck || !nickname || !email) {
        alert('모든 항목을 입력해주세요.');
        return;
    }
          if (this.form.password !== this.form.passwordcheck) {
              alert('비밀번호가 일치하지 않습니다.');
              return;
          }

          try {
              const response = await fetch('http://localhost:3000/signup', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(this.form),
              });

              const result = await response.json();
              if (response.ok) {
                  alert(result.message);
                  window.location.href = '/login';
              } else {
                  alert(result.message);
              }
          } catch (error) {
              console.error('Signup error:', error);
              alert('회원가입 중 오류가 발생했습니다.');
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
background-color: #212121;
}
#app {
  width : 120vw;
  height : 120vh;
  background-color: #212121;
}

/* 전체 레이아웃 스타일 */
.signup-container {
font-family: Arial, sans-serif;
background-color: #212121;
color: #FAFAFA;
height: 100vh;
display: flex;
flex-direction: column;
align-items: center;
justify-content: start;
}

/* 헤더 스타일 */
.header {
width: 100%;
padding: 10px;
display: flex;
justify-content: space-between;
align-items: center;
background-color: #424242;
}

.header h1 {
margin: 0;
font-size: 16px;
}

.header nav a {
color: #FAFAFA;
text-decoration: none;
margin-left: 15px;
font-size: 10px;
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

/* 폼 컨테이너 */
.form-container {
background-color: #212121;
padding: 20px 20px;
border-radius: 8px;
max-width: 400px;
width: 200vw;
}

.form-container h2 {
font-size: 24px;
margin-bottom: 10px;
}

.form-container p {
font-size: 14px;
margin-bottom: 20px;
}

/* 폼 그룹 스타일 */
.form-group {
margin-bottom: 20px;
}

.form-group label {
display: block;
font-size: 14px;
margin-bottom: 5px;
}

.form-group input {
width: 100%;
padding: 10px;
border: none;
border-radius: 4px;
font-size: 14px;
background-color: #FAFAFA;
color: black;
}
.form-group select{
  width: 100%;
  height: 40px;
  padding: 10px;
  background-color:  #FAFAFA;
  border-radius: 4px;
  font-size: 14px;
  color: #424242;
  border: none;
  cursor: pointer;
}

/* 버튼 스타일 */
.button-group {
display: flex;
gap: 10px;
}

.cancel-button,
.signup-button {
padding: 10px 60px;
border: none;
border-radius: 4px;
font-size: 14px;
cursor: pointer;
}

.cancel-button {
background-color: #424242;
color: #FAFAFA;
}

.signup-button {
background-color: #15513775;
color: #FAFAFA;
}

.cancel-button:hover {
background-color: #727272;
}

.signup-button:hover {
background-color: #15513775;
}
.password-container {
  position: relative;
  display: flex;
  align-items: center;
}

/* 비밀번호 입력칸 */
.password-container input {
  width: 100%;
  padding-right: 40px; /* 아이콘이 들어갈 공간 확보 */
}

/* 눈 모양 아이콘 */
.toggle-password {
  position: absolute;
  right: 10px;
  width: 24px; /* 추천 사이즈 */
  height: 24px;
  cursor: pointer;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.toggle-password:hover {
  opacity: 1;
}
</style>