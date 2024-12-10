<template>
    <div id="app">
    <div class="mypage-edit">
      <!-- Header Section -->
      <header class="header">
        <div class="logo">
            <div class="circle"></div>
            내 정보 변경</div>
        <nav class="nav-links">
          <a href="/" class="nav-links">Home</a>
          <a href="#" class="nav-links">Profile</a>
          <a href="#" class="nav-links">Settings</a>
        </nav>
      </header>
  
      <!-- Profile Section -->
      <section class="profile-section">
        <div class="profile-header">
          <div class="profile-picture">
            <div class="add-icon">+</div>
          </div>
          <div class="profile-info">
            <h2>{{ userInfo.ninkname }} 님</h2>
            <span class="membership">Gold Member</span>
          </div>
        </div>
      </section>
  
      <!-- Form Section -->
      <section class="form-section">
        <div class="form-container">
          <h2>프로필 편집</h2>
          <p>Update your personal information</p>
          <form>
            <input type="text" placeholder="닉네임을 입력하세요" />
            <input type="email" placeholder="이메일을 입력하세요" />
            <select>
            <option value="" disabled selected>성별을 선택하세요</option>
            <option value="male">남성</option>
            <option value="female">여성</option>
            <option value="other">기타</option>
          </select>
            <input type="text" placeholder="새 비밀번호를 입력하세요" />
            <input type="text" placeholder="새 비밀번호를 다시 입력하세요" />
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
            <img src="tier-icon.png" alt="Game Tier" />
            <p>Game Tier</p>
            <h3>Diamond I</h3>
          </div>
          <div class="detail-item">
            <img src="level-icon.png" alt="In-game Level" />
            <p>In-game Level</p>
            <h3>45</h3>
          </div>
          <button class="riot-btn">Riot 연동</button>
        </div>
      </section>
  
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
      userInfo: {},
    };
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
  .profile-info h2 {
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
  </style>
  