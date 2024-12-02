<template>
  <div id="app">
    <!-- 조건에 따라 다른 헤더를 표시 -->
    <header v-if="showHeader" >
      <template v-if="isLoggedIn">
        <!-- 로그인 상태일 때의 헤더 -->
        <div class="header">
          <div class="logo">
            <div class="circle"></div>
            <span>안녕하세요, {{ username }}님!</span>
          </div>
            <nav class="nav-links">
            <a v-if="userInfo.nickname"><strong>닉네임:</strong> {{ userInfo.nickname }}</a>
            <a @click="mypageopen==true">마이페이지</a>
            <div v-if="mypageopen == true" class="modal-overlay">
            <div class="modal-content">
            <!-- 프로필 이미지 -->
          <div class="profile-image"></div>

            <!-- 유저 정보 표시 -->
          <div class="user-info-display">
            <p><strong>닉네임:</strong> {{ this.userinfo.user.nickname }}</p>
            <p><strong>이메일:</strong> {{ this.email }}</p>
            <p><strong>생년월일:</strong> {{ this.birthdate }}</p>
            <p><strong>성별:</strong> {{ this.gender }}</p>
          </div>

          <!-- 수정 버튼 -->
          <button type="button" class="edit-button">내 정보 수정</button>

          <!-- 게임 정보 -->
          <div class="gaming-info">
            <h2>Gaming Information</h2>
            <p>Your gaming details</p>
            <div class="game-stats">
              <div class="game-tier">
                <img src="tier-icon.png" alt="Game Tier" />
                <p>Game Tier</p>
                <p>{{ userInfo.gameTier }}</p>
              </div>
              <div class="most-champions">
              <p>Most Champion Top 3</p>
              <div class="champion-icons">
                <img v-for="(champion, index) in userInfo.topChampions" :key="index" :src="champion.image" :alt="champion.name" />
              </div>
              <p>{{ userInfo.topChampions.map(c => c.name).join(', ') }}</p>
            </div>
            </div>
            </div>

            <!-- 회원 탈퇴 버튼 -->
            <button class="delete-button">회원탈퇴</button>
            </div>
            </div>
            <a href="#">내 정보</a>
            <router-link to = "/">로그아웃</router-link>
            </nav>
        </div>
      </template>
      <template v-else>
        <!-- 비로그인 상태일 때의 헤더 -->
        <div class="header">
          <div class="logo">
            <div class="circle"></div>
            <span>Welcome</span>
          </div>
          <nav class="nav-links">
            <a href="#">공지</a>
            <router-link to="/signup">회원가입</router-link>
            <router-link to="/login">로그인</router-link>
          </nav>
        </div>
      </template>
    </header>

    <main class="main-content">
      <!-- 라우팅된 화면 표시 -->
      <router-view></router-view>

      <!-- 메인 페이지 컨텐츠 (로그인/회원가입 페이지 제외) -->
      <div v-if="showPlaceholder" class="placeholder"></div>
    </main>

    <!-- 조건에 따라 푸터를 표시 -->
    <footer v-if="showFooter" class="footer">
      <nav class="footer-links">
        <a href="#">Contact Us</a>
        <a href="#">About Us</a>
        <a href="#">Terms & Conditions</a>
        <a href="#">Privacy Policy</a>
      </nav>
    </footer>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      mypageopen: false,
      isLoggedIn: false, // 로그인 상태
      userInfo: {},
    };
  },
  computed: {
    // 로그인, 회원가입 페이지 여부 확인
    isAuthPage() {
      return ['/login', '/signup','/find-password','/find-id'].includes(this.$route.path);
    },
    // 헤더와 푸터 표시 여부
    showHeader() {
      return !this.isAuthPage;
    },
    showFooter() {
      return !this.isAuthPage;
    },
    // 메인 페이지의 플레이스홀더 표시 여부
    showPlaceholder() {
      return !this.isAuthPage;
    },
  },
  methods: {
    async checkLoginStatus() {
      try {
        const response = await fetch('http://localhost:3000/auth/check-login', {
          method: 'GET',
          credentials: 'include', // 쿠키 포함
        });

        if (response.ok) {
          const data = await response.json();
          this.isLoggedIn = data.loggedIn;
          if (data.loggedIn) {
            this.userInfo = data.user || {}; // 사용자 정보를 객체로 저장
          }
        } else {
          this.resetUserData();
        }
      } catch (error) {
        console.error('Error checking login status:', error);
        this.resetUserData();
      }
    },
    resetUserData() {
      this.isLoggedIn = false;
      this.userInfo = {}; // 사용자 정보 초기화
    },
    async logout() {
      try {
        const response = await fetch('http://localhost:3000/logout', {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          this.isLoggedIn = false;
          this.nickname = '';
          this.$router.push('/'); // 로그아웃 후 로그인 페이지로 이동
        }
      } catch (error) {
        console.error('Error logging out:', error);
      }
    },
  },
  mounted() {
    this.checkLoginStatus(); // 컴포넌트가 마운트될 때 로그인 상태 확인
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
  margin: 0;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* 헤더 스타일 */
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
  margin-left: 20px;
  color: #FAFAFA;
  text-decoration: none;
  font-size: 10px;
}

.nav-links a:hover,
.nav-links router-link:hover {
  text-decoration: underline;
}

/* 메인 컨텐츠 */
.main-content {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #757575;
}

.placeholder {
  width: 80%;
  height: 60%;
  background-color: #757575;
}

/* 푸터 스타일 */
.footer {
  background-color: #212121;
  color: #FAFAFA;
  padding: 90px 0;
}

.footer-links {
  display: flex;
  justify-content: center;
  gap: 100px;
}

.footer-links a {
  color: #FAFAFA;
  text-decoration: none;
  font-size: 16px;
}

.footer-links a:hover {
  text-decoration: underline;
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

.profile-image {
  width: 100px;
  height: 100px;
  background-color: gray;
  border-radius: 50%;
  margin: 0 auto 20px;
}

.user-info-display p {
  margin: 10px 0;
}

.edit-button {
  margin-top: 20px;
  padding: 10px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.edit-button:hover {
  background-color: #45a049;
}

.gaming-info {
  margin-top: 20px;
}

.gaming-info h2 {
  margin-bottom: 10px;
}

.game-stats {
  display: flex;
  justify-content: space-around;
}

.game-tier img,
.most-champions img {
  width: 50px;
  height: 50px;
}

.champion-icons img {
  margin: 0 5px;
}

.delete-button {
  margin-top: 20px;
  padding: 10px;
  background-color: transparent;
  border: 1px solid white;
  color: white;
  border-radius: 4px;
  cursor: pointer;
}

.delete-button:hover {
  background-color: white;
  color: black;
}
</style>