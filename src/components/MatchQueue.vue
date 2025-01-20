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

        <!-- 매칭 중 팝업 -->
        <div class="popup-overlay" v-if="isMatching">
            <div class="popup-content">
                <h2>매칭 중...</h2>
                <p>잠시만 기다려주세요.</p>
                <div v-if="matchFound">
                    <h3>상대방: {{ match.partner.nickname }}</h3>
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
            match: null, // 매칭된 상대방 정보
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
    },
        startMatching() {
            this.isMatching = true;
            this.socket.emit(
                this.matchType === "일반" ? "request normalmatch" : "request rankmatch",
                { position: this.position, microphone: this.microphone }
            );

            this.socket.on("matchSuccess", (data) => {
                this.match = data;
                this.matchFound = true;
            });
        },
        cancelMatching() {
            this.isMatching = false;
            this.socket.emit("cancel match");
        },
        acceptMatch() {
            this.socket.emit("accept match", { partner: this.match.partner });
            this.$router.push({
            path: "/chatroom",
            query: { 
                roomName: this.match.roomName,
                nickname: this.match.partner.nickname,
                position: this.match.partner.position,
                microphone: this.match.partner.microphone,
                },
            });
        },
        rejectMatch() {
            this.matchFound = false;
            this.socket.emit("reject match", { partner: this.match.partner });
        },
    },
    mounted() {
        this.socket = io("http://localhost:3000", { withCredentials: true });
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