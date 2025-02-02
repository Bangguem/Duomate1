<template>
    <div class="chat-room">
        <h1>채팅방</h1>

        <div v-if="match && match.players">
            <h2>상대방: {{ getOpponent.nickname }}</h2>
            <p>포지션: {{ getOpponent.position }}</p>
            <p>마이크: {{ getOpponent.microphone }}</p>
        </div>
        <div v-else>
            <p>매칭된 상대방 정보를 불러오는 중...</p>
        </div>

        <div class="chat-window">
            <div v-for="(message, index) in messages" :key="index">
                <strong>{{ message.username }}:</strong> {{ message.message }}
            </div>
        </div>

        <div class="chat-input">
            <input v-model="newMessage" @keyup.enter="sendMessage" />
            <button @click="sendMessage">전송</button>
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
            match: null,
            matchId: null,
            userInfo: null  // userInfo 추가
        };
    },
    computed: {
        getOpponent() {
            if (!this.match || !this.match.players || !this.userInfo) return {};
            // userInfo가 없으면 첫 번째 플레이어 정보 반환
            return this.match.players.find(player => player.userid !== this.userInfo.userid) || this.match.players[0] || {};
        }
    },
    async mounted() {
        // 사용자 정보 가져오기
        try {
            const userResponse = await fetch('http://localhost:3000/auth/check-login', {
                credentials: 'include'
            });
            const userData = await userResponse.json();

            if (userData.loggedIn) {
                this.userInfo = userData.user;
            } else {
                console.error("❌ 사용자 정보를 가져올 수 없습니다.");
                return;
            }
        } catch (error) {
            console.error("❌ 사용자 정보 조회 오류:", error);
            return;
        }

        this.matchId = this.$route.query.matchId;
        console.log("📢 ChatRoom에서 받은 matchId:", this.matchId);

        if (!this.matchId) {
            console.error("❌ matchId가 없음! 페이지 이동 오류");
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/match/get/${this.matchId}`, {
                method: "GET",
                credentials: "include",
            });

            const data = await response.json();
            console.log("🔹 서버에서 받은 매칭 데이터:", data);

            if (data.success) {
                this.match = data.match;
            } else {
                console.error("❌ 매칭 정보를 찾을 수 없습니다.");
            }
        } catch (error) {
            console.error("❌ 매칭 정보 가져오기 오류:", error);
        }

        if (this.match && this.match.roomName) {
            this.socket = io("http://localhost:3000", { withCredentials: true });
            this.socket.emit("join room", { roomName: this.match.roomName });

            this.socket.on("chat message", (data) => {
                this.messages.push(data);
            });
        }
    },
    methods: {
        sendMessage() {
            if (this.newMessage.trim() && this.socket) {
                this.socket.emit("chat message", {
                    message: this.newMessage,
                    username: this.userInfo?.nickname || 'Anonymous'
                });
                this.newMessage = "";
            }
        }
    }
};
</script>

<style scoped>
.chat-room {
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100vh;
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
    color: white;
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