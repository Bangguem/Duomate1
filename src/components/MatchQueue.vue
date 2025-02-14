<template>
    <div class="match-queue">
        <div class="match-container">
            <!-- 프로필 -->
            <div class="profile-section">
                <div class="profile-picture"></div>
                <span class="username">{{ username }}</span>
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

        <!-- 매칭 진행 중 팝업 -->
        <div class="popup-overlay" v-if="isMatching">
            <div class="popup-content">
                <!-- 로딩 아이콘 -->
                <img src="/icons/loading.png" alt="Loading" class="loading-icon" />

                <!-- 대기 시간 -->
                <p class="waiting-time">{{ formattedTime }}</p>

                <p>상대를 찾고 있습니다. 잠시만 기다려 주세요.</p>
                <div v-if="matchFound">
                    <button @click="acceptMatch">수락</button>
                    <button @click="rejectMatch">거부</button>
                </div>
                <button v-else @click="cancelMatching">취소</button>
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
            username: "",
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

    mounted() {
        this.fetchUserInfo();
        this.initializeSocket();
    },

    methods: {
        async fetchUserInfo() {
            try {
                const response = await fetch("/api/user");
                const data = await response.json();
                this.username = data.username;
            } catch (error) {
                console.error("사용자 정보를 불러오는 중 오류 발생:", error);
                this.username = "알 수 없음";
            }
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

            this.socket.on("matchCancelled", (data) => {
                console.log("❌ 매칭 취소됨:", data.message);
                this.matchFound = false;
                this.isMatching = false;
                if (this.timer) {
                    clearInterval(this.timer);
                }
                alert("⚠️ 상대방이 매칭을 거부했습니다. 다시 시도해주세요!");
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
    background-color: #1e1e1e;
}

.match-container {
    background-color: #333;
    padding: 20px;
    border-radius: 10px;
    color: white;
    width: 400px;
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

.position-options img,
.voice-options img,
.game-mode-options img {
    width: 60px;
    height: 60px;
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
</style>