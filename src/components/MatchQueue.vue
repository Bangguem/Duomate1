<template>
    <div class="match-queue">
        <h1>매칭 대기</h1>

        <!-- 옵션 선택 -->
        <div class="options">
            <h2>포지션 선택</h2>
            <select v-model="position">
                <option value="탑">탑</option>
                <option value="정글">정글</option>
                <option value="미드">미드</option>
                <option value="원딜">원딜</option>
                <option value="서폿">서폿</option>
            </select>

            <h2>마이크 여부</h2>
            <select v-model="microphone">
                <option value="가능">가능</option>
                <option value="불가">불가</option>
            </select>

            <h2>매칭 유형</h2>
            <select v-model="matchType">
                <option value="일반">일반</option>
                <option value="랭크">랭크</option>
            </select>
        </div>

        <!-- 매칭 시작 버튼 -->
        <button @click="startMatching" :disabled="isMatching">매칭 시작</button>

        <!-- 매칭 중 -->
        <div class="popup-overlay" v-if="isMatching">
            <div class="popup-content">
                <h2>매칭 중...</h2>
                <p>잠시만 기다려주세요.</p>
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
            position: "탑",
            microphone: "가능",
            matchType: "일반",
            isMatching: false,
            matchFound: false,
            matchId: null,
        };
    },
    methods: {
        startMatching() {
            this.isMatching = true;
            this.socket.emit(
                this.matchType === "일반" ? "request normalmatch" : "request rankmatch",
                { position: this.position, microphone: this.microphone }
            );

            this.socket.on("matchSuccess", (data) => {
                console.log("🔹 서버에서 받은 matchSuccess 데이터:", data);
                this.matchId = data.matchId;
                this.matchFound = true;
            });

            // ✅ 매칭이 거부되었을 때 UI를 원래 상태로 복구
            this.socket.on("matchCancelled", (data) => {
                console.log("❌ 매칭 취소됨:", data.message);
                this.matchFound = false;
                this.isMatching = false;
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

        acceptMatch() {
            if (this.matchId) {
                this.socket.emit("acceptMatch", { matchId: this.matchId });
            }
        },

        rejectMatch() {
            if (this.matchId) {
                this.socket.emit("rejectMatch", { matchId: this.matchId });
                this.matchFound = false;
                this.isMatching = false;
            }
        },

        cancelMatching() {
            console.log("⛔ 매칭 취소");
            this.isMatching = false;
            this.socket.emit("cancel match");
        },
    },
    mounted() {
        this.socket = io("http://localhost:3000", { withCredentials: true });
        this.socket.on("disconnect", () => {
            console.log("❌ 서버 연결 해제됨. 대기열에서 제거");
            this.isMatching = false;
            this.matchFound = false;
        });
    },
};
</script>

<style scoped>
.match-queue {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.options {
    margin-bottom: 20px;
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
    background-color: #2e2e2e;
    color: white;
    padding: 20px;
    border-radius: 8px;
}
</style>