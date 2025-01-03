<template>
    <div class="chat-room">
        <h1>채팅방</h1>
        <div class="chat-window">
            <div v-for="(message, index) in messages" :key="index" class="chat-message">
                <strong>{{ message.username }}:</strong> {{ message.message }}
            </div>
        </div>
        <div class="chat-input">
            <input type="text" v-model="newMessage" placeholder="메시지를 입력하세요" @keyup.enter="sendMessage" />
            <button @click="sendMessage">전송</button>
        </div>
    </div>
</template>

<script>
import { io } from "socket.io-client";

export default {
    props: ['partner'], // 라우터에서 전달된 partner 데이터를 받음
    data() {
        return {
            socket: null,
            messages: [], // 채팅 메시지 저장
            newMessage: "", // 입력 중인 메시지
        };
    },
    methods: {
        sendMessage() {
            if (this.newMessage.trim() === "") return;
            // 서버에 메시지 전송
            this.socket.emit("chat message", this.newMessage);
            this.newMessage = ""; // 입력창 초기화
        },
    },
    mounted() {
        console.log('Matched with partner:', this.partner); // partner 정보 확인
        this.socket = io("http://localhost:3000", { withCredentials: true });

        // 서버에서 메시지 수신
        this.socket.on("chat message", (data) => {
            this.messages.push(data); // 메시지 리스트에 추가
        });

        // 매칭 성공 시 받은 사용자 정보를 표시할 수도 있음
        const matchedUser = this.$route.params.partner;
        console.log("Matched with:", matchedUser);
    },
};
</script>

<style scoped>
.chat-room {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background-color: #2e2e2e;
    color: white;
}

.chat-window {
    width: 100%;
    max-width: 600px;
    height: 400px;
    overflow-y: auto;
    background-color: #1f1f1f;
    padding: 10px;
    border-radius: 8px;
    margin-bottom: 20px;
}

.chat-message {
    margin-bottom: 10px;
}

.chat-input {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    max-width: 600px;
}

.chat-input input {
    flex: 1;
    padding: 10px;
    margin-right: 10px;
    border: none;
    border-radius: 4px;
}

.chat-input button {
    padding: 10px 20px;
    background-color: #155137;
    border: none;
    color: white;
    border-radius: 4px;
    cursor: pointer;
}

.chat-input button:hover {
    background-color: #15513775;
}
</style>