<template>
    <div class="match-queue">
        <div class="match-container">
            <!-- ✅ 프로필 & 티어 정보 -->
            <div class="profile-rank-container">
                <div class="profile-section">
                    <div class="profile-picture">
                        <img :src="`http://ddragon.leagueoflegends.com/cdn/14.22.1/img/profileicon/${userInfo.summonerInfo?.profileIconId}.png`"
                            alt="소환사 아이콘" class="summoner-icon" />
                    </div>
                    <span>안녕하세요, {{ userInfo.nickname }}님!</span>
                    <div class="user-rank-container">
                        <div class="rank-info">
                            <img :src="userInfo.summonerRank?.[0]
                                ? `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-shared-components/global/default/${userInfo.summonerRank[0].tier.toLowerCase()}.png`
                                : 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-shared-components/global/default/unranked.png'"
                                alt="티어 아이콘" class="rank-icon" />
                            <span class="rank-text">
                                {{ userInfo.summonerRank?.[0]
                                    ? userInfo.summonerRank[0].tier + ' ' + userInfo.summonerRank[0].rank
                                    : '랭크 정보 없음' }}
                            </span>
                        </div>
                        <button class="refresh-button" @click="fetchLatestMatchData">전적 갱신</button>
                    </div>
                </div>
            </div>

            <!-- ✅ 포지션 선택 -->
            <div class="selection-section">
                <h2>포지션 (중복 2개 가능)</h2>
                <div class="position-options">
                    <div v-for="pos in positions" :key="pos.value"
                        :class="{ selected: selectedPositions.includes(pos.value) }" @click="togglePosition(pos.value)">
                        <img :src="pos.icon" :alt="pos.label" />
                        <span>{{ pos.label }}</span>
                    </div>
                </div>
            </div>

            <!-- ✅ 음성 채팅 사용 여부 -->
            <div class="selection-section">
                <h2>음성 채팅 사용 여부</h2>
                <div class="voice-options">
                    <div v-for="voice in voiceOptions" :key="voice.value"
                        :class="{ active: microphone === voice.value }" @click="microphone = voice.value">
                        <img :src="voice.icon" :alt="voice.label" />
                        <span>{{ voice.label }}</span>
                    </div>
                </div>
            </div>

            <!-- ✅ 일반/랭크 선택 -->
            <div class="selection-section">
                <h2>일반 / 랭크</h2>
                <div class="game-mode-options">
                    <div v-for="mode in gameModes" :key="mode.value" :class="{ active: matchType === mode.value }"
                        @click="matchType = mode.value">
                        <img :src="mode.icon" :alt="mode.label" />
                        <span>{{ mode.label }}</span>
                    </div>
                </div>
            </div>

            <!-- ✅ 매칭 버튼 -->
            <button @click="startMatching" :disabled="isMatching" class="match-button">
                매칭 시작
            </button>
        </div>

        <!-- ✅ 매칭 완료 팝업 -->
        <div class="match-confirmation" v-if="matchFound && !waitingForOpponent">
            <div class="match-info">
                <p class="match-text">매칭 완료!!</p>
                <!-- 15초 카운트 다운 표시 -->
                <p>남은 시간: {{ countdown }}초</p>
            </div>
            <div class="match-buttons">
                <button class="reject-button" @click="rejectMatch">거절</button>
                <button class="accept-button" @click="acceptMatch">수락</button>
            </div>
        </div>

        <!-- ✅ "상대방 응답 대기" 팝업 -->
        <div class="waiting-popup" v-if="waitingForOpponent">
            <div class="popup-content">
                <p>상대방의 응답을 기다리고 있습니다...</p>
                <img src="/icons/loading.png" alt="Loading" class="loading-icon" />
            </div>
        </div>

        <!-- ✅ "매칭 중" UI -->
        <div class="popup-overlay" v-if="isMatching && !matchFound && !waitingForOpponent">
            <div class="popup-content">
                <img src="/icons/loading.png" alt="Loading" class="loading-icon" />
                <p class="waiting-time">{{ formattedTime }}</p>
                <p>상대를 찾고 있습니다. 잠시만 기다려 주세요.</p>
                <button @click="cancelMatching">취소</button>
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
            isLoggedIn: false,
            userInfo: {},
            selectedPositions: [],
            microphone: "미사용",
            matchType: "일반",
            isMatching: false,
            matchFound: false,
            matchId: null,
            opponentAccepted: false, // 🔹 상대방 수락 여부
            waitingForOpponent: false, // 🔹 상대 응답 대기 상태
            waitingTime: 0,
            timer: null,

            // 15초 카운트 다운 관련 변수 추가
            countdown: 15,
            countdownTimer: null,

            positionIconSize: 40,
            voiceIconWidth: 50,
            voiceIconHeight: 80,
            gameModeIconSize: 120,

            positions: [
                { label: "탑", value: "탑", icon: "/icons/top.png" },
                { label: "정글", value: "정글", icon: "/icons/jungle.png" },
                { label: "미드", value: "미드", icon: "/icons/mid.png" },
                { label: "원딜", value: "원딜", icon: "/icons/adc.png" },
                { label: "서포터", value: "서포터", icon: "/icons/support.png" },
                { label: "없음", value: "없음", icon: "/icons/none.png" },
            ],

            voiceOptions: [
                { label: "사용", value: "사용", icon: "/icons/mic-on.png" },
                { label: "미사용", value: "미사용", icon: "/icons/mic-off.png" }
            ],

            gameModes: [
                { label: "일반", value: "일반", icon: "/icons/normal.png" },
                { label: "랭크", value: "랭크", icon: "/icons/rank.png" }
            ]
        };
    },

    async mounted() {
        await this.checkLoginStatus(); // 로그인 상태 확인
        this.initializeSocket();
    },

    methods: {
        async fetchLatestMatchData() {
            try {
                const response = await fetch(`${process.env.VUE_APP_API_URL}/updateSummonerInfo`, {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" }
                });
                const result = await response.json();
                if (result.success) {
                    alert("소환사 정보 갱신 성공");
                    await this.checkLoginStatus();
                } else {
                    alert("소환사 정보 갱신 실패: " + result.message);
                }
            } catch (error) {
                console.error("소환사 정보 갱신 오류:", error);
                alert("소환사 정보 갱신 중 오류 발생");
            }
        },

        async checkLoginStatus() {
            try {
                const response = await fetch(`${process.env.VUE_APP_API_URL}/auth/check-login`, {
                    method: "GET",
                    credentials: "include",
                });
                if (response.ok) {
                    const data = await response.json();
                    this.isLoggedIn = data.loggedIn;
                    if (data.loggedIn) {
                        this.userInfo = data.user || {};
                    } else {
                        this.handleUnauthenticatedUser();
                    }
                } else {
                    this.handleUnauthenticatedUser();
                }
            } catch (error) {
                console.error("❌ 로그인 상태 확인 오류:", error);
                this.handleUnauthenticatedUser();
            }
        },

        handleUnauthenticatedUser() {
            this.isLoggedIn = false;
            this.userInfo = {};
            alert("로그인이 필요합니다. 메인 화면으로 이동합니다.");
            this.$router.push("/");
        },

        resetUserData() {
            this.isLoggedIn = false;
            this.userInfo = {};
        },

        initializeSocket() {
            this.socket = io(`${process.env.VUE_APP_API_URL}`, { withCredentials: true });

            this.socket.on("disconnect", () => {
                console.log("❌ 서버 연결 해제됨. 대기열에서 제거");
                this.isMatching = false;
                this.matchFound = false;
                this.waitingForOpponent = false;
                this.opponentAccepted = false;
                if (this.timer) clearInterval(this.timer);
                this.clearAcceptCountdown();
            });

            this.socket.on("matchSuccess", (data) => {
                console.log("🔹 매칭 성공:", data);
                this.matchId = data.matchId;
                this.matchFound = true;
                this.waitingForOpponent = false;
                // 매칭 성공 시 15초 카운트 다운 시작
                this.startAcceptCountdown();
            });

            this.socket.on("matchRejected", () => {
                console.log("❌ 상대방이 매칭을 거절함");
                this.matchFound = false;
                this.isMatching = false;
                this.waitingForOpponent = false;
                this.opponentAccepted = false;
                if (this.timer) clearInterval(this.timer);
                this.clearAcceptCountdown();
                alert("⚠️ 상대방이 매칭을 거부했습니다. 다시 시도해주세요!");
            });

            this.socket.on("matchConfirmed", async (data) => {
                if (data.matchId === this.matchId) {
                    this.opponentAccepted = true; // 🔹 상대방 수락
                    this.clearAcceptCountdown();
                    if (this.waitingForOpponent) {
                        // ✅ 둘 다 수락했으므로 채팅방으로 이동
                        this.$router.push(`/chatroom?matchId=${this.matchId}`);
                    }
                }
            });

            this.socket.on("matchCancelled", () => {
                console.log("❌ 매칭 취소됨");
                this.matchFound = false;
                this.isMatching = false;
                this.waitingForOpponent = false;
                this.opponentAccepted = false;
                if (this.timer) clearInterval(this.timer);
                this.clearAcceptCountdown();
            });

            this.socket.on('matchError', ({ message }) => {
                alert(`⚠️ 매칭 오류: ${message}`);
                this.isMatching = false;
                this.matchFound = false;
                this.waitingForOpponent = false;
                this.opponentAccepted = false;
                if (this.timer) clearInterval(this.timer);
                this.clearAcceptCountdown();
            });
        },

        togglePosition(position) {
            if (this.selectedPositions.includes(position)) {
                this.selectedPositions = this.selectedPositions.filter(p => p !== position);
            } else if (this.selectedPositions.length < 2) {
                this.selectedPositions.push(position);
            }
        },

        startMatching() {
            this.isMatching = true;
            this.waitingTime = 0;
            this.timer = setInterval(() => {
                this.waitingTime++;
            }, 1000);
            this.socket.emit(
                this.matchType === "일반" ? "request normalmatch" : "request rankmatch",
                { position: this.selectedPositions, microphone: this.microphone }
            );
        },

        acceptMatch() {
            if (this.matchId) {
                this.socket.emit("acceptMatch", { matchId: this.matchId });
                this.waitingForOpponent = true; // 🔹 상대방 응답 대기 상태 활성화
                this.clearAcceptCountdown();
            }
            if (this.opponentAccepted) {
                // ✅ 상대방도 수락한 상태 → 채팅방으로 이동
                this.$router.push(`/chatroom?matchId=${this.matchId}`);
            }
        },

        rejectMatch() {
            if (this.matchId) {
                this.socket.emit("rejectMatch", { matchId: this.matchId });
            }
            this.isMatching = false;
            this.matchFound = false;
            this.waitingForOpponent = false;
            this.opponentAccepted = false;
            if (this.timer) clearInterval(this.timer);
            this.clearAcceptCountdown();
        },

        cancelMatching() {
            if (this.timer) clearInterval(this.timer);
            this.isMatching = false;
            this.socket.emit("cancel match");
            this.clearAcceptCountdown();
        },

        // 15초 수락 카운트 다운 시작
        startAcceptCountdown() {
            this.countdown = 15;
            if (this.countdownTimer) clearInterval(this.countdownTimer);
            this.countdownTimer = setInterval(() => {
                if (this.countdown > 0) {
                    this.countdown--;
                } else {
                    clearInterval(this.countdownTimer);
                    this.countdownTimer = null;
                    // 남은 시간이 0초가 되면 자동 거절 처리
                    this.rejectMatch();
                    alert("⚠️ 수락 시간이 초과되어 매칭이 거절되었습니다.");
                }
            }, 1000);
        },

        // 카운트 다운 타이머 정리
        clearAcceptCountdown() {
            if (this.countdownTimer) {
                clearInterval(this.countdownTimer);
                this.countdownTimer = null;
            }
        }
    },

    computed: {
        formattedTime() {
            const minutes = Math.floor(this.waitingTime / 60);
            const seconds = this.waitingTime % 60;
            return `${minutes.toString().padStart(2, "0")}: ${seconds
                .toString()
                .padStart(2, "0")
                }`;
        }
    },

    beforeUnmount() {
        if (this.timer) clearInterval(this.timer);
        if (this.socket) this.socket.disconnect();
        this.clearAcceptCountdown();
    }
};
</script>

