<template>
    
    <!-- 오른쪽에 채팅창 배치 -->
    <div class="chat-room">
           <div class="chat-header">
               <h1>채팅방</h1>
               <button @click="leaveRoom" class="leave-button">나가기</button>
           </div>

           <div class="opponent-info" v-if="getOpponent && getOpponent.nickname">
   <h2>{{ getOpponent.nickname }}</h2>
   <p>포지션: {{ getOpponent.position || '정보 없음' }}</p>
   <p>마이크: {{ getOpponent.microphone || '정보 없음' }}</p>
</div>
       <div v-else>
           <p>매칭된 상대방 정보를 불러오는 중...</p>
       </div>

       <div class="chat-window" ref="chatWindow">
           <div v-for="(message, index) in messages" :key="index" class="chat-message" :class="{
               'my-message': message.username === userInfo?.nickname,
               'system-message': message.type === 'system'
           }">
               <div class="message-content" :class="{ 'system-content': message.type === 'system' }">
                   <span v-if="message.type !== 'system'" class="username">{{ message.username }}</span>
                   <span class="message-text">{{ message.message }}</span>
               </div>
           </div>
       </div>

       <div class="chat-input">
           <input v-model="newMessage" @keyup.enter="sendMessage" placeholder="메시지를 입력하세요..." ref="messageInput" />
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
            userInfo: null
        };
    },
    computed: {
        getOpponent() {
            if (!this.match || !this.match.players || !this.userInfo) return {};
            return this.match.players.find(player => player.userid !== this.userInfo.userid) || this.match.players[0] || {};
        }
    },
    watch: {
        messages: {
            handler() {
                this.$nextTick(() => {
                    this.scrollToBottom();
                });
            },
            deep: true
        },
        match: {
            handler(newMatch) {
                if (newMatch && newMatch.roomName && !this.socket) {
                    this.setupSocket();
                }
            },
            deep: true
        }
    },
    methods: {
        setupSocket() {
            if (this.socket) return;

            console.log("📢 소켓 연결 시도");
            this.socket = io("http://localhost:3000", { withCredentials: true });

            // 소켓 연결 이벤트 핸들러
            this.socket.on("connect", () => {
                console.log("✅ 소켓 연결됨:", this.socket.id);
                if (this.match && this.match.roomName) {
                    console.log("📢 방 참가 시도:", this.match.roomName);
                    this.socket.emit("join room", { roomName: this.match.roomName });
                }
            });

            // 채팅 메시지 수신 핸들러
            this.socket.on("chat message", (data) => {
                console.log("💬 메시지 수신:", data);
                this.messages.push(data);
            });

            this.socket.on("user disconnected", (data) => {
                console.log("📢 상대방 접속 종료:", data);
                this.opponentDisconnected = true;
                this.messages.push({
                    type: 'system',
                    message: `${data.nickname}님이 채팅방을 나갔습니다.`
                });

                // 3초 후 매칭 페이지로 이동
                setTimeout(() => {
                    this.$router.push('/match');
                }, 3000);
            });

            // 소켓 에러 핸들러
            this.socket.on("connect_error", (error) => {
                console.error("❌ 소켓 연결 에러:", error);
            });
        },

        leaveRoom() {
            if (this.socket && this.matchId) {
                this.socket.emit("leave room", {
                    matchId: this.matchId,
                    userId: this.userInfo.userid,
                    nickname: this.userInfo.nickname
                });
                this.socket.disconnect();
            }
            this.$router.push('/match');
        },

        sendMessage() {
            if (this.newMessage.trim() && this.socket && this.matchId) {
                console.log("📢 메시지 전송 시도:", {
                    matchId: this.matchId,
                    message: this.newMessage
                });

                this.socket.emit("chat message", {
                    matchId: this.matchId,
                    message: this.newMessage
                });
                this.newMessage = "";
            } else {
                console.warn("⚠️ 메시지 전송 실패:", {
                    hasSocket: !!this.socket,
                    hasMatchId: !!this.matchId,
                    messageLength: this.newMessage.length
                });
            }
        },
        scrollToBottom() {
            const chatWindow = this.$refs.chatWindow;
            if (chatWindow) {
                chatWindow.scrollTop = chatWindow.scrollHeight;
            }
        },
        async fetchUserInfo() {
            try {
                const userResponse = await fetch('http://localhost:3000/auth/check-login', {
                    credentials: 'include'
                });
                const userData = await userResponse.json();

                if (userData.loggedIn) {
                    this.userInfo = userData.user;
                    console.log("✅ 사용자 정보 로드됨:", this.userInfo);
                } else {
                    console.error("❌ 사용자 정보를 가져올 수 없습니다.");
                }
            } catch (error) {
                console.error("❌ 사용자 정보 조회 오류:", error);
            }
        },
        async fetchMatchInfo() {
            if (!this.matchId) {
                console.error("❌ matchId가 없음!");
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
        }
    },
    async mounted() {
        this.matchId = this.$route.query.matchId;
        console.log("📢 ChatRoom에서 받은 matchId:", this.matchId);

        await this.fetchUserInfo();
        await this.fetchMatchInfo();
        this.setupSocket();
    },
    beforeUnmount() {
        if (this.socket) {
            if (!this.opponentDisconnected) {
                this.socket.emit("leave room", {
                    matchId: this.matchId,
                    userId: this.userInfo.userid,
                    nickname: this.userInfo.nickname
                });
            }
            console.log("📢 소켓 연결 종료");
            this.socket.disconnect();
            this.socket = null;
        }
    }
};
</script>

