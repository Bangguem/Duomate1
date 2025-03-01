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


    const duoRestrictions = {
        IRON: ["IRON", "BRONZE", "SILVER"],
        BRONZE: ["IRON", "BRONZE", "SILVER"],
        SILVER: ["IRON", "BRONZE", "SILVER", "GOLD"],
        GOLD: ["SILVER", "GOLD", "PLATINUM"],
        PLATINUM: ["GOLD", "PLATINUM", "EMERALD IV", "EMERALD III"],
        "EMERALD IV": ["PLATINUM", "EMERALD III", "EMERALD IV"],
        "EMERALD III": ["PLATINUM", "EMERALD II", "EMERALD III", "EMERALD IV"],
        "EMERALD II": ["EMERALD I", "EMERALD II", "EMERALD III", "DIAMOND IV"],
        "EMERALD I": ["EMERALD I", "EMERALD II", "DIAMOND IV", "DIAMOND III"],
        "DIAMOND IV": ["EMERALD I", "EMERALD II", "DIAMOND III", "DIAMOND IV"],
        "DIAMOND III": ["DIAMOND II", "DIAMOND III", "DIAMOND IV", "EMERALD I"],
        "DIAMOND II": ["DIAMOND I", "DIAMOND II", "DIAMOND III"],
        "DIAMOND I": ["MASTER", "DIAMOND I", "DIAMOND II"],
        MASTER: ["GRANDMASTER", "MASTER", "DIAMOND I"],
        GRANDMASTER: ["CHALLENGER", "GRANDMASTER", "MASTER"],
        CHALLENGER: ["CHALLENGER", "GRANDMASTER"],
    };

    // 큐 관리를 위한 클래스
    class MatchQueue {
        constructor(queueType) {
            this.queueType = queueType;
            this.queue = [];
            this.processingInterval = null;
            this.BATCH_INTERVAL = 5000;
        }

        addToQueue(playerData) {
            const queueEntry = {
                ...playerData,
                joinTime: Date.now()
            };

            // 이미 큐에 있는지 확인
            const isAlreadyInQueue = this.queue.some(entry =>
                entry.socket.id === playerData.socket.id ||
                entry.user.userid === playerData.user.userid
            );

            if (!isAlreadyInQueue) {
                this.queue.push(queueEntry);

                if (this.queue.length === 1) {
                    this.startProcessing();
                }
            }
        }

        removeFromQueue(socketId) {
            this.queue = this.queue.filter(entry => entry.socket.id !== socketId);

            if (this.queue.length === 0) {
                this.stopProcessing();
            }
        }

        findMatchablePlayers(player) {
            if (this.queueType !== 'rank') {
                return this.queue.filter(entry =>
                    entry.socket.id !== player.socket.id &&
                    entry.user.userid !== player.user.userid
                );
            }

            return this.queue.filter(entry => {
                // 자기 자신 제외
                if (entry.socket.id === player.socket.id || entry.user.userid === player.user.userid) {
                    return false;
                }

                const tier1 = player.user.summonerRank.tier;
                const tier2 = entry.user.summonerRank.tier;


                // 에메랄드나 다이아몬드인 경우
                if (tier1.includes('EMERALD') || tier1.includes('DIAMOND') ||
                    tier2.includes('EMERALD') || tier2.includes('DIAMOND')) {
                    const key1 = `${tier1} ${player.user.summonerRank.rank}`;
                    const key2 = `${tier2} ${entry.user.summonerRank.rank}`;
                    return duoRestrictions[key1]?.includes(key2) || duoRestrictions[key2]?.includes(key1);
                }

                return duoRestrictions[tier1]?.includes(tier2) ||
                    duoRestrictions[tier2]?.includes(tier1);
            });
        }

        processBatch() {
            this.queue.sort((a, b) => a.joinTime - b.joinTime);
            const processed = new Set();

            for (let i = 0; i < this.queue.length; i++) {
                if (processed.has(i)) continue;

                const player1 = this.queue[i];
                if (!player1) continue;

                // 매칭 가능한 플레이어 풀 찾기
                const matchablePlayers = this.findMatchablePlayers(player1);
                if (matchablePlayers.length === 0) continue;

                // 매칭 가능한 플레이어들 중 랜덤 선택 (자기 자신 제외)
                const validPlayers = matchablePlayers.filter(p =>
                    p.socket.id !== player1.socket.id &&
                    p.user.userid !== player1.user.userid
                );

                if (validPlayers.length === 0) continue;

                const randomIndex = Math.floor(Math.random() * validPlayers.length);
                const player2 = validPlayers[randomIndex];

                // 매칭 성공한 플레이어들 제거
                this.queue = this.queue.filter(p =>
                    p.socket.id !== player1.socket.id &&
                    p.socket.id !== player2.socket.id &&
                    p.user.userid !== player1.user.userid &&
                    p.user.userid !== player2.user.userid
                );

                // 매칭 데이터 생성 및 처리 로직
                const matchId = uuidv4();
                const roomName = `${this.queueType}_room_${matchId}`;

                const matchData = {
                    matchId,
                    roomName,
                    queueType: this.queueType,
                    players: [
                        {
                            userid: player1.user.userid,
                            nickname: player1.user.nickname,
                            position: player1.user.position,
                            microphone: player1.user.microphone,
                            socketId: player1.socket.id,
                            accepted: false,
                            tier: player1.user.summonerRank.tier,
                            summonerRank: player1.user.summonerRank,
                            summonerInfo: player1.user.summonerInfo,
                            top5Champions: player1.user.top5Champions
                        },
                        {
                            userid: player2.user.userid,
                            nickname: player2.user.nickname,
                            position: player2.user.position,
                            microphone: player2.user.microphone,
                            socketId: player2.socket.id,
                            accepted: false,
                            tier: player2.user.summonerRank.tier,
                            summonerRank: player2.user.summonerRank,
                            summonerInfo: player2.user.summonerInfo,
                            top5Champions: player2.user.top5Champions
                        }
                    ]
                };

                matchDataStore[matchId] = matchData;
                pendingMatches.set(matchId, matchData);

                player1.socket.emit('matchSuccess', { matchId });
                player2.socket.emit('matchSuccess', { matchId });

                console.log(`✅ 매칭 성공: ${player1.user.nickname}(${player1.user.summonerRank.tier}) - ${player2.user.nickname}(${player2.user.summonerRank.tier})`);

                processed.add(i);
                processed.add(this.queue.indexOf(player2));
            }
        }

        startProcessing() {
            if (!this.processingInterval) {
                this.processingInterval = setInterval(() => {
                    this.processBatch();
                }, this.BATCH_INTERVAL);
            }
        }

        stopProcessing() {
            if (this.processingInterval) {
                clearInterval(this.processingInterval);
                this.processingInterval = null;
            }
        }
    }

    const normalQueue = new MatchQueue('normal');
    const rankQueue = new MatchQueue('rank');
    const pendingMatches = new Map();

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
                normalQueue.addToQueue({ user, socket });
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
                rankQueue.addToQueue({ user, socket });
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
                    io.to(player.socketId).emit('matchRejected', {
                        message: "⚠️ 상대방이 매칭을 거부했습니다."
                    });
                }
            });

            delete matchDataStore[matchId];
            pendingMatches.delete(matchId);
        });

        socket.on('cancel match', () => {
            normalQueue.removeFromQueue(socket.id);
            rankQueue.removeFromQueue(socket.id);
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
            normalQueue.removeFromQueue(socket.id);
            rankQueue.removeFromQueue(socket.id);
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
        });
    });

    return io;
};

module.exports = { setupSocketIo, matchDataStore };