const socketIo = require('socket.io');
const { fetchUser } = require('./db');
const { verifyToken } = require('./auth');
const { v4: uuidv4 } = require("uuid");
const matchDataStore = {};

const setupSocketIo = (server) => {
    const io = socketIo(server, {
        cors: {
            origin: "http://localhost:8080",
            methods: ["GET", "POST"],
            credentials: true,
        },
    });

    const waitingNormalQueue = [];
    const rankQueue = [];
    const pendingMatches = new Map(); // 수락 대기 중인 매칭 저장

    const duoRestrictions = {
        IRON: ["IRON", "BRONZE", "SILVER"],
        BRONZE: ["IRON", "BRONZE", "SILVER"],
        SILVER: ["IRON", "BRONZE", "SILVER", "GOLD"],
        GOLD: ["SILVER", "GOLD", "PLATINUM"],
        PLATINUM: ["GOLD", "PLATINUM", "EMERALD"],
        "EMERALD IV": ["PLATINUM", "EMERALD III"],
        "EMERALD III": ["PLATINUM", "EMERALD II", "EMERALD IV"],
        "EMERALD II": ["EMERALD I", "EMERALD III", "DIAMOND IV"],
        "EMERALD I": ["DIAMOND IV", "EMERALD II", "DIAMOND III"],
        "DIAMOND IV": ["EMERALD II", "DIAMOND III"],
        "DIAMOND III": ["DIAMOND II", "DIAMOND IV", "DIAMOND I"],
        "DIAMOND II": ["DIAMOND III", "DIAMOND I"],
        "DIAMOND I": ["DIAMOND II", "MASTER"],
        MASTER: ["DIAMOND I", "GRANDMASTER"],
        GRANDMASTER: ["MASTER", "CHALLENGER"],
        CHALLENGER: ["GRANDMASTER", "CHALLENGER"],
    };

    // ✅ 인증 미들웨어
    io.use((socket, next) => {
        const token = socket.handshake.headers.cookie
            ?.split('; ')
            .find(row => row.startsWith('auth_token='))
            ?.split('=')[1];

        if (!token) return next(new Error('Authentication error'));

        const decoded = verifyToken(token);
        if (!decoded) return next(new Error('Authentication error'));

        socket.user = decoded;
        next();
    });

    function removeUserFromQueue(socketId, queue) {
        const index = queue.findIndex(entry => entry.socket.id === socketId);
        if (index !== -1) {
            queue.splice(index, 1);
        }
    }

    // ✅ 매칭 프로세스 (블랙리스트 로직 제거됨)
    function processQueue(queue, matchType, restrictionsCheck) {
        while (queue.length >= 2) {
            let match1 = queue.shift();  // 첫 번째 유저
            let match2 = queue.shift();  // 두 번째 유저

            const matchId = uuidv4();
            const roomName = `${matchType}_room_${match1.socket.id}_${match2.socket.id}`;

            const matchData = {
                matchId,
                roomName,
                players: [
                    {
                        userid: match1.user.userid,
                        nickname: match1.user.nickname,
                        position: match1.user.position,
                        microphone: match1.user.microphone,
                        socketId: match1.socket.id,
                        accepted: false
                    },
                    {
                        userid: match2.user.userid,
                        nickname: match2.user.nickname,
                        position: match2.user.position,
                        microphone: match2.user.microphone,
                        socketId: match2.socket.id,
                        accepted: false
                    }
                ]
            };

            matchDataStore[matchId] = matchData;
            pendingMatches.set(matchId, matchData);

            match1.socket.emit('matchSuccess', { matchId });
            match2.socket.emit('matchSuccess', { matchId });
        }
    }

    function canMatchByRank(user1, user2) {
        const key1 = `${user1.summonerRank.tier} ${user1.summonerRank.rank}`;
        const key2 = `${user2.summonerRank.tier} ${user2.summonerRank.rank}`;
        return duoRestrictions[key1]?.includes(key2);
    }

    io.on('connection', (socket) => {
        console.log(`✅ 새 연결: ${socket.id}`);

        socket.on("join room", ({ roomName }) => {
            socket.join(roomName);
            console.log(`📢 ${socket.id}님이 방(${roomName})에 참가했습니다.`);

            // 방 참가 확인 이벤트 추가
            socket.emit('room joined', { roomName });

            // 현재 방의 사용자 수 확인
            const room = io.sockets.adapter.rooms.get(roomName);
            console.log(`📊 방 ${roomName}의 현재 사용자 수: ${room ? room.size : 0}`);
        });

        socket.on("chat message", ({ matchId, message }) => {
            console.log(`📨 채팅 메시지 수신:`, { matchId, message, socketId: socket.id });

            const match = matchDataStore[matchId];
            if (!match) {
                console.error(`❌ 매치 ID ${matchId}에 대한 매칭 정보를 찾을 수 없습니다.`);
                socket.emit('error', { message: '매칭 정보를 찾을 수 없습니다.' });
                return;
            }

            console.log(`🔍 매칭 정보:`, match);

            let sender = match.players.find(p => p.socketId === socket.id);
            if (!sender) {
                console.error(`❌ 소켓 ID ${socket.id}에 대한 플레이어 정보를 찾을 수 없습니다.`);
                console.log(`📊 현재 플레이어 목록:`, match.players);

                // 소켓 ID가 변경된 경우를 위한 대체 처리
                const senderByUserId = match.players.find(p => p.userid === socket.user.userid);
                if (senderByUserId) {
                    console.log(`✅ 사용자 ID로 플레이어를 찾았습니다. 소켓 ID 업데이트`);
                    senderByUserId.socketId = socket.id;
                    sender = senderByUserId;
                } else {
                    socket.emit('error', { message: '플레이어 정보를 찾을 수 없습니다.' });
                    return;
                }
            }

            const chatData = {
                username: sender.nickname,
                message: message,
            };

            console.log(`📤 채팅 메시지 전송:`, {
                roomName: match.roomName,
                sender: sender.nickname,
                message: message
            });

            io.to(match.roomName).emit("chat message", chatData);
        });


        socket.on('request normalmatch', async ({ position, microphone }) => {
            try {
                const user = await fetchUser(socket.user.userid);
                user.position = position;
                user.microphone = microphone;

                console.log(`📢 일반 매칭 요청: ${user.nickname}`);
                waitingNormalQueue.push({ user, socket });

                processQueue(waitingNormalQueue, "normal", null);
            } catch (error) {
                console.error("❌ 일반 매칭 오류:", error);
                socket.emit('matchError', { message: "일반 매칭 요청 중 오류 발생" });
            }
        });

        socket.on('request rankmatch', async ({ position, microphone }) => {
            try {
                const user = await fetchUser(socket.user.userid);
                user.position = position;
                user.microphone = microphone;

                console.log(`📢 랭크 매칭 요청: ${user.nickname}`);
                rankQueue.push({ user, socket });

                processQueue(rankQueue, "rank", canMatchByRank);
            } catch (error) {
                console.error("❌ 랭크 매칭 오류:", error);
                socket.emit('matchError', { message: "랭크 매칭 요청 중 오류 발생" });
            }
        });

        // 매칭 수락 이벤트
        socket.on('acceptMatch', ({ matchId }) => {
            console.log(`📢 매칭 수락 요청: ${matchId}`);
            const match = pendingMatches.get(matchId);
            if (!match) return;

            const player = match.players.find(p => p.socketId === socket.id);
            if (player) {
                player.accepted = true;

                if (match.players.every(p => p.accepted)) {
                    match.players.forEach(p => {
                        io.to(p.socketId).emit('matchConfirmed', { matchId });
                    });
                    console.log(`✅ 매칭 확정: ${matchId}`);
                }
            }
        });

        // 매칭 거부 이벤트
        socket.on('rejectMatch', ({ matchId }) => {
            console.log(`📢 매칭 거부: ${matchId}`);
            const match = pendingMatches.get(matchId);
            if (!match) return;

            match.players.forEach(player => {
                if (player.socketId !== socket.id) {
                    io.to(player.socketId).emit('matchCancelled', {
                        message: "⚠️ 상대방이 매칭을 거부했습니다."
                    });
                }
            });

            delete matchDataStore[matchId];
            pendingMatches.delete(matchId);
        });

        socket.on('cancel match', () => {
            removeUserFromQueue(socket.id, waitingNormalQueue);
            removeUserFromQueue(socket.id, rankQueue);
            socket.emit('matchCancelled', { message: "매칭이 취소되었습니다." });
        });

        socket.on("leave room", ({ matchId, userId, nickname }) => {
            console.log(`📢 채팅방 나가기 요청:`, { matchId, userId, nickname });

            const match = matchDataStore[matchId];
            if (!match) return;

            // 방에 있는 다른 사용자들에게 알림
            io.to(match.roomName).emit("user disconnected", {
                userId,
                nickname
            });

            // 사용자를 방에서 제거
            socket.leave(match.roomName);

            // 매칭 데이터에서 해당 매치 정보 삭제
            delete matchDataStore[matchId];

            console.log(`✅ 사용자 ${nickname}가 방 ${match.roomName}에서 나갔습니다.`);
        });

        socket.on('disconnect', () => {
            console.log(`❌ 연결 해제: ${socket.id}`);
            Object.values(matchDataStore).forEach(match => {
                const player = match.players.find(p => p.socketId === socket.id);
                if (player) {
                    console.log(`📢 연결 끊김 알림: ${player.nickname}`);
                    io.to(match.roomName).emit('user disconnected', {
                        userId: player.userid,
                        nickname: player.nickname
                    });
                }
            });
            removeUserFromQueue(socket.id, waitingNormalQueue);
            removeUserFromQueue(socket.id, rankQueue);
        });
    });

    return io;
};

module.exports = { setupSocketIo, matchDataStore };