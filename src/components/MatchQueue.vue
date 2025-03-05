<template>
    <div class="match-queue">
        <div class="match-container">
            <!-- ✅ 프로필 & 티어 정보 & 전적 갱신 버튼을 한 줄로 배치 -->
            <div class="profile-rank-container">
                <!-- 프로필 -->
                <div class="profile-section">
                    <div class="profile-picture">
                        <!-- 🔹 소환사 아이콘 추가 -->
                        <img :src="`http://ddragon.leagueoflegends.com/cdn/14.22.1/img/profileicon/${userInfo.summonerInfo?.profileIconId}.png`"
                            alt="소환사 아이콘" class="summoner-icon" />
                    </div>
                    <span>안녕하세요, {{ userInfo.nickname }}님!</span>
                    <!-- 티어 정보 & 전적 갱신 버튼 -->
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

            <!-- 포지션 선택 -->
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

            <!-- 음성 채팅 사용 여부 -->
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

            <!-- 일반/랭크 선택 -->
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

            <!-- 매칭 버튼 -->
            <button @click="startMatching" :disabled="isMatching" class="match-button">매칭 시작</button>
        </div>

        <!-- ✅ 매칭 완료 화면 -->
        <div class="match-confirmation" v-if="matchFound">
            <div class="match-info">
                <p class="match-text">매칭 완료!!</p>
            </div>
            <div class="match-buttons">
                <button class="reject-button" @click="rejectMatch">거절</button>
                <button class="accept-button" @click="acceptMatch">수락</button>
            </div>
        </div>

        <!-- ✅ 기존 매칭 중 UI 유지 -->
        <div class="popup-overlay" v-if="isMatching && !matchFound">
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
            waitingTime: 0,
            timer: null,

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
                const response = await fetch('http://localhost:3000/updateSummonerInfo', {
                    method: 'POST',
                    credentials: 'include', // 쿠키 포함
                    headers: {
                        'Content-Type': 'application/json'
                    }

                });

                const result = await response.json();
                if (result.success) {
                    alert("소환사 정보 갱신 성공");
                    // 최신 정보를 반영하기 위해 다시 로그인 상태 확인 또는 사용자 정보 불러오기 실행
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
                const response = await fetch('http://localhost:3000/auth/check-login', {
                    method: 'GET',
                    credentials: 'include', // 쿠키 포함
                });

                if (response.ok) {
                    const data = await response.json();
                    this.isLoggedIn = data.loggedIn;
                    if (data.loggedIn) {
                        this.userInfo = data.user || {}; // 사용자 정보를 객체로 저장
                        console.log("📢 userInfo:", this.userInfo);
                    } else {
                        this.handleUnauthenticatedUser();
                    }
                } else {
                    this.handleUnauthenticatedUser();
                }
            } catch (error) {
                console.error('❌ 로그인 상태 확인 오류:', error);
                this.handleUnauthenticatedUser();
            }
        },

        handleUnauthenticatedUser() {
            this.isLoggedIn = false;
            this.userInfo = {}; // 사용자 정보 초기화
            alert("로그인이 필요합니다. 메인 화면으로 이동합니다.");
            this.$router.push("/"); // 메인 화면으로 이동
        },

        resetUserData() {
            this.isLoggedIn = false;
            this.userInfo = {}; // 사용자 정보 초기화
        },

        initializeSocket() {
            this.socket = io("http://localhost:3000", { withCredentials: true });

            this.socket.on("disconnect", () => {
                console.log("❌ 서버 연결 해제됨. 대기열에서 제거");
                this.isMatching = false;
                this.matchFound = false;
                if (this.timer) {
                    clearInterval(this.timer);
                }
            });

            this.socket.on("matchSuccess", (data) => {
                console.log("🔹 서버에서 받은 matchSuccess 데이터:", data);
                this.matchId = data.matchId;
                this.matchFound = true;
            });

            this.socket.on("matchRejected", (data) => {
                console.log("❌ 매칭 취소됨:", data.message);
                this.matchFound = false;
                this.isMatching = false;
                if (this.timer) {
                    clearInterval(this.timer);
                }
                alert("⚠️ 상대방이 매칭을 거부했습니다. 다시 시도해주세요!");
            });

            this.socket.on("matchCancelled", (data) => {
                console.log("❌ 매칭 취소됨:", data.message);
                this.matchFound = false;
                this.isMatching = false;
                if (this.timer) {
                    clearInterval(this.timer);
                }
            });

            this.socket.on("matchConfirmed", async (data) => {
                try {
                    const response = await fetch(`http://localhost:3000/match/save`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify({
                            matchId: data.matchId
                        }),
                    });

                    const result = await response.json();
                    if (result.success) {
                        console.log("✅ 매칭 저장 성공");
                        this.$router.push(`/chatroom?matchId=${data.matchId}`);
                    }
                } catch (error) {
                    console.error("❌ 매칭 저장 오류:", error);
                }
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
                {
                    position: this.selectedPositions,
                    microphone: this.microphone
                }
            );
        },

        acceptMatch() {
            if (this.matchId) {
                this.socket.emit("acceptMatch", { matchId: this.matchId });
            }
            if (this.timer) {
                clearInterval(this.timer);
            }
            this.isMatching = false;
            this.matchFound = false;
        },

        rejectMatch() {
            if (this.matchId) {
                this.socket.emit("rejectMatch", { matchId: this.matchId });
            }
            if (this.timer) {
                clearInterval(this.timer);
            }
            this.isMatching = false;
            this.matchFound = false;
        },

        cancelMatching() {
            if (this.timer) {
                clearInterval(this.timer);
            }
            this.isMatching = false;
            this.socket.emit("cancel match");

        }


    },

    computed: {
        formattedTime() {
            const minutes = Math.floor(this.waitingTime / 60);
            const seconds = this.waitingTime % 60;
            return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    },

    beforeUnmount() {
        if (this.timer) {
            clearInterval(this.timer);
        }
        if (this.socket) {
            this.socket.disconnect();
        }
    }
};
</script>

