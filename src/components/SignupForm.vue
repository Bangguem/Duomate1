<template>
    <div id="app">
    <div class="signup-container">
      <header class="header">
        <div class="logo">
        <div class="circle"></div>
        <span>회원가입</span>
        </div>
        <nav>
          <a href="#">홈 화면</a>
          <a href="#">로그인</a>
          <a href="#">Contact</a>
        </nav>
      </header>
      <main>
        <div class="form-container">
          <h2>계정 생성</h2>
          <p>계정 생성에 필요한 정보를 입력해주세요. (<a style="color:red;">*</a>은 필수 항목입니다.)</p>
          <form @submit.prevent="handleSubmit">
            <div class="form-group">
              <label for="userid">아이디 <a style="color:red;">*</a></label>
              <input id="userid" type="text" placeholder="아이디를 입력해주세요" v-model="form.userid" @input="checkDuplicateUserId" required />
              <div :style="{ color: duplicateCheck.color }">{{ duplicateCheck.message }}</div>
            </div>
            <div class="form-group">
              <label for="password">비밀번호 <a style="color:red;">*</a></label>
              <input id="password" type="password" placeholder="비밀번호를 입력해주세요" v-model="form.password" required />
            </div>
            <div class="form-group">
              <label for="passwordcheck">비밀번호 확인 <a style="color:red;">*</a></label>
              <input
                id="passwordcheck"
                type="password"
                placeholder="비밀번호를 입력해주세요" v-model="form.passwordcheck"
                required
              />
            </div>
            <div class="form-group">
              <label for="email">이메일</label>
              <input id="email" type="email" v-model="form.email" placeholder="이메일을 입력해주세요" />
            </div>
            <div class="form-group">
              <label for="nickname">닉네임 <a style="color:red;">*</a></label>
              <input id="nickname" type="text" placeholder="닉네임을 입력해주세요" v-model="form.nickname" required />
            </div>
            <div class="form-group">
              <label for="birthdate">생년월일</label>
              <input id="birthdate" type="date" v-model="form.birthdate" placeholder="생년월일을 입력해주세요" />
            </div>
            <div class="form-group">
              <label for="gender">성별</label>
              <select id="gender" v-model="form.gender" require>
                <option value="male">남성</option>
                <option value="female">여성</option>
                <option value="other">기타</option>
              </select>
            </div>
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
                gender: 'male',
            },
            duplicateCheck: {
                message: '',
                color: '',
            },
        };
    },
    methods: {
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
                    window.location.href = '/';
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
/* 기본 스타일 */
form {
    max-width: 400px;
    margin: 0 auto;
}

label {
    display: block;
    margin-top: 10px;
}

input,
select,
button {
    margin-top: 5px;
    display: block;
    width: 100%;
    padding: 8px;
    font-size: 16px;
}

button {
    margin-top: 20px;
    background-color: #4caf50;
    color: white;
    border: none;
    cursor: pointer;
}

button:hover {
    background-color: #45a049;
}
</style>
