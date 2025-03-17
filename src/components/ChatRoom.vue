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
            <p class="summoner-name">@{{ getOpponent.SummonerName || "소환사 아이디 없음" }}{{ '#' + getOpponent.Tag || "" }}
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
                    <p>{{ getOpponent.summonerRank?.tier || "Unranked" }} {{ getOpponent.summonerRank?.rank || "" }}</p>
                </div>

                <!-- ✅ Most Champions (한 줄로 정렬 + 아이콘 아래 이름 표시) -->
                <div class="most-played-champions">
                    <h2 class="most-champions-title" v-if="(getOpponent.top5Champions || [])[0]?.iconUrl">
                        Most Champions
                    </h2>
                    <br />
                    <div class="champion-list">
                        <!-- 챔피언 아이템 1 (인덱스 1) -->
                        <div class="champion-item">
                            <img v-if="(getOpponent.top5Champions || [])[1]?.iconUrl"
                                :src="getOpponent.top5Champions[1]?.iconUrl" alt="Champion Image" />
                            <!-- 숙련도 관련 컨테이너 추가 -->
                            <div class="mastery-wrapper">
                                <img v-if="(getOpponent.top5Champions || [])[1]?.masteryLevel < 10"
                                    :src="require(`@/assets/Mastery/${getOpponent.top5Champions[1]?.masteryLevel}.webp`)"
                                    class="mastery-icon" alt="Mastery Level" />
                                <img v-if="(getOpponent.top5Champions || [])[1]?.iconUrl && (getOpponent.top5Champions || [])[1]?.masteryLevel >= 10"
                                    src="@/assets/Mastery/10.webp" class="mastery-icon" alt="Mastery Level" />
                                <!-- 숙련도 레벨이 10 이상일 때 오버레이 -->
                                <div v-if="(getOpponent.top5Champions || [])[1]?.masteryLevel >= 10">
                                    <img src="@/assets/Mastery/level.webp" class="high-mastery-icon"
                                        alt="High Mastery" />
                                    <p class="high-mastery-level">{{ (getOpponent.top5Champions || [])[1]?.masteryLevel
                                        }}</p>
                                </div>
                            </div>
                            <br />
                            <p>{{ (getOpponent.top5Champions || [])[1]?.championName || "" }}</p>
                        </div>

                        <!-- 챔피언 아이템 2 (인덱스 0) -->
                        <div class="champion-item">
                            <img v-if="(getOpponent.top5Champions || [])[0]?.iconUrl"
                                :src="getOpponent.top5Champions[0]?.iconUrl" alt="Champion Image" />
                            <div class="mastery-wrapper">
                                <img v-if="(getOpponent.top5Champions || [])[0]?.masteryLevel < 10"
                                    :src="require(`@/assets/Mastery/${getOpponent.top5Champions[0]?.masteryLevel}.webp`)"
                                    class="mastery-icon" alt="Mastery Level" />
                                <img v-if="(getOpponent.top5Champions || [])[0]?.iconUrl && (getOpponent.top5Champions || [])[0]?.masteryLevel >= 10"
                                    src="@/assets/Mastery/10.webp" class="mastery-icon" alt="Mastery Level" />
                                <div v-if="(getOpponent.top5Champions || [])[0]?.masteryLevel >= 10">
                                    <img src="@/assets/Mastery/level.webp" class="high-mastery-icon"
                                        alt="High Mastery" />
                                    <p class="high-mastery-level">{{ (getOpponent.top5Champions || [])[0]?.masteryLevel
                                        }}</p>
                                </div>
                            </div>
                            <br />
                            <p>{{ (getOpponent.top5Champions || [])[0]?.championName || "" }}</p>
                        </div>

                        <!-- 챔피언 아이템 3 (인덱스 2) -->
                        <div class="champion-item">
                            <img v-if="(getOpponent.top5Champions || [])[2]?.iconUrl"
                                :src="getOpponent.top5Champions[2]?.iconUrl" alt="Champion Image" />
                            <div class="mastery-wrapper">
                                <img v-if="(getOpponent.top5Champions || [])[2]?.masteryLevel < 10"
                                    :src="require(`@/assets/Mastery/${getOpponent.top5Champions[2]?.masteryLevel}.webp`)"
                                    class="mastery-icon" alt="Mastery Level" />
                                <img v-if="(getOpponent.top5Champions || [])[2]?.iconUrl && (getOpponent.top5Champions || [])[2]?.masteryLevel >= 10"
                                    src="@/assets/Mastery/10.webp" class="mastery-icon" alt="Mastery Level" />
                                <div v-if="(getOpponent.top5Champions || [])[2]?.masteryLevel >= 10">
                                    <img src="@/assets/Mastery/level.webp" class="high-mastery-icon"
                                        alt="High Mastery" />
                                    <p class="high-mastery-level">{{ (getOpponent.top5Champions || [])[2]?.masteryLevel
                                        }}</p>
                                </div>
                            </div>
                            <br />
                            <p>{{ (getOpponent.top5Champions || [])[2]?.championName || "" }}</p>
                        </div>
                    </div>
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
            opponentDisconnected: false, // 상대방 접속 종료 여부
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
        },
        opponentChampions() {
            // 챔피언 목록이 undefined이거나 배열이 아닐 경우 기본값 제공
            if (!this.getOpponent.top5Champions) {
                return ["N/A", "N/A", "N/A"];
            }

            let champions = this.getOpponent.top5Champions;

            // 챔피언 데이터가 문자열로 올 경우 배열로 변환
            if (typeof champions === "string") {
                champions = champions.split(",").map(c => c.trim());
            }

            return Array.isArray(champions) ? champions.slice(0, 3) : ["N/A", "N/A", "N/A"];
        },
        getChampionIcon() {
            return championName => {
                return championName && championName !== "N/A"
                    ? `http://ddragon.leagueoflegends.com/cdn/14.22.1/img/champion/${championName}.png`
                    : "/icons/default-champion.png";
            };
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
/* ✅ 전체 컨테이너 */
.chat-container {
    display: flex;
    flex-direction: row;
    /* 기본 가로 정렬 */
    justify-content: space-between;
    align-items: stretch;
    width: 100vw;
    height: 100vh;
    overflow: auto;
    /* 🔹 전체 화면 크기가 작아지면 스크롤 가능 */
}

/* ✅ 상대방 정보 영역 */
.opponent-info {
    flex: 0.4;
    /* 🔹 40% 차지 */
    background-color: rgb(25, 25, 25);
    color: white;
    text-align: center;
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow: auto;
    /* 🔹 상대방 정보도 스크롤 가능 */
}

/* ✅ 상대방 프로필 사진 */
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

/* ✅ 상대방 닉네임 */
.opponent-info h2 {
    margin: 10px 0;
}

/* ✅ 소환사 아이디 스타일 */
.summoner-name {
    font-size: 14px;
    color: #bbb;
    margin-top: -5px;
}

/* ✅ 포지션 아이콘 */
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

/* ✅ 마이크 아이콘 */
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

/* ✅ 인게임 정보 (세로 정렬) */
.ingame-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
    margin-top: 20px;
}

