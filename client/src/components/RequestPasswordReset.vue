<template>
    <div class="request-password-reset">
        <h1>비밀번호 재설정 요청</h1>
        <form @submit.prevent="requestResetLink">
            <div>
                <label for="email">이메일:</label>
                <input type="email" id="email" v-model="email" placeholder="이메일을 입력하세요" required />
            </div>
            <button type="submit">비밀번호 재설정 링크 보내기</button>
        </form>
        <p v-if="message" :class="success ? 'success' : 'error'">{{ message }}</p>
    </div>
</template>

<script>
export default {
    data() {
        return {
            email: '',
            message: '',
            success: false,
        };
    },
    methods: {
        async requestResetLink() {
            try {
                const response = await fetch(`${process.env.VUE_APP_API_URL}/request-password-reset`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: this.email }),
                });

                const result = await response.json();
                this.success = result.success;
                this.message = result.message;
            } catch (error) {
                console.error('Error requesting password reset:', error);
                this.success = false;
                this.message = '비밀번호 재설정 요청 중 오류가 발생했습니다.';
            }
        },
    },
};
</script>

<style scoped>
.success {
    color: green;
}

.error {
    color: red;
}
</style>