<style scoped>
.match-queue {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    width: 100vw;
    background-color: #1e1e1e;
}

.match-container {
    background-color: #333;
    padding: 20px;
    border-radius: 10px;
    color: white;
    width: 600px;
    max-width: 80%;
}

/* ✅ 프로필 영역 */
.profile-section {
    display: flex;
    align-items: center;
    gap: 15px;
}

.profile-picture {
    width: 80px;
    height: 80px;
    background-color: #2c2c2c;
    border-radius: 50%;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
}

.summoner-icon {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
}

.profile-section span {
    font-size: 18px;
    font-weight: bold;
    color: white;
}

.profile-rank-container {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    max-width: 600px;
    margin-bottom: 20px;
}

.user-rank-container {
    position: absolute;
    top: 0;
    right: 0;
    display: flex;
    align-items: center;
    gap: 10px;
}

.rank-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 5px;
}

.rank-icon {
    width: 70px;
    height: 70px;
    object-fit: contain;
}

.rank-text {
    font-size: 18px;
    font-weight: bold;
    color: white;
    margin-top: -5px;
}

.refresh-button {
    padding: 10px 15px;
    background: rgb(21, 81, 55);
    color: white;
    font-size: 14px;
    font-weight: bold;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.3s ease, transform 0.2s ease;
}

