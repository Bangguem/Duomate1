<template>
    <div class="chat-room">
        <!-- 상대방 정보 표시 -->
        <div class="left-panel">
            <h2>상대방 정보</h2>
            <p><strong>닉네임:</strong> {{ partner.nickname }}</p>
            <p><strong>포지션:</strong> {{ partner.position }}</p>
            <p><strong>마이크:</strong> {{ partner.microphone }}</p>
        </div>

        <!-- 채팅방 -->
        <div class="right-panel">
            <h1>채팅방</h1>
            <div class="chat-window">
                <div v-for="(message, index) in messages" :key="index" class="chat-message">
                    <strong>{{ message.username }}:</strong> {{ message.message }}
                </div>
            </div>
            <div class="chat-input">
                <input
                    type="text"
                    v-model="newMessage"
                    placeholder="메시지를 입력하세요"
                    @keyup.enter="sendMessage"
                />
                <button @click="sendMessage">전송</button>
            </div>
        </div>
    </div>
</template>

<script>
import { io } from "socket.io-client";

export default {
    data() {
        return {
            socket: null,
            messages: [],
            newMessage: "",
            roomName: this.$route.query.roomName || "알 수 없음",
            partner: {
                nickname: this.$route.query.nickname || "알 수 없음",
                position: this.$route.query.position || "알 수 없음",
                microphone: this.$route.query.microphone || "알 수 없음",
            },
            isLoggedIn: false, // 로그인 상태
            userInfo: {},
        };
    },
    methods: {
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
    resetUserData() {
      this.isLoggedIn = false;
      this.userInfo = {}; // 사용자 정보 초기화
    } ,
        sendMessage() {
            if (this.newMessage.trim() === "") return;

            // 메시지를 서버로 전송
            this.socket.emit("chat message", {
                roomName: this.roomName,
                message: this.newMessage,
            });

            // 입력창 초기화
            this.newMessage = "";
        },
    },
    mounted() {
        // 소켓 연결
        this.socket = io("http://localhost:3000", { withCredentials: true });

        // 채팅방 입장
        this.socket.emit("join room", { roomName: this.roomName });

        // 채팅 메시지 수신
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
    width: 100%;
    max-width: 800px;
}

.chat-message {
    margin-bottom: 10px;
    color: white; /* 메시지 텍스트 색상을 흰색으로 설정 */
}

.chat-input {
    display: flex;
    width: 100%;
    max-width: 800px;
    margin-top: 10px;
}

.chat-input input {
    flex: 1;
    padding: 10px;
    margin-right: 10px;
    border-radius: 5px;
    border: 1px solid #ccc;
}

.chat-input button {
    padding: 10px 20px;
    border-radius: 5px;
    border: none;
    background-color: #4caf50;
    color: white;
    cursor: pointer;
}

.chat-input button:hover {
    background-color: #45a049;
}
</style>