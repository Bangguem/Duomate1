<template>
  <div id="app">
    <!-- 조건에 따라 다른 헤더를 표시 -->
    <header v-if="showHeader">
      <template v-if="isLoggedIn">
        <!-- 로그인 상태일 때의 헤더 -->
        <div class="header">
          <div class="logo">
            <div class="circle">
              <img src="/favicon.ico" class="circle" @click="$router.push('/')" style="cursor: pointer;" alt="" />
            </div>
            <span>{{ userInfo.nickname }} 님</span>
          </div>
          <nav class="nav-links">
            <!-- <a v-if="userInfo.nickname"><strong>닉네임:</strong> {{ userInfo.nickname }}</a> -->
            <a @click="mypageopen = true">마이페이지</a>
            <router-link to="/board">게시판</router-link> <!-- 게시판 링크 추가 -->
            <router-link to="/patch-notes">패치 노트</router-link> <!-- 새로운 패치 노트 링크 추가 -->
            <div class="modal-overlay" v-if="mypageopen == true">
              <div class="modal-content">
                <!-- 프로필 이미지 -->
                <div class="profile-image">
                  <img v-if="userInfo.summonerInfo && userInfo.summonerInfo.profileIconId" 
                 :src="`https://ddragon.leagueoflegends.com/cdn/14.3.1/img/profileicon/${userInfo.summonerInfo?.profileIconId}.png`" 
                 alt="Summoner Icon" />
                </div>

                <!-- 유저 정보 표시 -->
                <div class="user-info-display">
                  <p v-if="userInfo.nickname"><strong>닉네임:</strong> {{ userInfo.nickname }}</p>
                  <p v-if="userInfo.email"><strong>이메일:</strong> {{ userInfo.email }}</p>
                  <p v-if="userInfo.birthdate"><strong>생년월일:</strong> {{ userInfo.birthdate }}</p>
                  <p v-if="userInfo.gender"><strong>성별:</strong> {{ userInfo.gender }}</p>
                </div>

                <!-- 수정 버튼 -->
                <button type="button" class="edit-button" @click="$router.push('/mypage-edit')">내 정보 수정</button>

                <!-- 게임 정보 -->
                <div class="gaming-info">
                  <h2>Gaming Information</h2>
                  <p v-if="!userInfo.SummonerName">연동이 필요합니다.</p>
                  <div class="game-stats">
                    <div class="game-tier">
                      <img v-if="!userInfo.summonerRank && userInfo.summonerInfo" src="@/assets/Rank/unranked.png" alt="">
            <p v-if="!userInfo.summonerRank && userInfo.summonerInfo">랭크 정보 없음</p>
                      <img v-if="userInfo.summonerRank && userInfo.summonerRank.tier" :src="require(`@/assets/Rank/Rank=${userInfo.summonerRank?.tier}.png`)" alt="" />
                      <p v-if="userInfo.summonerRank && userInfo.summonerRank.tier">Game Tier</p>
                      <p>{{ userInfo.summonerRank?.tier || "" }} {{ userInfo.summonerRank?.rank || "" }}</p>
                    </div>
                    <div class="most-champions">
                      <p v-if="(userInfo.top5Champions || [])[0]?.iconUrl" :src="userInfo.top5Champions[0]?.iconUrl">Most Champion Top 3</p>
                    <div class="champion-list">
                      <div class="champion-item">
                      <img v-if="(userInfo.top5Champions || [])[1]?.iconUrl" :src="userInfo.top5Champions[1]?.iconUrl" alt="Champion Image" />
                      <!-- 숙련도 이미지 -->
                      <img v-if="(userInfo.top5Champions || [])[1]?.masteryLevel < 10" 
                      :src="require(`@/assets/Mastery/${userInfo.top5Champions[1]?.masteryLevel}.webp`)" 
                      class="mastery-icon"
                      alt="Mastery Level" />
                      <img v-if="(userInfo.top5Champions || [])[1]?.iconUrl && (userInfo.top5Champions || [])[1]?.masteryLevel >= 10"
                      src="@/assets/Mastery/10.webp" 
                      class="mastery-icon"
                      alt="Mastery Level" />

                        <!-- 숙련도 레벨이 10 이상이면 추가 이미지 + 숙련도 레벨 표시 -->
                        <div v-if="(userInfo.top5Champions || [])[1]?.masteryLevel >= 10">
                        <img src="@/assets/Mastery/level.webp" class="high-mastery-icon" alt="High Mastery"/>
                        <p class="high-mastery-level">{{ (userInfo.top5Champions || [])[1]?.masteryLevel }}</p>
                        <br />
                        <p>{{ (userInfo.top5Champions || [])[1]?.championName || "" }}</p>
                        </div>
                      </div>
                      <div class="champion-item">
                        <img v-if="(userInfo.top5Champions || [])[0]?.iconUrl" :src="userInfo.top5Champions[0]?.iconUrl" alt="Champion Image" />
                        <!-- 숙련도 이미지 -->
                        <img v-if="(userInfo.top5Champions || [])[0]?.masteryLevel < 10" 
                        :src="require(`@/assets/Mastery/${userInfo.top5Champions[1]?.masteryLevel}.webp`)" 
                        class="mastery-icon"
                        alt="Mastery Level" />
                        <img v-if="(userInfo.top5Champions || [])[1]?.iconUrl && (userInfo.top5Champions || [])[1]?.masteryLevel >= 10"
                        src="@/assets/Mastery/10.webp" 
                        class="mastery-icon"
                        alt="Mastery Level" />

                        <!-- 숙련도 레벨이 10 이상이면 추가 이미지 + 숙련도 레벨 표시 -->
                        <div v-if="(userInfo.top5Champions || [])[0]?.masteryLevel >= 10">
                        <img src="@/assets/Mastery/level.webp" class="high-mastery-icon" alt="High Mastery"/>
                        <p class="high-mastery-level">{{ (userInfo.top5Champions || [])[0]?.masteryLevel }}</p>
                        <br />
                        <p>{{ (userInfo.top5Champions || [])[0]?.championName || "" }}</p>
                        </div>
                      </div>
                      <div class="champion-item">
                        <img v-if="(userInfo.top5Champions || [])[2]?.iconUrl" :src="userInfo.top5Champions[2]?.iconUrl" alt="Champion Image" />
                        <!-- 숙련도 이미지 -->
                        <img v-if="(userInfo.top5Champions || [])[2]?.masteryLevel < 10" 
                        :src="require(`@/assets/Mastery/${userInfo.top5Champions[2]?.masteryLevel}.webp`)" 
                        class="mastery-icon"
                        alt="Mastery Level" />
                        <img v-if="(userInfo.top5Champions || [])[1]?.iconUrl && (userInfo.top5Champions || [])[1]?.masteryLevel >= 10" 
                        src="@/assets/Mastery/10.webp" 
                        class="mastery-icon"
                        alt="Mastery Level" />

                        <!-- 숙련도 레벨이 10 이상이면 추가 이미지 + 숙련도 레벨 표시 -->
                        <div v-if="(userInfo.top5Champions || [])[2]?.masteryLevel >= 10">
                        <img src="@/assets/Mastery/level.webp" class="high-mastery-icon" alt="High Mastery"/>
                        <p class="high-mastery-level">{{ (userInfo.top5Champions || [])[2]?.masteryLevel }}</p>
                        <br />
                        <p>{{ (userInfo.top5Champions || [])[2]?.championName || "" }}</p>
                        </div>
                      </div>
                    </div>
                      <!-- <p>{{ userInfo.topChampions.map(c => c.name).join(', ') }}</p> -->
                    </div>
                  </div>
                </div>

                <!-- 회원 탈퇴 버튼 -->
                <button class="delete-button" @click="withdraw(), mypageopen = false">회원탈퇴</button>

                <button class="close-button" @click="mypageopen = false">닫기</button>
              </div>
            </div>
            <a href="/mypage-edit">내 정보 변경</a>
            <a @click="logout()">로그아웃</a>
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
      <div v-if="showPlaceholder" class="placeholder">
        <!-- 비디오 추가 -->
        <div class="background-video">
          <video autoplay loop muted>
            <source src="@/assets/Duomate2.mp4" type="video/mp4">
            <strong>Your browser does not support the video tag.</strong>
          </video>
          <div class="overlay-text">
            <h1>Find your Duo Mate!</h1>
            <p>Connect with gamers and build lasting friendships in our real-time chat platform designed for gamers!!!!
            </p>
            <button class="match-button" @click="enterMatchQueue">ENTER MATCH QUEUE</button>
          </div>

        </div>
      </div>
    </main>

    <!-- 조건에 따라 푸터를 표시 -->
    <!-- <footer v-if="showFooter" class="footer">
      <nav class="footer-links">
        <a href="#">Contact Us</a>
        <a href="#">About Us</a>
        <a href="#">Terms & Conditions</a>
        <a href="#">Privacy Policy</a>
      </nav>
    </footer> -->
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
      return ['/login', '/signup', '/find-password', '/find-id', '/mypage-edit', '/matchqueue', '/chatroom', '/board', '/patch-notes'].includes(this.$route.path);
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
    videoElement() {
      return this.$refs.videoElement;
    }
  },
  methods: {
    enterMatchQueue() {
      this.$router.push('/matchqueue');
    },
    playVideo() {
      this.videoElement.play();
    },
    pauseVideo() {
      this.videoElement.pause();
    },
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
    async withdraw() {
      const confirmation = confirm('정말로 회원탈퇴를 진행하시겠습니까?');
      if (!confirmation) return;

      try {
        const response = await fetch('http://localhost:3000/withdraw', {
          method: 'GET', // DELETE 메서드 사용 (백엔드 구현에 맞게 조정)
          credentials: 'include',
        });

        if (response.ok) {
          alert('회원탈퇴가 완료되었습니다.');
          this.resetUserData();
          this.$router.push('/'); // 기본 페이지로 이동
        } else {
          alert('회원탈퇴 중 오류가 발생했습니다. 다시 시도해주세요.');
        }
      } catch (error) {
        console.error('Error withdrawing: ', error);
        alert('회원탈퇴 중 오류가 발생했습니다. 다시 시도해주세요.');
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
  padding: 15px 20px;
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
  width: 100%;
  height: 60%;
  background-color: #212121;
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
.profile-image img {
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
  background-color: #15513775;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.edit-button:hover {
  background-color: #15513775;
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
.game-tier p {
  font-size:12px;
}
.champion-icons img {
  margin: 0 5px;
}

.delete-button {
  margin-right: 30px;
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

.close-button {
  margin-left: 30px;
  padding: 10px;
  background-color: transparent;
  border: 1px solid white;
  color: white;
  border-radius: 4px;
  cursor: pointer;
}

.close-button:hover {
  background-color: white;
  color: black;
}

/* 비디오 스타일 */
.background-video {
  position: relative;
  /* 자식 요소를 기준으로 위치 설정 가능 */
  width: 100vw;
  height: 100vh;
}

.background-video video {
  width: 100vw;
  height: 100vh;
  object-fit: cover;
  /* 비디오 크기를 화면에 맞게 조절 */
  position: absolute;
  /* 비디오 위치 지정 */
  z-index: 0;
  /* 기본값으로 설정 */
}

.overlay-text {
  position: absolute;
  /* 비디오 위에 텍스트 겹치기 */
  top: 30%;
  /* 화면의 중앙 */
  left: 50%;
  /* 화면의 중앙 */
  transform: translate(-50%, -50%);
  /* 정확히 중앙 정렬 */
  text-align: center;
  /* 텍스트 중앙 정렬 */
  color: white;
  /* 텍스트 색상 */
  z-index: 1;
  /* 비디오보다 위에 표시 */
}

.overlay-text h1 {
  font-size: 3rem;
  /* 원하는 크기로 조정 */
  margin-bottom: 10px;
}

.overlay-text p {
  font-size: 1.5rem;
}

.match-button {
  position: absolute;
  flex: 1;
  width: 200px;
  height: 50px;
  font-size: 16px;
  background-color: #155137;
  border: none;
  color: #fff;
  border-radius: 25px;
  cursor: pointer;
  text-align: center;
  transform: translate(-50%, 140%);
}

.match-button:hover {
  background-color: #15513775;
}
.champion-list {
  display: flex;
  gap: 5px; /* 모달 크기에 맞게 간격 축소 */
  justify-content: center;
}

.champion-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  position: relative;
}

.champion-item img {
  width: 50px; /* 기존 120px → 50px로 축소 */
  height: 50px;
}

.champion-item p {
  margin: 5px 0 0; /* 위쪽 간격 줄이기 */
  font-size: 10px; /* 기존 20px → 12px */
  font-weight: bold;
}

.most-champions-title {
  font-size: 18px; /* 기존 24px → 18px */
  font-weight: bold;
  text-align: center;
  width: 100%;
  margin-bottom: 10px; /* 간격 조정 */
}

.mastery-icon {
  width: 30px !important; /* 기존 90px → 40px */
  height: 20px !important; /* 기존 70px → 30px */
  margin-top: 38px; /* 챔피언 이미지와 겹치지 않도록 조정 */
  position: absolute;
}

.high-mastery-icon {
  width: 15px !important; /* 기존 40px → 20px */
  height: 8px !important; /* 기존 20px → 10px */
  position: absolute;
  display: flex;
  margin-left: 4px;
  margin-top: 6px;
}

.high-mastery-level {
  position: absolute;
  font-size: 8px !important; /* 기존 16px → 10px */
  color: #212121 !important;
  text-align: center;
  margin: 6px 0px 5px 7px !important; /* 크기에 맞게 조정 */
}

</style>
