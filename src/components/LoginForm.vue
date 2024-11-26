<template>
    <div class="login-page">
        <h1>로그인</h1>
        <form @submit.prevent="handleLogin">
            <div>
                <label for="userid">아이디:</label>
                <input type="text" id="userid" v-model="form.userid" placeholder="아이디를 입력하세요" required />
            </div>
            <div>
                <label for="password">비밀번호:</label>
                <input type="password" id="password" v-model="form.password" placeholder="비밀번호를 입력하세요" required />
            </div>
            <button type="submit">로그인</button>
            <p class="error-message" v-if="errorMessage">{{ errorMessage }}</p>
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
                    const errorText = await response.text();
                    this.errorMessage = errorText;
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

.error-message {
    color: red;
    margin-top: 10px;
}
</style>