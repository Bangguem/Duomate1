<template>
    <div class="chat-container">
        <!-- 왼쪽: 상대방 정보 -->
        <div class="opponent-info">
            <div class="opponent-profile-picture">
                <img :src="getOpponentProfileImage" alt="프로필 사진" class="profile-image" />
            </div>

            <h2>{{ getOpponent.nickname || "상대방 닉네임" }}</h2>
            <p class="summoner-name">@{{ getOpponent.SummonerName || "소환사 아이디 없음" }}{{ '#' + getOpponent.Tag || "" }}
            </p>

            <div class="opponent-position-mic-container">
                <div v-for="(pos, index) in opponentPositions" :key="index" class="position-item">
                    <img :src="getPositionIcon(pos)" alt="포지션 아이콘" class="position-icon" />
                    <p class="position-text">{{ pos }}</p>
                </div>
                <div class="mic-item">
                    <img :src="opponentMicrophoneIcon" alt="마이크 상태 아이콘" class="mic-icon" />
                    <p class="mic-text">{{ getOpponent.microphone || "정보 없음" }}</p>
                </div>
            </div>

            <div class="ingame-info">
                <div class="ingame-tier">
                    <img :src="`https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-shared-components/global/default/${(getOpponent.summonerRank?.tier || 'unranked').toLowerCase()}.png`"
                        alt="Game Tier" class="ingame-icon" />
                    <p>{{ getOpponent.summonerRank?.tier || "Unranked" }} {{ getOpponent.summonerRank?.rank || "" }}</p>
                </div>

                <!-- ✅ Most Champions (한 줄 정렬 + 마스터리 적용) -->
                <div class="most-played-champions" v-if="getOpponentChampions.length > 0">
                    <div class="champion-list">
                        <div v-for="(champion, index) in getOpponentChampions" :key="index" class="champion-item">

                            <img :src="champion.iconUrl" class="champion-icon" alt="Champion Image" />

                            <div class="mastery-wrapper">
                                <img v-if="champion.masteryLevel < 10"
                                    :src="require(`@/assets/Mastery/${champion.masteryLevel}.webp`)"
                                    class="mastery-icon" alt="Mastery Level" />
                                <img v-if="champion.masteryLevel >= 10" src="@/assets/Mastery/10.webp"
                                    class="mastery-icon" alt="Mastery Level" />

                                <div class="mastery-box">
                                    <img src="@/assets/Mastery/level.webp" class="high-mastery-icon"
                                        alt="High Mastery" />
                                    <p class="high-mastery-level">{{ champion.masteryLevel }}</p>
                                </div>
                            </div>

                            <p class="champion-name">{{ champion.championName }}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- ✅ 채팅창 -->
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
            opponentDisconnected: false,
            iconSize: "60px",
        };
    },
    computed: {
        getOpponent() {
            if (!this.match?.players || !this.userInfo) return {};
            return (
                this.match.players.find((p) => p.userid !== this.userInfo.userid) || {}
            );
        },
        getOpponentProfileImage() {
            return (
                this.getOpponent?.profileImage ||
                (this.getOpponent?.summonerInfo?.profileIconId
                    ? `http://ddragon.leagueoflegends.com/cdn/14.22.1/img/profileicon/${this.getOpponent.summonerInfo.profileIconId
                    }.png`
                    : "/icons/default-profile.png")
            );
        },
        opponentPositions() {
            const pos = this.getOpponent.position;
            if (!pos) return ["없음"];
            return Array.isArray(pos) ? pos.slice(0, 2) : String(pos).split(",").slice(0, 2);
        },
        getOpponentChampions() {
            return this.getOpponent?.top5Champions?.slice(0, 3) || [];
        },
        getPositionIcon() {
            return (position) =>
            ({
                탑: "/icons/top.png",
                정글: "/icons/jungle.png",
                미드: "/icons/mid.png",
                원딜: "/icons/adc.png",
                서포터: "/icons/support.png",
                없음: "/icons/none.png",
            }[position] || "/icons/none.png");
        },
        opponentMicrophoneIcon() {
            const mic = String(this.getOpponent.microphone || "").trim().toLowerCase();
            if (mic === "가능" || mic === "사용") return "/icons/mic-on.png";
            return "/icons/mic-off.png";
        },
    },
    methods: {
        setupSocket() {
            // 이미 연결되었거나, 매칭 정보(roomName)이 없으면 초기화 중단
            if (this.socket || !this.match?.roomName) return;

            this.socket = io(`${process.env.VUE_APP_API_URL}`, {
                withCredentials: true,
            });

            this.socket.on("connect", () => {
                if (this.match.roomName) {
                    this.socket.emit("join room", { roomName: this.match.roomName });
                }
            });

            this.socket.on("chat message", (data) => {
                this.messages.push(data);
            });

            this.socket.on("user disconnected", (data) => {
                this.opponentDisconnected = true;
                this.messages.push({
                    type: "system",
                    message: `${data.nickname}님이 채팅방을 나갔습니다.`,
                });
                setTimeout(() => this.$router.push("/match"), 2000);
            });

            // ◀ 서버에서 발생한 매칭 에러 처리
            this.socket.on("matchError", ({ message }) => {
                alert(`⚠️ 매칭 오류: ${message}`);
                this.$router.push("/match");
            });

            this.socket.on("connect_error", (err) => {
                console.error("❌ 소켓 연결 에러:", err);
            });
        },

        leaveRoom() {
            if (this.socket) {
                if (!this.opponentDisconnected) {
                    this.socket.emit("leave room", {
                        matchId: this.matchId,
                        userId: this.userInfo?.userid,
                        nickname: this.userInfo?.nickname,
                    });
                }
                this.socket.disconnect();
            }
            this.$router.push("/match");
        },

        sendMessage() {
            if (this.newMessage.trim() && this.socket) {
                this.socket.emit("chat message", {
                    matchId: this.matchId,
                    message: this.newMessage,
                    timestamp: new Date().toISOString(),
                });
                this.newMessage = "";
            }
        },

        formatTime(ts) {
            return ts
                ? new Date(ts).toLocaleTimeString("ko-KR", {
                    hour: "2-digit",
                    minute: "2-digit",
                })
                : "";
        },

        async fetchUserInfo() {
            try {
                const res = await fetch(
                    `${process.env.VUE_APP_API_URL}/auth/check-login`,
                    {
                        credentials: "include",
                    }
                );
                const data = await res.json();
                if (data.loggedIn) this.userInfo = data.user;
            } catch (e) {
                console.error("❌ 사용자 정보 조회 오류:", e);
            }
        },

        async fetchMatchInfo() {
            if (!this.matchId) return;
            try {
                const res = await fetch(
                    `${process.env.VUE_APP_API_URL}/match/get/${this.matchId}`,
                    { credentials: "include" }
                );
                const data = await res.json();
                if (data.success) {
                    this.match = data.match;
                    this.setupSocket();
                }
            } catch (e) {
                console.error("❌ 매칭 정보 가져오기 오류:", e);
            }
        },
    },

    async mounted() {
        this.matchId = this.$route.query.matchId;
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
            this.socket.disconnect();
            this.socket = null;
        }
    },
};
</script>

