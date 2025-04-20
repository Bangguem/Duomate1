<template>
    <div class="reset-password">
        <h1>비밀번호 변경</h1>
        <form @submit.prevent="resetPassword">
            <div>
                <label for="newPassword">새 비밀번호:</label>
                <input type="password" id="newPassword" v-model="newPassword" placeholder="새 비밀번호를 입력하세요" required />
            </div>
            <div>
                <label for="confirmPassword">비밀번호 확인:</label>
                <input type="password" id="confirmPassword" v-model="confirmPassword" placeholder="비밀번호를 다시 입력하세요"
                    required />
            </div>
            <button type="submit">비밀번호 변경</button>
        </form>
        <p v-if="message" :class="success ? 'success' : 'error'">{{ message }}</p>
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
                const response = await fetch(`${process.env.VUE_APP_API_URL}/reset-password`, {
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
.success {
    color: green;
}

.error {
    color: red;
}
</style>