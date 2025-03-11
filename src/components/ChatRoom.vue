<template>
    <div class="chat-container">
        <!-- 왼쪽: 상대방 정보 -->
        <div class="opponent-info">
            <!-- ✅ 상대방 프로필 사진 -->
            <div class="opponent-profile-picture">
                <img :src="getOpponentProfileImage" alt="프로필 사진" class="profile-image" />
            </div>

            <!-- ✅ 상대방 닉네임 -->
            <h2>{{ getOpponent.nickname || "상대방 닉네임" }}</h2>
            <!-- ✅ 소환사 아이디 추가 -->
            <p class="summoner-name">@{{ getOpponent.SummonerName || "소환사 아이디 없음" }}{{ '#' + getOpponent.Tag || " "
                }}
            </p>

            <!-- ✅ 포지션 아이콘 (최대 2개) -->
            <div class="opponent-position-container">
                <div v-for="(pos, index) in opponentPositions" :key="index" class="position-item">
                    <img :src="getPositionIcon(pos)" alt="포지션 아이콘" class="position-icon" />
                    <p class="position-text">{{ pos }}</p>
                </div>
            </div>

            <!-- ✅ 마이크 아이콘 -->
            <div class="opponent-mic-container">
                <img :src="opponentMicrophoneIcon" alt="마이크 상태 아이콘" class="mic-icon" />
                <p class="mic-text">{{ getOpponent.microphone || "정보 없음" }}</p>
            </div>

            <!-- 인게임 정보 -->
            <div class="ingame-info">
                <!-- Game Tier -->
                <div class="ingame-tier">
                    <img :src="`https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-shared-components/global/default/${(getOpponent.summonerRank?.tier || 'unranked').toLowerCase()}.png`"
                        alt="Game Tier" class="ingame-icon" />
                    <p>Game Tier</p>
                    <p>{{ getOpponent.summonerRank?.tier || "Unranked" }} {{ getOpponent.summonerRank?.rank || " "
                    }}
                    </p>
                </div>

                <!-- Most Champions (티어 아래로 배치) -->
                <div class="ingame-champions">
                    <img src="/icons/champion.png" alt="Most Champions" class="ingame-icon" />
                    <p>Most Champion Top 3</p>
                    <p>{{ getOpponent.champions || "N/A" }}</p>
                </div>
            </div>
        </div>

        <!-- ✅ 오른쪽: 채팅창 -->
        <div class="chat-room">
            <div class="chat-header">
                <h1>채팅방</h1>
                <button @click="leaveRoom" class="leave-button">나가기</button>
            </div>

            <div class="chat-window" ref="chatWindow">
                <div v-for="(message, index) in messages" :key="index" class="chat-message"
                    :class="{ 'my-message': message.username === userInfo?.nickname, 'system-message': message.type === 'system' }">
                    <div class="message-content">
                        <span class="message-text">{{ message.message }}</span>
                    </div>
                    <!-- ✅ 메시지 전송 시간 추가 -->
                    <div class="message-meta">
                        <span class="message-time">{{ formatTime(message.timestamp) }}</span>
                    </div>
                </div>
            </div>

            <div class="chat-input">
                <input v-model="newMessage" @keyup.enter="sendMessage" placeholder="메시지를 입력하세요..." />
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
            match: null,
            matchId: null,
            userInfo: null,
            opponentDisconnected: false, // 상대방 접속 종료 여부 추가
        };
    },
    computed: {
        getOpponent() {
            if (!this.match || !this.match.players || !this.userInfo) return {};
            return (
                this.match.players.find(player => player.userid !== this.userInfo.userid) ||
                this.match.players[0] ||
                {}
            );
        },
        getOpponentProfileImage() {
            return this.getOpponent?.profileImage ||
                (this.getOpponent?.summonerInfo?.profileIconId
                    ? `http://ddragon.leagueoflegends.com/cdn/14.22.1/img/profileicon/${this.getOpponent.summonerInfo.profileIconId}.png`
                    : "/icons/default-profile.png");
        },
        opponentPositions() {
            if (!this.getOpponent || !this.getOpponent.position) {
                return ["없음"];
            }
            let positions = Array.isArray(this.getOpponent.position)
                ? this.getOpponent.position
                : String(this.getOpponent.position).split(",").map(p => p.trim());

            return positions.slice(0, 2);
        },
        getPositionIcon() {
            return position => {
                const positionIcons = {
                    "탑": "/icons/top.png",
                    "정글": "/icons/jungle.png",
                    "미드": "/icons/mid.png",
                    "원딜": "/icons/adc.png",
                    "서포터": "/icons/support.png",
                    "없음": "/icons/none.png"
                };
                return positionIcons[position] || "/icons/none.png";
            };
        },
        opponentMicrophoneIcon() {
            return this.getOpponent?.microphone === "가능"
                ? "/icons/mic-on.png"
                : "/icons/mic-off.png";
        }
    },
    watch: {
        messages: {
            handler() {
                this.$nextTick(() => {
                    this.scrollToBottom();
                });
            },
            deep: true,
        },
        match: {
            handler(newMatch) {
                if (newMatch && newMatch.roomName && !this.socket) {
                    this.setupSocket();
                }
            },
            deep: true,
        },
    },
    methods: {
        setupSocket() {
            if (this.socket || !this.matchId) return; // 중복 연결 방지 + matchId 확인

            console.log("📢 소켓 연결 시도");
            this.socket = io("http://localhost:3000", { withCredentials: true });

            this.socket.on("connect", () => {
                console.log("✅ 소켓 연결됨:", this.socket.id);
                if (this.match?.roomName) {
                    console.log("📢 방 참가 시도:", this.match.roomName);
                    this.socket.emit("join room", { roomName: this.match.roomName });
                }
            });

            this.socket.on("chat message", data => {
                console.log("💬 메시지 수신:", data);
                this.messages.push(data);
            });

            this.socket.on("user disconnected", data => {
                console.log("📢 상대방 접속 종료:", data);
                this.opponentDisconnected = true;
                this.messages.push({
                    type: "system",
                    message: `${data.nickname}님이 채팅방을 나갔습니다.`,
                });
                setTimeout(() => {
                    this.$router.push("/match");
                }, 2000);
            });

            this.socket.on("connect_error", error => {
                console.error("❌ 소켓 연결 에러:", error);
            });
        },
        leaveRoom() {
            if (this.socket && this.matchId) {
                this.socket.emit("leave room", {
                    matchId: this.matchId,
                    userId: this.userInfo?.userid,
                    nickname: this.userInfo?.nickname,
                });
                this.socket.disconnect();
            }
            this.$router.push("/match");
        },
        formatTime(timestamp) {
            if (!timestamp) return "";
            const date = new Date(timestamp);
            const hours = date.getHours().toString().padStart(2, "0");
            const minutes = date.getMinutes().toString().padStart(2, "0");
            return `${hours}:${minutes}`;
        },
        sendMessage() {
            if (this.newMessage.trim() && this.socket && this.matchId) {
                const timestamp = new Date().toISOString();
                this.socket.emit("chat message", {
                    matchId: this.matchId,
                    message: this.newMessage,
                    timestamp,
                });
                this.newMessage = "";
            } else {
                console.warn("메시지 전송 실패:", {
                    hasSocket: !!this.socket,
                    hasMatchId: !!this.matchId,
                    messageLength: this.newMessage.length,
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
                const userResponse = await fetch("http://localhost:3000/auth/check-login", {
                    credentials: "include",
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
                    this.setupSocket(); // ✅ match 데이터 로드 후 소켓 설정
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
    },
    beforeUnmount() {
        if (this.socket) {
            if (!this.opponentDisconnected) {
                this.socket.emit("leave room", {
                    matchId: this.matchId,
                    userId: this.userInfo?.userid,
                    nickname: this.userInfo?.nickname,
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
/* 전체 컨테이너 */
.chat-container {
    display: flex;
    height: 100vh;
}

/* 왼쪽: 상대방 정보 영역 */
.opponent-info {
    width: 35vw;
    background-color: rgb(25, 25, 25);
    color: white;
    text-align: center;
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
}

/* 상대방 프로필 사진 */
.opponent-profile-picture {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    overflow: hidden;
    margin-bottom: 10px;
}

.opponent-profile-picture img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
}

/* 상대방 닉네임 */
.opponent-info h2 {
    margin: 10px 0;
}

/* ✅ 소환사 아이디 스타일 */
.summoner-name {
    font-size: 14px;
    color: #bbb;
    margin-top: -5px;
    /* 닉네임과 간격 조정 */
}

/* 포지션 아이콘 영역 */
.opponent-position-container {
    display: flex;
    gap: 15px;
    justify-content: center;
    margin-bottom: 15px;
}

.position-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
}

.position-icon {
    width: 60px;
    height: 60px;
}

.position-text {
    margin-top: 5px;
    font-size: 14px;
}

/* 마이크 아이콘 영역 */
.opponent-mic-container {
    margin-top: 10px;
    text-align: center;
}

.mic-icon {
    width: 50px;
    height: 50px;
}

.mic-text {
    margin-top: 5px;
    font-size: 14px;
}

/* 인게임 정보 영역 (세로 정렬) */
.ingame-info {
    display: flex;
    flex-direction: column;
    /* 기존 가로 정렬에서 세로 정렬로 변경 */
    align-items: center;
    /* 중앙 정렬 */
    gap: 15px;
    /* 요소 간격 */
    margin-top: 20px;
}

/* 개별 인게임 정보 아이템 (Game Tier, Most Champion) */
.ingame-tier,
.ingame-champions {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
}

/* ✅ Game Tier 아이콘 스타일 */
.ingame-tier .ingame-icon {
    width: 150px;
    /* 티어 아이콘 크기 */
    height: 150px;
    margin-bottom: 5px;
    /* 아이콘과 텍스트 사이 간격 */
}

/* ✅ Most Champion 아이콘 스타일 */
.ingame-champions .ingame-icon {
    width: 40px;
    /* 챔피언 아이콘 크기 */
    height: 40px;
    margin-bottom: 5px;
}

/* 오른쪽: 채팅창 영역 */
.chat-room {
    width: 60vw;
    background-color: rgb(33, 33, 33);
    color: white;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
}

/* 채팅 헤더 */
.chat-header {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.leave-button {
    padding: 8px 16px;
    background-color: rgb(21, 81, 55);
    color: white;
    border: none;
    border-radius: 45px;
    cursor: pointer;
}

/* 채팅창 */
.chat-window {
    flex: 1;
    overflow-y: auto;
    width: 80%;
    margin-bottom: 20px;
}

/* 채팅 메시지 */
.chat-message {
    display: flex;
    flex-direction: column;
    margin-bottom: 10px;
    /* 기본은 왼쪽 정렬 */
    align-items: flex-start;
}

.my-message {
    /* 내 메시지는 오른쪽 정렬 */
    align-items: flex-end;
}

/* 메시지 내용 */
.message-content {
    background: rgb(66, 66, 66);
    padding: 10px;
    border-radius: 45px;
    max-width: 70%;
}

/* 내 메시지 내용 */
.my-message .message-content {
    background: rgb(21, 81, 55);
    color: white;
    padding: 10px;
    border-radius: 45px;
}

/* 메시지 메타 (예: 전송 시간) */
.message-meta {
    margin-top: 4px;
}

.message-time {
    font-size: 12px;
    color: #666;
}

/* 채팅 입력창 */
.chat-input {
    display: flex;
    width: 90%;
    padding: 10px;
    background: rgb(66, 66, 66);
    border-radius: 45px;
    align-items: center;
}

.chat-input input {
    flex: 1;
    padding: 10px;
    background: none;
    color: white;
    border: none;
}

.chat-input button {
    padding: 10px 20px;
    background: rgb(21, 81, 55);
    color: white;
    border: none;
    border-radius: 45px;
    cursor: pointer;
}
</style>