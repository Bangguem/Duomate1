<template>
    <div>
        <h1>Signup</h1>
        <form @submit.prevent="handleSubmit">
            <div>
                <label for="userid">User ID:</label>
                <input type="text" id="userid" v-model="form.userid" @input="checkDuplicateUserId" required />
                <div :style="{ color: duplicateCheck.color }">{{ duplicateCheck.message }}</div>
            </div>

            <div>
                <label for="password">비밀번호:</label>
                <input type="password" id="password" v-model="form.password" required />
            </div>

            <div>
                <label for="passwordcheck">비밀번호 확인:</label>
                <input type="password" id="passwordcheck" v-model="form.passwordcheck" required />
            </div>

            <div>
                <label for="email">이메일:</label>
                <input type="email" id="email" v-model="form.email" required />
            </div>

            <div>
                <label for="nickname">닉네임:</label>
                <input type="text" id="nickname" v-model="form.nickname" required />
            </div>

            <div>
                <label for="birthdate">생년월일:</label>
                <input type="date" id="birthdate" v-model="form.birthdate" required />
            </div>

            <div>
                <label for="gender">성별:</label>
                <select id="gender" v-model="form.gender" required>
                    <option value="male">남성</option>
                    <option value="female">여성</option>
                    <option value="other">기타</option>
                </select>
            </div>

            <button type="submit">Sign Up</button>
        </form>
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