.refresh-button:hover {
    background: rgb(30, 100, 70);
    transform: scale(1.05);
}

/* ✅ 포지션, 음성채팅, 게임모드 선택 스타일 */
.position-options,
.voice-options,
.game-mode-options {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 20px;
    flex-wrap: wrap;
}

.position-options div,
.voice-options div,
.game-mode-options div {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
}

.position-options img {
    width: 70px;
    height: 70px;
    transition: transform 0.2s;
}

.voice-options img[src*="mic-on.png"] {
    width: 50px;
    height: 90px;
}

.voice-options img[src*="mic-off.png"] {
    width: 70px;
    height: 90px;
}

.game-mode-options img {
    width: 140px;
    height: 140px;
    transition: transform 0.2s;
}

.position-options img:hover,
.voice-options img:hover,
.game-mode-options img:hover {
    transform: scale(1.1);
}

.selected img,
.active img {
    border: 3px solid rgb(21, 81, 55);
    border-radius: 10px;
}

/* ✅ 매칭 버튼 */
.match-button {
    display: block;
    margin: 20px auto;
    width: 50%;
    padding: 10px;
    font-size: 16px;
    background-color: rgb(21, 81, 55);
    color: white;
    border: none;
    border-radius: 90px;
    cursor: pointer;
}

