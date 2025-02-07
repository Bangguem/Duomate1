<template>
    <div id="app">
    <div class="mypage-edit">
      <!-- Header Section -->
      <header class="header">
        <div class="logo">
            <div class="circle"></div>
            내 정보 변경</div>
        <nav class="nav-links">
          <a href="/" class="nav-links">홈</a>
          <a href="#" class="nav-links">공지</a>
          <a href="#" class="nav-links">게시판</a>
        </nav>
      </header>
  
      <!-- Profile Section -->
      <section class="profile-section">
        <div class="profile-header">
          <div class="profile-picture">
            <div class="add-icon" @click="triggerFileUpload">+</div>
            <img v-if="userInfo.profileImage" :src="userInfo.profileImage" alt="Profile Picture" />
          </div>
          <input
            type="file"
            id="file-upload"
            accept="image/*"
            ref="fileInput"
            @change="handleFileChange"
            style="display: none;"
          />
          <div class="profile-info">
            <h2>{{ userInfo.nickname }} 님</h2>
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
            <input id="nickname" type="text" :placeholder="userInfo.nickname || '닉네임을 입력하세요'" v-model="userInfo.nickname" />
            <label for="birthdate">이메일</label>
            <input type="email" :placeholder="userInfo.email || '메일을 입력하세요'" v-model="userInfo.email" />
            <label for="birthdate">성별</label>
            <select id="gender" v-model="userInfo.gender">
            <option value="" disabled>성별을 선택하세요</option>
            <option value="male">남성</option>
            <option value="female">여성</option>
            <option value="other">기타</option>
          </select>
          <label for="birthdate">생년월일</label>
          <input id="birthdate" type="date" v-model="userInfo.birthdate" />
            <!-- <input type="text" placeholder="새 비밀번호를 입력하세요" />
            <input type="text" placeholder="새 비밀번호를 다시 입력하세요" /> -->
            <button type="submit" class="submit-btn">저장</button>
          </form>
        </div>
        
      </section>
  
      <!-- Gaming Information Section -->
      <section class="gaming-info">
        <h2>Gaming Information</h2>
        <p>Your gaming details</p>
        <div class="gaming-details">
          <div class="detail-item">
            <img src="tier-icon.png" alt="" />
            <p>Game Tier</p>
            <h3>{{ riotInfo.tier || "정보 없음" }}</h3>
          </div>
          <div class="detail-item">
            <img src="level-icon.png" alt="" />
            <p>In-game Level</p>
            <h3>{{ riotInfo.level || "정보 없음" }}</h3>
          </div>
          <button class="riot-btn" @click="showRiotModal=true">Riot 연동</button>
        </div>
      </section>
      <!-- Riot 연동 모달 -->
      <div v-if="showRiotModal==true" class="modal">
        <div class="modal-content">
          <h2>Riot 연동</h2>
          <label for="summoner">소환사 이름</label>
          <input type="text" v-model="summonerName" placeholder="소환사 이름 입력" />
          <label for="tag">태그</label>
          <input type="text" v-model="tag" placeholder="태그 입력 (예: KR1)" />
          <button @click="linkRiotAccount">연동하기</button>
          <button @click="showRiotModal=false">닫기</button>
        </div>
      </div>
  
      <!-- Footer -->
      <footer>
        <button class="logout-btn">로그아웃</button>
      </footer>
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
        password: '',
        passwordcheck: '',
        profileImage: '',
      },
      riotInfo: {
        tier: "",
        level: "",
      },
      showRiotModal: false,
      summonerName: "",
      tag: "",
    };
    // if (this.userInfo.password !== this.userInfo.passwordcheck) {
    //           alert('비밀번호가 일치하지 않습니다.');
    //           return;
    //       }
  },
  mounted() {
    this.checkLoginStatus();
  },
  methods: {
    // 파일 업로드 트리거
    triggerFileUpload() {
      this.$refs.fileInput.click();
    },
     // 파일 변경 처리
     handleFileChange(event) {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.userInfo.profileImage = e.target.result; // 이미지 미리보기
        };
        reader.readAsDataURL(file);

        // 여기에서 선택된 파일을 서버로 업로드하는 로직 추가 가능
        this.uploadProfileImage(file);
      }
    },
    // 서버로 이미지 업로드
    async uploadProfileImage(file) {
      const formData = new FormData();
      formData.append("profileImage", file);

      try {
        const response = await fetch("http://localhost:3000/upload-profile-image", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          console.log(result); // 서버로부터 받은 데이터를 콘솔에 출력
          alert("프로필 사진이 업데이트되었습니다.");
        } else {
          console.error("Error uploading profile image:", response.statusText);
          alert("이미지 업로드에 실패했습니다.");
        }
      } catch (error) {
        console.error("Error uploading profile image:", error);
        alert("알 수 없는 오류가 발생했습니다.");
      }
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

    async updateUserProfile() {
    try {
      const response = await fetch('http://localhost:3000/change-userprofile', {
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
  },
    
    async linkRiotAccount() {
      if (!this.summonerName || !this.tag) {
        alert("소환사 이름과 태그를 입력해주세요.");
        return;
      }

      try {
        const response = await fetch("http://localhost:3000/summonerInfo", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            summoner: `${this.summonerName}#${this.tag}`,
          }),
        });

        const result = await response.json();
        if (result.success) {
          alert("라이엇 연동 성공!");
          this.riotInfo = {
            tier: result.tier || "정보 없음",
            level: result.level || "정보 없음",
          };
          this.closeRiotModal();
        } else {
          alert("라이엇 연동 실패: " + result.message);
        }
      } catch (error) {
        console.error("Error linking Riot account:", error);
        alert("연동 중 오류가 발생했습니다.");
      }
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
  width : 140vw;
  height : 140vh;
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
  
  /* Profile Section */
  .profile-section {
    display: flex;
    align-items: center;
    padding: 20px 0;
    background-color: #757575;
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
    margin-left:240px;
  }
  .profile-picture img {
  width: 100%;
  height: 100%;
  object-fit: cover;
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
  .profile-info h2, .profile-info data {
    margin: 0;
    font-size: 24px;
    color: #212121;
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
    color:#FAFAFA;
    margin: 20px 200px;
  }
  .form-container label{
    color:#FAFAFA;
    font-size:14px;
  }
  form {
    display: flex;
    flex-direction: column;
    gap: 15px;
    width : 100;
    height : 100;
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
    background-color: #006400;
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
  }
  .gaming-info h2, 
  .gaming-info p{
    color: #FAFAFA;
    margin-left:240px;
  }
  .gaming-details {
    display: flex;
    justify-content: space-around;
    align-items: center;
    padding: 20px 0;
    color: #FAFAFA;
  }
  .detail-item {
    text-align: center;
  }
  .detail-item img {
    width: 80px;
    height: 80px;
  }
  .riot-btn {
    background-color: #006400;
    color: #fff;
    border: none;
    padding: 10px;
    border-radius: 5px;
    cursor: pointer;
    margin-right: 50px;
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
  color:#FAFAFA;
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
  background-color: #006400;
  color:#FAFAFA;
  border-radius: 5px;
}

.riot-btn {
  background-color: #006400;
  color: white;
  padding: 10px;
  border-radius: 5px;
}
  </style>
  