<template>
    <div class="match-room">
        <div class="user-info">
            <h2>내 정보</h2>
            <p>닉네임: {{ self.nickname }}</p>
            <p>나이: {{ self.age }}</p>
        </div>
        <div class="chat-box">
            <h2>채팅</h2>
            <div class="messages">
                <div v-for="msg in messages" :key="msg.id">
                    <strong>{{ msg.username }}:</strong> {{ msg.message }}
                </div>
            </div>
            <input type="text" v-model="message" @keyup.enter="sendMessage" />
        </div>
        <div class="partner-info">
            <h2>상대방 정보</h2>
            <p>닉네임: {{ partner.nickname }}</p>
            <p>나이: {{ partner.age }}</p>
        </div>
        <button @click="leaveRoom">채팅방 나가기</button>
    </div>
</template>

<script>
export default {
    props: ['socket', 'self', 'partner'],
    data() {
        return {
            message: '',
            messages: [], // 채팅 메시지 리스트
        };
    },
    methods: {
        sendMessage() {
            if (this.message.trim()) {
                this.socket.emit('chat message', this.message);
                this.message = '';
            }
        },
        leaveRoom() {
            this.socket.emit('cancel match');
            this.$emit('change-view', 'MatchQueue'); // MatchQueue 화면으로 전환
        },
    },
    mounted() {
        this.socket.on('chat message', (msg) => {
            this.messages.push(msg); // 메시지 추가
        });
    },
};
</script>

<style scoped>
.match-room {
    text-align: center;
    margin: 20px;
}
</style>