<style scoped>

.chat-container {
    display: flex;
    flex-direction: row; /* 세로 정렬이 아니라 가로 정렬 */
    height: 100vh;
    background-color: rgb(33, 33, 33);
}


/* 왼쪽 상대방 정보 */
.opponent-info {
    width: 300px; /* 상대방 정보 영역 크기 */
    padding: 20px;
    background-color: rgb(25, 25, 25);
    color: white;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    border-right: 2px solid rgb(50, 50, 50);
}

.chat-room {
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100vh;
    width: 300vw;
    padding: 20px;
    background-color: rgb(33, 33, 33);
    color: white; /* 기본 글자색을 하얀색으로 설정 */
}

.chat-window {
    flex: 1;
    overflow-y: auto;
    background-color: rgb(33, 33, 33);
    padding: 20px;
    border-radius: 8px;
    width: 100%;
    max-width: 800px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    margin: 20px 0;
}

.chat-message {
    margin-bottom: 15px;
    color: white;
}

.message-content {
    display: inline-block;
    max-width: 80%;
    padding: 10px 15px;
    border-radius: 15px;
    background-color: rgb(21, 81, 55);
}

.my-message {
    text-align: right;
    color: white;
}

.my-message .message-content {
    background-color: rgb(21, 81, 55);
    color: white;
}

.username {
    font-weight: bold;
    margin-right: 8px;
    font-size: 0.9em;
    color: white;
}

.message-text {
    word-break: break-word;
}

.chat-input {
    display: flex;
    width: 100%;
    max-width: 800px;
    gap: 10px;
    padding: 15px;
    background-color: rgb(66, 66, 66);
    border-radius: 45px;
    box-shadow: 0 2px 4px rgb(33, 33, 33);
}

.chat-input input {
    flex: 1;
    padding: 12px;
    border-radius: 45px;
    border: 1px solid rgb(66, 66, 66);
    font-size: 16px;
    background-color: rgb(66, 66, 66);
    color: white; /* 입력창 내 텍스트 색 */
}

.chat-input input:focus {
    outline: none;
    border-color:  rgb(21, 81, 55);
}

.chat-input button {
    padding: 12px 24px;
    border-radius: 45px;
    border: none;
    background-color:  rgb(21, 81, 55);
    color: white;
    font-size: 16px;
    cursor: pointer;
    transition: background-color 0.2s;
}

.chat-input button:hover {
    background-color: rgb(21, 81, 55);
}

.chat-header {
    width: 100%;
    max-width: 800px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.leave-button {
    padding: 8px 16px;
    background-color: rgb(21, 81, 55); 
    color: white;
    border: none;
    border-radius: 45px;
    cursor: pointer;
    transition: background-color 0.2s;
}

.leave-button:hover {
    background-color: rgb(21, 81, 55);
}

.system-message {
    text-align: center;
    margin: 10px 0;
}

.system-content {
    background-color: #f8d7da !important;
    color: #721c24 !important;
    padding: 8px 16px !important;
    border-radius: 4px !important;
    font-size: 0.9em;
}
</style>