<style scoped>
/* ✅ 전체 컨테이너 */
.chat-container {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: stretch;
    width: 100vw;
    min-height: 100vh;
    /* 최소 높이 100vh 유지 */
    overflow: auto;
    /* 창 크기가 줄어들면 스크롤 생성 */
    flex-wrap: nowrap;
    /* 상대방 정보와 채팅창이 줄바꿈되지 않도록 고정 */
}

/* ✅ 상대방 정보 영역 */
.opponent-info {
    flex: 0.3;
    background-color: rgb(25, 25, 25);
    color: white;
    text-align: center;
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow: auto;
    /* 내부 요소 스크롤 가능 */
}

/* ✅ 상대방 프로필 사진 */
.opponent-profile-picture {
    width: 80px;
    height: 80px;
    border-radius: 90%;
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

/* ✅ 포지션 + 마이크 아이콘을 한 줄로 정렬 */
.opponent-position-mic-container {
    display: flex;
    align-items: center;
    gap: 15px;
    justify-content: center;
    margin-bottom: 15px;
}

/* ✅ 포지션 아이콘 스타일 */
.position-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
}

.position-icon {
    width: var(--icon-size, 60px);
    height: var(--icon-size, 60px);
}

.position-text {
    margin-top: 5px;
    font-size: 14px;
}

/* ✅ 마이크 아이콘 스타일 */
.mic-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
}

/* ✅ 마이크 ON 아이콘 (icons/mic-on.png) 크기 조절 */
.mic-icon[src*="mic-on.png"] {
    width: 35px;
    /* 원하는 크기로 변경 */
    height: 60px;
    /* 원하는 크기로 변경 */
}

/* ✅ 마이크 OFF 아이콘 (icons/mic-off.png) 크기 조절 */
.mic-icon[src*="mic-off.png"] {
    width: 45px;
    /* 원하는 크기로 변경 */
    height: 60px;
    /* 원하는 크기로 변경 */
}

