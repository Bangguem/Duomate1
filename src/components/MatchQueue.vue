<template>
    <div class="match-queue">
        <h1>매칭 대기</h1>
        <button @click="startMatching">매칭 시작</button>

        <!-- 매칭 중 팝업 -->
        <div class="popup-overlay" v-if="isMatching">
            <div class="popup-content">
                <h2>매칭 중...</h2>
                <p>잠시만 기다려주세요.</p>
                <button @click="cancelMatching">취소</button>
            </div>
        </div>
    </div>
</template>

<script>
import { io } from 'socket.io-client';

export default {
    data() {
        return {
            socket: null,
            isMatching: false, // 매칭 중 상태
        };
    },
    methods: {
        startMatching() {
            this.isMatching = true; // 팝업 표시
            this.socket.emit('request normalmatch');
        },
        cancelMatching() {
            this.isMatching = false; // 팝업 숨김
            this.socket.emit('cancel match');
        },
    },
    mounted() {
        this.socket = io('http://localhost:3000', {
            withCredentials: true,
        }); // 서버 연결
        this.socket.on('matchSuccess', (data) => {
            this.isMatching = false; // 매칭 중 팝업 닫기
            alert(`매칭 성공! 상대방 닉네임: ${data.partner.nickname}`);
            this.$router.push({
                path: '/chatroom',
                params: { partner: data.partner },
            });
        });
    },
};
</script>

<style scoped>
.match-queue {
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #2e2e2e;
    color: white;
    text-align: center;
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
    z-index: 1000;
}

.popup-content {
    background-color: #2a2a2a;
    color: white;
    width: 300px;
    padding: 20px;
    border-radius: 8px;
    text-align: center;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.popup-content button {
    margin-top: 20px;
    padding: 10px 20px;
    background-color: #155137;
    border: none;
    color: white;
    border-radius: 4px;
    cursor: pointer;
}

.popup-content button:hover {
    background-color: #15513775;
}
</style>