.match-button:disabled {
    background-color: #555;
    cursor: not-allowed;
}

/* ✅ 매칭 완료 팝업 (크기 완전히 고정) */
.match-confirmation {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 400px !important;
    /* 고정된 가로 크기 */
    height: 200px !important;
    /* 고정된 세로 크기 */
    background: #222;
    color: white;
    border-radius: 15px;
    padding: 20px;
    text-align: center;
    box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.5);
}

/* ✅ 수락/거절 버튼 컨테이너 */
.match-buttons {
    display: flex;
    gap: 10px;
    margin-top: 15px;
}

.reject-button,
.accept-button {
    padding: 12px 30px;
    font-size: 16px;
    border: none;
    cursor: pointer;
    border-radius: 45px;
}

.reject-button {
    background: none;
    border: 2px solid white;
    color: white;
}

.accept-button {
    background: rgb(21, 81, 55);
    color: white;
}

/* ✅ 작은 화면에서도 크기 유지 */
@media (max-width: 768px) {
    .match-confirmation {
        width: 400px !important;
        /* 모바일에서도 크기 고정 */
        height: 200px !important;
    }
}

/* ✅ 매칭 중 UI 배경 (팝업 전체 배경) */
.popup-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
}

.popup-content {
    background: rgb(66, 66, 66);
    padding: 30px;
    border-radius: 15px;
    text-align: center;
    width: 300px;
    height: 500px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.popup-content p {
    color: white;
    font-size: 15px;
    font-weight: bold;
    text-align: center;
    margin-bottom: 10px;
}

.loading-icon {
    width: 80px;
    height: 80px;
    margin-top: 10px;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

.popup-content button {
    padding: 12px 20px;
    background: rgb(66, 66, 66);
    color: white;
    font-size: 16px;
    border: 1px solid white;
    border-radius: 10px;
    cursor: pointer;
    margin-top: 15px;
    transition: transform 0.2s ease;
}

.popup-content button:hover {
    transform: scale(1.05);
}

.waiting-popup {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgb(66, 66, 66);
    color: white;
    padding: 30px;
    border-radius: 12px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 300px;
    height: 400px;
}

.waiting-time {
    font-size: 24px;
    font-weight: bold;
    margin: 10px 0;
}

@media (max-width: 768px) {
    .match-container {
        width: 90%;
    }

    .match-confirmation {
        width: 90%;
        height: auto;
    }
}
</style>