<style scoped>
.match-queue {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    width: 300vw;
    background-color: #1e1e1e;
}

.match-container {
    background-color: #333;
    padding: 20px;
    border-radius: 10px;
    color: white;
    width: 600px;
    /* 🔹 기존 400px → 600px로 확대 */
    max-width: 80%;
    /* 🔹 화면 크기에 맞게 유동적으로 조절 */
}

/* ✅ 프로필 영역 (소환사 아이콘 + 닉네임) */
.profile-section {
    display: flex;
    align-items: center;
    /* 요소들을 수직 정렬 */
    gap: 15px;
    /* 아이콘과 닉네임 사이 여백 */
}

/* ✅ 프로필 사진 (소환사 아이콘 포함) */
.profile-picture {
    width: 80px;
    /* 아이콘 크기 조정 */
    height: 80px;
    background-color: #2c2c2c;
    border-radius: 50%;
    overflow: hidden;
    /* 이미지가 둥글게 표시되도록 설정 */
    display: flex;
    align-items: center;
    justify-content: center;
}

/* ✅ 소환사 아이콘 스타일 */
.summoner-icon {
    width: 100%;
    /* 부모 요소 크기에 맞춤 */
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
}

/* ✅ 닉네임 텍스트 스타일 */
.profile-section span {
    font-size: 18px;
    font-weight: bold;
    color: white;
}

/* ✅ 프로필 & 티어 정보 컨테이너 */
.profile-rank-container {
    position: relative;
    /* 🔹 내부 요소의 위치 기준 */
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    max-width: 600px;
    margin-bottom: 20px;
}

/* ✅ 프로필 섹션 (왼쪽) */
.profile-section {
    display: flex;
    align-items: center;
    gap: 15px;
}

/* ✅ 티어 정보 & 전적 갱신 버튼 (오른쪽 상단 고정) */
.user-rank-container {
    position: absolute;
    /* 🔹 절대 위치 설정 */
    top: 0;
    /* 상단 고정 */
    right: 0;
    /* 오른쪽 고정 */
    display: flex;
    align-items: center;
    gap: 10px;
}

/* ✅ 티어 정보 (아이콘 + 텍스트 세로 배치) */
.rank-info {
    display: flex;
    flex-direction: column;
    /* 🔹 세로 배치 (아이콘 → 텍스트) */
    align-items: center;
    text-align: center;
    gap: 5px;
    /* 🔹 아이콘과 텍스트 사이 간격 */
}

/* ✅ 티어 아이콘 */
.rank-icon {
    width: 80px;
    /* 🔹 기존보다 확대 */
    height: 80px;
    object-fit: contain;
}