/* ✅ Game Tier */
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
    height: 150px;
    margin-bottom: 5px;
}

/* Most Champions 영역을 한 줄로 정렬 */
.most-played-champions {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 20px 0;
    /* 상하 여백 */
}

.most-champions-title {
    font-size: 24px;
    font-weight: bold;
    text-align: center;
    margin-bottom: 10px;
    /* 제목과 리스트 사이 간격 */
}

.champion-list {
    display: flex;
    flex-direction: row;
    /* 가로 정렬 */
    gap: 10px;
    /* 아이템 사이 간격 */
    justify-content: center;
    width: 100%;
    overflow-x: auto;
    /* 화면이 좁을 경우 가로 스크롤 */
}

.champion-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    position: relative;
}

.champion-item img {
    width: 120px;
    /* 챔피언 이미지 크기 */
    height: 120px;
}

.champion-item p {
    margin-top: 10px;
    font-size: 20px;
    font-weight: bold;
}

/* 숙련도 영역 컨테이너 (상대 위치 지정) */
.mastery-wrapper {
    position: relative;
    width: 70px;
    /* 마스터리 아이콘과 동일 너비 */
    height: 50px;
    /* 마스터리 아이콘과 동일 높이 */
}

/* 마스터리 아이콘: 컨테이너의 상단에 위치 */
.mastery-icon {
    position: absolute;
    top: 0;
    left: 0;
    width: 70px !important;
    height: 50px !important;
}

/* 고정 숙련도 아이콘: 마스터리 아이콘 바로 아래 중앙에 배치 */
.high-mastery-icon {
    position: absolute;
    top: calc(100% + 5px);
    /* 마스터리 아이콘 하단에서 5px 아래 */
    left: 50%;
    transform: translateX(-50%);
    width: 35px !important;
    height: 15px !important;
}

/* 숙련도 레벨 텍스트: 고정 숙련도 아이콘 위쪽 중앙에 배치 */
.high-mastery-level {
    position: absolute;
    bottom: calc(100% + 5px);
    /* 고정 숙련도 아이콘 위쪽에서 5px 간격 */
    left: 50%;
    transform: translateX(-50%);
    font-size: 14px !important;
    color: #212121 !important;
    text-align: center;
}

/* ✅ 채팅창 영역 */
.chat-room {
    flex: 0.6;
    /* 🔹 60% 차지 */
    background-color: rgb(33, 33, 33);
    color: white;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    overflow: auto;
    /* 🔹 채팅창도 스크롤 가능 */
}

/* ✅ 채팅 헤더 */
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

/* ✅ 채팅창 내부 스크롤 추가 */
.chat-window {
    flex: 1;
    overflow-y: auto;
    width: 80%;
    max-height: 70vh;
    padding: 10px;
}

/* ✅ 채팅 메시지 */
.chat-message {
    display: flex;
    flex-direction: column;
    margin-bottom: 10px;
    align-items: flex-start;
}

.my-message {
    align-items: flex-end;
}

/* ✅ 메시지 내용 */
.message-content {
    background: rgb(66, 66, 66);
    padding: 10px;
    border-radius: 45px;
    max-width: 70%;
}

.my-message .message-content {
    background: rgb(21, 81, 55);
    color: white;
    padding: 10px;
    border-radius: 45px;
}

/* ✅ 메시지 시간 */
.message-meta {
    margin-top: 4px;
}

.message-time {
    font-size: 12px;
    color: #666;
}

/* ✅ 채팅 입력창 */
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

/* ✅ 작은 화면에서도 좌우/상하 스크롤 가능 */
@media (max-width: 768px) {
    .chat-container {
        flex-direction: column;
        height: auto;
        overflow: auto;
    }

    .opponent-info,
    .chat-room {
        width: 100%;
        height: 50vh;
        /* 위아래 50%씩 차지 */
        overflow: auto;
    }
}
</style>