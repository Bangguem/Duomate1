const socketIo = require('socket.io');
const { fetchUser } = require('./db');
const { verifyToken } = require('./auth');

function setupSocketIo(server) {
    const io = socketIo(server, {
        cors: {
            origin: "http://localhost:8080",
            methods: ["GET", "POST"],
            credentials: true,
        },
    });

    const waitingNormalQueue = [];
    const rankQueue = [];
    const recentCancelledMatches = new Map();
    const MATCH_BLOCK_TIME = 5 * 60 * 1000;
    let isProcessingNormalQueue = false;
    let isProcessingRankQueue = false;

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

    // 인증 미들웨어
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

    function canMatchByRank(userTier, userRank, targetTier, targetRank) {
        const userKey = `${userTier} ${userRank}`;
        const allowedRanks = duoRestrictions[userKey];
        const targetKey = `${targetTier} ${targetRank}`;
        return allowedRanks ? allowedRanks.includes(targetKey) : false;
    }

    function recordMatchCancellation(user1, user2) {
        const key1 = `${user1.userid}-${user2.userid}`;
        const key2 = `${user2.userid}-${user1.userid}`;
        recentCancelledMatches.set(key1, Date.now());
        recentCancelledMatches.set(key2, Date.now());
        setTimeout(() => {
            recentCancelledMatches.delete(key1);
            recentCancelledMatches.delete(key2);
        }, MATCH_BLOCK_TIME);
    }

    async function processQueue(queue, matchType) {
        const isProcessing = matchType === "rank" ? isProcessingRankQueue : isProcessingNormalQueue;
        if (isProcessing) return;

        if (matchType === "rank") isProcessingRankQueue = true;
        else isProcessingNormalQueue = true;

        while (queue.length >= 2) {
            const match1 = queue.shift();
            const match2 = queue.shift();

            const roomName = `${matchType}_room_${match1.socket.id}_${match2.socket.id}`;
            match1.socket.join(roomName);
            match2.socket.join(roomName);

            const matchData1 = {
                partner: {
                    nickname: match2.user.nickname,
                    position: match2.user.position,
                    microphone: match2.user.microphone,
                },
                roomName,
            };

            const matchData2 = {
                partner: {
                    nickname: match1.user.nickname,
                    position: match1.user.position,
                    microphone: match1.user.microphone,
                },
                roomName,
            };

            match1.socket.emit('matchSuccess', matchData1);
            match2.socket.emit('matchSuccess', matchData2);
        }

        if (matchType === "rank") isProcessingRankQueue = false;
        else isProcessingNormalQueue = false;
    }

    io.on('connection', (socket) => {
        console.log(`New connection: ${socket.id}`);

        socket.on('join room', ({ roomName }) => {
            console.log(`${socket.id} joined room: ${roomName}`);
            socket.join(roomName);
        });

        // 채팅 메시지 처리
        socket.on('chat message', ({ roomName, message }) => {
            console.log(`Message in ${roomName}: ${message}`);
            io.to(roomName).emit('chat message', {
                username: socket.user.nickname, // 닉네임 포함
                message,
            });
        });

        socket.on('request normalmatch', async ({ position, microphone }) => {
            try {
                const user = await fetchUser(socket.user.userid);
                user.position = position;
                user.microphone = microphone;

                if (waitingNormalQueue.some(entry => entry.user.userid === user.userid)) {
                    socket.emit('alreadyInQueue', { message: "이미 대기 중입니다." });
                    return;
                }

                waitingNormalQueue.push({ user, socket });
                processQueue(waitingNormalQueue, "normal");
            } catch (error) {
                console.error("Error in normal match request:", error);
                socket.emit('matchError', { message: "일반 매칭 요청 중 오류가 발생했습니다." });
            }
        });

        socket.on('request rankmatch', async ({ position, microphone }) => {
            try {
                const user = await fetchUser(socket.user.userid);
                user.position = position;
                user.microphone = microphone;

                if (!user.summonerRank?.tier || !user.summonerRank?.rank) {
                    socket.emit('matchError', { message: "랭크 정보가 유효하지 않습니다." });
                    return;
                }

                if (rankQueue.some(entry => entry.user.userid === user.userid)) {
                    socket.emit('alreadyInQueue', { message: "이미 대기 중입니다." });
                    return;
                }

                rankQueue.push({ user, socket });
                processQueue(rankQueue, "rank");
            } catch (error) {
                console.error("Error in rank match request:", error);
                socket.emit('matchError', { message: "랭크 매칭 요청 중 오류가 발생했습니다." });
            }
        });

        socket.on('cancel match', () => {
            const indexNormal = waitingNormalQueue.findIndex(entry => entry.socket.id === socket.id);
            if (indexNormal !== -1) {
                const cancelledUser = waitingNormalQueue.splice(indexNormal, 1)[0];
                waitingNormalQueue.forEach(entry => recordMatchCancellation(cancelledUser.user, entry.user));
                socket.emit('matchCancelled', { message: "일반 매칭이 취소되었습니다." });
                return;
            }

            const indexRank = rankQueue.findIndex(entry => entry.socket.id === socket.id);
            if (indexRank !== -1) {
                const cancelledUser = rankQueue.splice(indexRank, 1)[0];
                rankQueue.forEach(entry => recordMatchCancellation(cancelledUser.user, entry.user));
                socket.emit('matchCancelled', { message: "랭크 매칭이 취소되었습니다." });
            }
        });

        socket.on('disconnect', () => {
            console.log(`Connection disconnected: ${socket.id}`);
        });
    });

    return io;
}

module.exports = setupSocketIo;