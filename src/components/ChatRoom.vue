<template>
    <div class="chat-room">
        <div class="left-panel">
            <h2>상대방 정보</h2>
            <p><strong>닉네임:</strong> {{ partner.nickname }}</p>
            <p><strong>포지션:</strong> {{ partner.position }}</p>
            <p><strong>마이크:</strong> {{ partner.microphone }}</p>
        </div>

        <div class="right-panel">
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
    </div>
</template>

<script>
import { io } from "socket.io-client";

export default {
    props: ["partner"],
    data() {
        return {
            socket: null,
            messages: [],
            newMessage: "",
            match: {
                partner: {
                    nickname: "알 수 없음", // 기본값 설정
                },
            }
        };
    },
    methods: {
        sendMessage() {
            if (this.newMessage.trim() === "") return;
            this.socket.emit("chat message", { message: this.newMessage });
            this.newMessage = "";
        },
    },
    mounted() {
        this.socket = io("http://localhost:3000", { withCredentials: true });

        this.socket.on("chat message", (data) => {
            this.messages.push(data);
        });
    },
};
</script>

<style scoped>
.chat-room {
    display: flex;
    height: 100vh;
}

.left-panel {
    width: 30%;
    background-color: #2e2e2e;
    color: white;
    padding: 20px;
}

.right-panel {
    width: 70%;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.chat-window {
    flex: 1;
    overflow-y: auto;
    background-color: #1f1f1f;
    padding: 10px;
    border-radius: 8px;
}

.chat-input {
    display: flex;
    width: 100%;
}

.chat-input input {
    flex: 1;
    padding: 10px;
    margin-right: 10px;
}

.chat-input button {
    padding: 10px;
}
</style>