/* ✅ 티어 텍스트 */
.rank-text {
    font-size: 18px;
    font-weight: bold;
    color: white;
    margin-top: -5px;
    /* 🔹 아이콘과 너무 붙지 않도록 조정 */
}

/* ✅ 전적 갱신 버튼 스타일 */
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

/* ✅ 마우스 호버 효과 추가 */
.refresh-button:hover {
    background: rgb(30, 100, 70);
    transform: scale(1.05);
}

/* 아이콘 선택 스타일 */
.position-options,
.voice-options,
.game-mode-options {
    display: flex;
    justify-content: center;
    /* 아이콘들을 가운데 정렬 */
    align-items: center;
    gap: 20px;
    /* 아이콘 간격 조정 */
    flex-wrap: wrap;
    /* 여러 줄로 자동 배치 */
}

/* 포지션 아이콘 크기 */
.position-options img {
    width: var(--position-icon-width, 80px);
    height: var(--position-icon-height, 80px);
    transition: transform 0.2s;
}

/* 음성 채팅 아이콘 크기 */
.voice-options img {
    width: var(--voice-icon-width, 50px);
    height: var(--voice-icon-height, 80px);
    transition: transform 0.2s;
}

/* 게임 모드 아이콘 크기 */
.game-mode-options img {
    width: var(--game-mode-icon-width, 80px);
    height: var(--game-mode-icon-height, 80px);
    transition: transform 0.2s;
}


.position-options img:hover,
.voice-options img:hover,
.game-mode-options img:hover {
    transform: scale(1.1);
}

/* 선택된 아이콘 강조 */
.selected img,
.active img {
    border: 3px solid rgb(21, 81, 55);
    border-radius: 10px;
}

/* 매칭 중 로딩 아이콘 */
.loading-icon {
    width: 80px;
    height: 80px;
    animation: spin 1s linear infinite;
}

/* 회전 애니메이션 */
@keyframes spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

/* 대기 시간 표시 */
.waiting-time {
    font-size: 24px;
    font-weight: bold;
    margin: 10px 0;
}

/* 매칭 버튼 */
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

.popup-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
}

.popup-content {
    background: #333;
    /* 배경 어두운 색으로 유지 */
    padding: 20px;
    border-radius: 5px;
    text-align: center;
}

/*  매칭 중 안내 문구 흰색으로 변경 */
.popup-content p {
    color: white;
    /* 글자 색상을 흰색으로 변경 */
    font-size: 18px;
    text-align: center;
}

.position-options img {
    width: v-bind(positionIconSize + 'px');
    height: v-bind(positionIconSize + 'px');
}



.game-mode-options img {
    width: v-bind(gameModeIconSize + 'px');
    height: v-bind(gameModeIconSize + 'px');
}

/* 아이콘과 글자 세로 정렬 */
.icon-container {
    display: flex;
    flex-direction: column;
    /* 세로 정렬 */
    align-items: center;
    /* 가운데 정렬 */
    text-align: center;
    cursor: pointer;
    margin: 10px;
}

/* ✅ 아이콘 밑에 텍스트 스타일 */
.icon-label {
    margin-top: 5px;
    /* 아이콘과 글자 사이 여백 */
    font-size: 14px;
    color: white;
}

.match-confirmation {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: fixed;
    /* 화면에 고정 (팝업 역할) */
    top: 50%;
    /* 화면 중앙 위치 */
    left: 50%;
    transform: translate(-50%, -50%);
    /* 정확한 중앙 정렬 */
    width: 400px;
    /* 원하는 팝업 크기 */
    height: 600px;
    /* 원하는 팝업 크기 */
    background: #222;
    /* 팝업 배경 색 */
    color: white;
    border-radius: 15px;
    /* 팝업 모서리 둥글게 */
    padding: 20px;
    text-align: center;
}

.match-info {
    text-align: center;
}

.opponent-profile {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 20px;
}

.profile-picture {
    width: 100px;
    height: 100px;
    background-color: #2c2c2c;
    border-radius: 50%;
}

.match-buttons {
    display: flex;
    gap: 10px;
}

.reject-button,
.accept-button {
    padding: 15px 30px;
    font-size: 16px;
    border: none;
    cursor: pointer;
}

.reject-button {
    background: none;
    border: 2px solid white;
    color: white;
    border-radius: 45px;
}

.accept-button {
    background: rgb(21, 81, 55);
    color: white;
    border-radius: 45px;
}
</style>