<template>
  <div id="app">
    <div class="mypage-edit">
      <!-- Header Section -->
      <header class="header">
        <div class="logo">
          <div class="circle">
            <img src="/favicon.ico" class="circle" @click="$router.push('/')" style="cursor: pointer;" alt="" />
          </div>
          내 정보 변경
        </div>
        <nav class="nav-links">
          <div class="nav-button" @click="$router.push('/')">홈</div>
          <div class="nav-button" @click="$router.push('/board')">게시판</div>
          <div class="nav-button" @click="$router.push('/patch-notes')">패치 노트</div>
        </nav>
      </header>

      <!-- Profile Section -->
      <section class="profile-section">
        <div class="profile-header">
          <div class="profile-picture">
            <!-- <div class="add-icon" @click="triggerFileUpload">+</div> -->
            <img v-if="userInfo.summonerInfo && userInfo.summonerInfo.profileIconId"
              :src="`https://ddragon.leagueoflegends.com/cdn/${latestVersion}/img/profileicon/${userInfo.summonerInfo?.profileIconId}.png`"
              alt="Summoner Icon" />
          </div>
          <input type="file" id="file-upload" accept="image/*" ref="fileInput" @change="handleFileChange"
            style="display: none;" />
          <div class="profile-info">
            <h2>{{ userInfo.nickname }}({{ userInfo.SummonerName }}#{{ userInfo.Tag }})</h2>
          </div>
        </div>
      </section>

      <!-- Form Section -->
      <section class="form-section">
        <div class="form-container">
          <h2>프로필 편집</h2>
          <p>Update your personal information</p><br />
          <form @submit.prevent="updateUserProfile">
            <label for="birthdate">닉네임</label>
            <input id="nickname" type="text" :placeholder="userInfo.nickname || '닉네임을 입력하세요'"
              v-model="userInfo.nickname" />
            <label for="birthdate">이메일</label>
            <input type="email" :placeholder="userInfo.email || '메일을 입력하세요'" v-model="userInfo.email" />
            <label for="introductin">자기소개</label>
            <input type="text" :placeholer="userInfo.introduction || '자기소개를 입력하세요(40자 이내)'"
              v-model="userInfo.introduction" />
            <!-- <select id="gender" v-model="userInfo.gender">
              <option value="" disabled>성별을 선택하세요</option>
              <option value="male">남성</option>
              <option value="female">여성</option>
              <option value="other">기타</option>
            </select> -->
            <!-- <label for="birthdate">생년월일</label>
            <input id="birthdate" type="date" v-model="userInfo.birthdate" /> -->
            <button type="submit" class="submit-btn">저장</button>
          </form>
        </div>

      </section>

      <!-- Gaming Information Section -->
      <section class="gaming-info">
        <h2>소환사 정보</h2>
        <br />
        <p v-if="!userInfo.SummonerName">연동이 필요합니다.</p>

        <div class="gaming-details">
          <div class="detail-item">
            <img v-if="!userInfo.summonerRank?.[0]?.tier && userInfo.summonerInfo" src="@/assets/Rank/unranked.png"
              alt="">
            <p v-if="!userInfo.summonerRank?.[0]?.tier && userInfo.summonerInfo">랭크 정보 없음</p>
            <img v-if="userInfo.summonerRank && userInfo.summonerRank?.[0]?.tier"
              :src="require(`@/assets/Rank/Rank=${userInfo.summonerRank?.[0]?.tier}.png`)" alt="" />
            <p v-if="userInfo.summonerRank && userInfo.summonerRank?.[0]?.tier">Game Tier</p>
            <h3>{{ userInfo.summonerRank?.[0]?.tier || "" }} {{ userInfo.summonerRank?.[0]?.rank || "" }}</h3>
          </div>
          <div class="most-played-champions">
            <h2 class="most-champions-title" v-if="(userInfo.top5Champions || [])[0]?.iconUrl">Most Champions</h2>
            <!-- 리스트 밖으로 이동 -->
            <br />
            <div class="champion-list">
              <div class="champion-item">
                <img v-if="(userInfo.top5Champions || [])[1]?.iconUrl" :src="userInfo.top5Champions[1]?.iconUrl"
                  alt="Champion Image" />
                <!-- 숙련도 이미지 -->
                <img v-if="(userInfo.top5Champions || [])[1]?.masteryLevel < 10"
                  :src="require(`@/assets/Mastery/${userInfo.top5Champions[1]?.masteryLevel}.webp`)"
                  class="mastery-icon" alt="Mastery Level" />
                <img
                  v-if="(userInfo.top5Champions || [])[1]?.iconUrl && (userInfo.top5Champions || [])[1]?.masteryLevel >= 10"
                  src="@/assets/Mastery/10.webp" class="mastery-icon" alt="Mastery Level" />

                <!-- 숙련도 레벨이 10 이상이면 추가 이미지 + 숙련도 레벨 표시 -->
                <div v-if="(userInfo.top5Champions || [])[1]?.masteryLevel >= 10" class="mastery-wrapper">
                  <img src="@/assets/Mastery/level.webp" class="high-mastery-icon" alt="High Mastery" />
                  <p class="high-mastery-level">{{ (userInfo.top5Champions || [])[1]?.masteryLevel }}</p>
                </div>
                <br />
                <p>{{ (userInfo.top5Champions || [])[1]?.championName || "" }}</p>
              </div>
              <div class="champion-item">
                <img v-if="(userInfo.top5Champions || [])[0]?.iconUrl" :src="userInfo.top5Champions[0]?.iconUrl"
                  alt="Champion Image" />
                <!-- 숙련도 이미지 -->
                <img v-if="(userInfo.top5Champions || [])[0]?.masteryLevel < 10"
                  :src="require(`@/assets/Mastery/${userInfo.top5Champions[0]?.masteryLevel}.webp`)"
                  class="mastery-icon" alt="Mastery Level" />
                <img
                  v-if="(userInfo.top5Champions || [])[0]?.iconUrl && (userInfo.top5Champions || [])[0]?.masteryLevel >= 10"
                  src="@/assets/Mastery/10.webp" class="mastery-icon" alt="Mastery Level" />

                <!-- 숙련도 레벨이 10 이상이면 추가 이미지 + 숙련도 레벨 표시 -->
                <div v-if="(userInfo.top5Champions || [])[0]?.masteryLevel >= 10" class="mastery-wrapper">
                  <img src="@/assets/Mastery/level.webp" class="high-mastery-icon" alt="High Mastery" />
                  <p class="high-mastery-level">{{ (userInfo.top5Champions || [])[0]?.masteryLevel }}</p>
                </div>
                <br />
                <p>{{ (userInfo.top5Champions || [])[0]?.championName || "" }}</p>
              </div>
              <div class="champion-item">
                <img v-if="(userInfo.top5Champions || [])[2]?.iconUrl" :src="userInfo.top5Champions[2]?.iconUrl"
                  alt="Champion Image" />
                <!-- 숙련도 이미지 -->
                <img v-if="(userInfo.top5Champions || [])[2]?.masteryLevel < 10"
                  :src="require(`@/assets/Mastery/${userInfo.top5Champions[2]?.masteryLevel}.webp`)"
                  class="mastery-icon" alt="Mastery Level" />
                <img
                  v-if="(userInfo.top5Champions || [])[2]?.iconUrl && (userInfo.top5Champions || [])[2]?.masteryLevel >= 10"
                  src="@/assets/Mastery/10.webp" class="mastery-icon" alt="Mastery Level" />

                <!-- 숙련도 레벨이 10 이상이면 추가 이미지 + 숙련도 레벨 표시 -->
                <div v-if="(userInfo.top5Champions || [])[2]?.masteryLevel >= 10" class="mastery-wrapper">
                  <img src="@/assets/Mastery/level.webp" class="high-mastery-icon" alt="High Mastery" />
                  <p class="high-mastery-level">{{ (userInfo.top5Champions || [])[2]?.masteryLevel }}</p>
                </div>
                <br />
                <p>{{ (userInfo.top5Champions || [])[2]?.championName || "" }}</p>
              </div>
            </div>
          </div>

        </div>


        <br /><br /><button class="riot-btn" @click="showRiotModal = true">Riot 연동</button>
      </section>
      <!-- Riot 연동 모달 -->
      <div v-if="showRiotModal == true" class="modal">
        <div class="modal-content">
          <h2>Riot 연동</h2>
          <label for="summoner">소환사 이름</label>
          <input type="text" v-model="summonerName" placeholder="소환사 이름 입력" />
          <label for="tag">태그</label>
          <input type="text" v-model="tag" placeholder="태그 입력 (예: KR1)" />
          <button type="button" @click="linkRiotAccount">연동하기</button>
          <button @click="showRiotModal = false">닫기</button>
        </div>
      </div>

    </div>
  </div>
</template>
<script>
export default {
  name: 'MypageEdit',
  data() {
    return {
      userInfo: {
        nickname: '', // 닉네임 초기값
        email: '',
        gender: '',
        birthdate: '',
        top5Champions: [],
        introduction: '',
      },
      riotInfo: {
        summonerRank: [],
        summonerInfo: {
          summonerLevel: '',
          profileIconId: '',
        },

      },
      showRiotModal: false,
      summonerName: '',
      tag: '',
    };
    // if (this.userInfo.password !== this.userInfo.passwordcheck) {
    //           alert('비밀번호가 일치하지 않습니다.');
    //           return;
    //       }
  },
  mounted() {
    this.checkLoginStatus();
    console.log("챔피언 데이터 (초기 로드):", this.userInfo.top5Champions);
    console.log("챔피언 데이터 (초기 로드):", this.riotInfo.top5Champions);
    this.fetchLatestVersion();
  },
  methods: {
    async fetchLatestVersion() {
      try {
        const response = await fetch("https://ddragon.leagueoflegends.com/api/versions.json");
        const versions = await response.json();
        this.latestVersion = versions[0]; // 가장 최신 버전 사용
      } catch (error) {
        console.error("Failed to fetch Data Dragon version:", error);
      }
    },
    async checkLoginStatus() {
      try {
        const response = await fetch(`${process.env.VUE_APP_API_URL}/auth/check-login`, {
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

    async updateUserProfile() {
      try {
        const response = await fetch(`${process.env.VUE_APP_API_URL}/change-userprofile`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // 쿠키를 포함한 요청
          body: JSON.stringify({
            nickname: this.userInfo.nickname,
            birthdate: this.userInfo.birthdate,
            gender: this.userInfo.gender,
            email: this.userInfo.email,
            introduction: this.userInfo.introduction
          }),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            alert('내 정보가 성공적으로 업데이트되었습니다.');
          } else {
            alert(result.message || '내 정보 변경 실패');
          }
        } else {
          console.error('Error updating profile:', response.statusText);
          alert('서버 요청에 실패했습니다.');
        }
      } catch (error) {
        console.error('Error updating profile:', error);
        alert('알 수 없는 오류가 발생했습니다.');
      }
    },


    async linkRiotAccount() {
      console.log("연동하기 버튼 클릭됨"); // 디버깅 로그

      if (!this.summonerName || !this.tag) {
        alert("소환사 이름과 태그를 입력해주세요.");
        return;
      }

      try {

        console.log("소환사 이름:", this.summonerName);
        console.log("태그:", this.tag);

        console.log("연동 요청 보냄:", this.summonerName, this.tag);  // 요청 전 콘솔 로그 추가
        const response = await fetch(`${process.env.VUE_APP_API_URL}/summonerInfo`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            userid: this.userInfo.userid,
            summonerName: this.summonerName,
            tag: this.tag,
          }),
        });
        console.log("서버 응답 상태 코드:", response.status); // 응답 상태 확인
        const result = await response.json();
        console.log("서버 응답 데이터:", result); // 응답 데이터 확인

        if (result.success) {
          alert("라이엇 연동 완료");
          // Riot API 데이터 업데이트
          this.riotInfo = {
            tier: result.tier || "정보 없음",
            summonerLevel: result.summonerLevel || "정보 없음",
            profileIconId: result.profileIconId || '',
            top5Champions: result.top5Champions || [],
          };

          this.showRiotModal = false;
          window.location.reload();
        } else {
          alert("라이엇 연동 실패: " + result.message);
        }
      } catch (error) {
        console.error("Error linking Riot account:", error);
        alert("연동 중 오류가 발생했습니다.");
      }
    },
  }
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
  background-color: #212121
}

body {
  margin: 0;
  font-family: Arial, sans-serif;
  background-color: #212121;
}

#app {
  margin: 0;
  display: flex;
  flex-direction: column;
  width: 140%;
  height: 180%;
  background-color: #212121;
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


/* Profile Section */
.profile-section {
  display: flex;
  align-items: center;
  padding: 20px 0;
  background-color: #212121;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 20px;
}

.profile-picture {
  width: 100px;
  height: 100px;
  background-color: #424242;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  color: #fff;
  position: relative;
  margin-left: 240px;
}

.profile-picture img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.add-icon {
  font-size: 24px;
  position: absolute;
  bottom: -10px;
  right: -10px;
  background-color: #424242;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-info h2,
.profile-info data {
  margin: 0;
  font-size: 24px;
  color: #FAFAFA;
}

.membership {
  font-size: 14px;
  color: #ccc;
}

/* Form Section */
.form-section {
  padding: 20px;
}

.form-container {
  background-color: #212121;
  padding: 20px;
  border-radius: 10px;
  color: #FAFAFA;
  margin: 20px 200px;
}

.form-container label {
  color: #FAFAFA;
  font-size: 14px;
}

form {
  display: flex;
  flex-direction: column;
  gap: 15px;
  width: 100;
  height: 100;
}

input,
select {
  padding: 10px;
  font-size: 14px;
  border: none;
  border-radius: 5px;
  background-color: #FAFAFA;
  color: #212121;
}

select {
  cursor: pointer;
  color: #757575;
}

.submit-btn {
  background-color: #0064006d;
  color: #fff;
  border: none;
  padding: 10px;
  border-radius: 5px;
  cursor: pointer;
}

/* Gaming Information Section */
.gaming-info {
  padding: 20px 0;
  color: #FAFAFA;
  align-items: center;
}

.gaming-info h2,
.gaming-info p {
  color: #FAFAFA;
  margin-left: 240px;
}

.gaming-details {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 20px 0;
  color: #FAFAFA;
  width: 100%;
  text-align: center;
  align-items: center;
  align-content: center;

}

.detail-item {
  text-align: center;
  margin-left: 250px;
}

.detail-item img {
  width: 200px;
  height: 200px;
}

.detail-item p {
  margin: 0;
}

.riot-btn {
  background-color: #0064006d;
  color: #fff;
  border: none;
  padding: 10px;
  border-radius: 5px;
  cursor: pointer;
  width: 200px;
  height: 40px;
  justify-content: center;
  margin-left: 42%;
}

/* Footer */
footer {
  text-align: center;
  margin-top: 20px;
}

.logout-btn {
  background-color: transparent;
  border: 1px solid #fff;
  color: #fff;
  padding: 10px;
  border-radius: 5px;
  cursor: pointer;
}

/* Riot 연동 모달 스타일 */
.modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #212121;
  padding: 20px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  border-radius: 10px;
  color: #FAFAFA;
  width: 400px;
  height: 300px;
}

.modal-content {
  display: flex;
  flex-direction: column;
}

.modal-content h2 {
  margin-bottom: 10px;
}

.modal-content input {
  margin: 5px 0;
  padding: 8px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 5px;
}

.modal-content button {
  margin-top: 10px;
  padding: 8px;
  border: none;
  cursor: pointer;
  background-color: #0064006d;
  color: #FAFAFA;
  border-radius: 5px;
}

/* Most Played Champions 스타일 */
.most-played-champions {
  display: flex;
  flex-direction: column;
  align-items: center;
  /* 내부 요소들을 수직 정렬 */
  margin-right: 80px;
}

.champion-list {
  display: flex;
  gap: 10px;
  justify-content: center;
  /* 챔피언 이미지를 가로 정렬 */
}

.champion-item {
  position: relative;
  width: 120px;
  height: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.champion-item img {
  width: 120px;
  /* 이미지 크기 */
  height: 120px;
}

.champion-item p {
  display: flex;
  margin: 10px 0 0;
  /* 위쪽 간격 추가 */
  font-size: 20px;
  font-weight: bold;
  /* 글씨 두껍게 */
  white-space: normal;
  /* 줄바꿈 허용 */
  word-break: keep-all;
  /* 단어 단위 줄바꿈 */

}

.most-champions-title {
  font-size: 24px;
  font-weight: bold;
  text-align: center;
  width: 100%;
  margin-right: 240px;
}

.champion-item .mastery-icon {
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  width: 70px;
  height: 50px;
  z-index: 2;
}

.most-played-champions .champion-item .mastery-wrapper {
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  width: 70px;
  height: 50px;
  z-index: 3;
}

.most-played-champions .champion-item .high-mastery-icon {
  bottom: -6px;
  width: 38px;
  height: 18px;
  position: absolute;
  left: 16px;
}

.most-played-champions .champion-item .high-mastery-level {
  bottom: -18px;
  position: absolute;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 16px;
  font-weight: bold;
  color: #212121;
  z-index: 4;
}
</style>