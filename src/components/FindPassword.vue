<template>
    <div id="app">
    <div class="find-password-page">
      <!-- 상단 헤더 -->
      <header class="header">
        <div class="logo">
            <div class="circle">
              <img src="/favicon.ico" class="circle" @click="$router.push('/')" style="cursor: pointer;" alt="" />
            </div>
            비밀번호 찾기</div>
        <nav class="nav-links">
          <a href="/">홈 화면</a>
          <a href="/login">로그인</a>
          <a href="/contact" >Contact</a>
        </nav>
      </header>
  
      <!-- 비밀번호 찾기 섹션 -->
      <main class="main-content">
        <h1 class="title">비밀번호 재설정</h1>
        <form class="form">
          <div class="form-group">
            <label for="newPassword" class="form-label">새 비밀번호</label>
            <input
              type="password"
              id="newPassword"
              class="form-input"
              v-model="newPassword"
              placeholder="새 비밀번호를 입력해주세요"
            />
          </div>
          <div class="form-group">
            <label for="confirmPassword" class="form-label">새 비밀번호 확인</label>
            <input
              type="password"
              id="confirmPassword"
              class="form-input"
              v-model="confirmPassword"
              placeholder="새 비밀번호를 다시 입력해주세요"
            />
          </div>
          <p v-if="message" :class="success ? 'success' : 'error'">{{ message }}</p>
          <div class="button-group">
            <button type="button" class="cancel-button">취소</button>
            <button type="submit" class="submit-button">확인</button>
          </div>
        </form>
      </main>
    </div>
    </div>
</template>
  
<script>
  export default {
    data() {
        return {
            newPassword: '',
            confirmPassword: '',
            message: '',
            success: false,
        };
    },
    methods: {
        async resetPassword() {
            const token = new URLSearchParams(window.location.search).get('token');
            if (!token) {
                this.success = false;
                this.message = '유효하지 않은 요청입니다.';
                return;
            }

            if (this.newPassword !== this.confirmPassword) {
                this.success = false;
                this.message = '비밀번호가 일치하지 않습니다.';
                return;
            }

            try {
                const response = await fetch('http://localhost:3000/reset-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token, newPassword: this.newPassword }),
                });

                const result = await response.json();
                this.success = result.success;
                this.message = result.message;
            } catch (error) {
                console.error('Error resetting password:', error);
                this.success = false;
                this.message = '비밀번호 변경 중 오류가 발생했습니다.';
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
  background-color: #212121;
}
/* 전체 페이지 스타일 */
.find-password-page {
  background-color: #212121;
  color: #fafafa;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: "Arial", sans-serif;
  justify-content: start;
}

/* 헤더 스타일 */
.header {
    width: 100%;
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
  margin-left: 20px;
  color: #FAFAFA;
  text-decoration: none;
  font-size: 10px;
}

.nav-links a:hover,
.nav-links router-link:hover {
  text-decoration: underline;
}
  /* 메인 콘텐츠 */
.main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    max-width: 400px;
    width: 200vw;
}
  
.title {
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 20px;
}
  
  /* 폼 스타일 */
.form {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  
.form-group {
    display: flex;
    flex-direction: column;
  }
  
.form-label {
    font-size: 14px;
    margin-bottom: 5px;
  }
  
.form-input {
    padding: 10px;
    font-size: 14px;
    border: 1px solid #555;
    border-radius: 4px;
    background-color: #FFFFFF;
    color: #212121;;
  }
  
.form-input::placeholder {
    color: #888;
  }
  
.form-input:focus {
    outline: none;
    border-color: #15513775;
  }
  
  /* 버튼 그룹 */
.button-group {
    display: flex;
    justify-content: space-between;
    gap: 10px;
  }
  
.cancel-button {
    flex: 1;
    padding: 10px;
    font-size: 14px;
    background-color: transparent;
    border: 1px solid #fafafa;
    color: #fff;
    border-radius: 4px;
    cursor: pointer;
  }
  
.cancel-button:hover {
    background-color: #444;
  }
  
.submit-button {
    flex: 1;
    padding: 10px;
    font-size: 14px;
    background-color: #15513775;
    border: none;
    color: #fff;
    border-radius: 4px;
    cursor: pointer;
  }
  
.submit-button:hover {
    background-color: #15513775;
  }
  .success {
    color: green;
}

.error {
    color: red;
}
  </style>