.mic-text {
    margin-top: 5px;
    font-size: 14px;
}

/* ✅ 인게임 정보 */
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

/* ✅ Most Champions 영역 */
.most-played-champions {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 20px;
}

/* ✅ 챔피언 리스트 (한 줄로 정렬) */
.champion-list {
    display: flex;
    flex-direction: row;
    gap: 10px;
    /* 챔피언 아이콘 간격 */
    justify-content: center;
    width: 100%;
}

/* ✅ 챔피언 아이템 컨테이너 */
.champion-item {
    display: flex;
    flex-direction: column;
    /* 세로 정렬 */
    align-items: center;
    text-align: center;
    position: relative;
}

/* ✅ 챔피언 아이콘 */
.champion-icon {
    width: 80px;
    height: 80px;
}

/* ✅ 숙련도 아이콘 및 박스 */
.mastery-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    margin-top: -10px;
    /* 아이콘과 살짝 겹치게 */
}

/* ✅ 마스터리 아이콘 */
.mastery-icon {
    width: 40px;
    height: 30px;
    position: relative;
}

/* ✅ 마스터리 박스 스타일 (크기 1/4로 줄이고 내부 정렬) */
.mastery-box {
    position: relative;
    width: 25px;
    /* 마스터리 박스 크기 */
    height: 15px;
    display: flex;
    justify-content: center;
    /* 중앙 정렬 */
    align-items: center;
    /* 수직 중앙 정렬 */
}

/* ✅ 마스터리 박스 크기 */
.high-mastery-icon {
    width: 25px;
    height: 10px;
    position: relative;
    /* 숫자를 내부에 넣기 위해 필요 */
}

/* ✅ 마스터리 숫자 (박스 내부 중앙 + 살짝 더 위로) */
.high-mastery-level {
    position: absolute;
    top: 25%;
    /* 기존보다 더 위로 */
    left: 50%;
    transform: translate(-50%, -85%);
    /* Y축 이동량 미세 조정 */
    font-size: 8px;
    /* 글자 크기 유지 */
    font-weight: bold;
    color: #2c1b05;
    /* 가독성을 위해 어두운 색상 */
    text-align: center;
    width: 100%;
}

/* ✅ 챔피언 이름을 맨 아래로 배치 */
.champion-name {
    margin-top: 10px;
    /* 박스와 간격 조정 */
    font-size: 16px;
    font-weight: bold;
}

/* ✅ 채팅창 영역 */
.chat-room {
    flex: 0.7;
    background-color: rgb(33, 33, 33);
    color: white;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    overflow: auto;
    /* 내부 요소 스크롤 가능 */
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

/* ✅ 채팅창 내부 스크롤 */
.chat-window {
    flex: 1;
    overflow-y: auto;
    width: 80%;
    max-height: 70vh;
    padding: 10px;
    overscroll-behavior: contain;
    /* 스크롤이 부모 요소로 전달되지 않도록 방지 */
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

/* ✅ 작은 화면에서도 원본 크기 유지 */
@media (max-width: 768px) {
    .chat-container {
        flex-direction: row;
        /* 줄바꿈 방지 */
        overflow: auto;
        /* 전체 컨테이너에서 스크롤 가능하도록 설정 */
    }

    .opponent-info,
    .chat-room {
        height: 100vh;
        /* 상대방 정보와 채팅창 높이 유지 */
        overflow: auto;
        /* 내부 스크롤 */
    }
}

/* WebKit 기반 브라우저 (Chrome, Edge, Safari 등) */
.chat-window::-webkit-scrollbar {
    width: 8px;
}

.chat-window::-webkit-scrollbar-track {
    background: rgb(33, 33, 33);
    /* 채팅창 배경과 동일한 색상 */
    border-radius: 10px;
}

.chat-window::-webkit-scrollbar-thumb {
    background-color: rgb(85, 85, 85);
    /* 배경보다 밝은 톤으로 대비 부여 */
    border-radius: 10px;
    border: 2px solid rgb(33, 33, 33);
    /* 배경색과 동일한 테두리 */
}

.chat-window::-webkit-scrollbar-thumb:hover {
    background-color: rgb(105, 105, 105);
    /* 호버 시 살짝 더 밝게 */
}

/* Firefox */
.chat-window {
    scrollbar-width: thin;
    scrollbar-color: rgb(85, 85, 85) rgb(33, 33, 33);
    /* thumb 색상, track 색상 */
}
</style>
