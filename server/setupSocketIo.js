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

    const recentCancelledMatches = new Map();
    const MATCH_BLOCK_TIME = 5 * 60 * 1000;

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

    // ✅ 최근 취소된 매칭 기록을 저장하는 함수
    function recordMatchCancellation(user1, user2) {
        const key1 = `${user1.userid}-${user2.userid}`;
        const key2 = `${user2.userid}-${user1.userid}`;
        recentCancelledMatches.set(key1, Date.now());
        recentCancelledMatches.set(key2, Date.now());

        // 5분 후 해당 매칭 기록 삭제
        setTimeout(() => {
            recentCancelledMatches.delete(key1);
            recentCancelledMatches.delete(key2);
        }, MATCH_BLOCK_TIME);
    }

    // ✅ 같은 유저가 5분 내에 매칭되지 않도록 방지
    function canReMatch(user1, user2) {
        return !recentCancelledMatches.has(`${user1.userid}-${user2.userid}`);
    }

    // ✅ 매칭 프로세스
    function processQueue(queue, matchType, restrictionsCheck) {
        while (queue.length >= 2) {
            let match1 = null, match2 = null;
            let validMatchFound = false;

            for (let i = 0; i < queue.length; i++) {
                for (let j = i + 1; j < queue.length; j++) {
                    if (canReMatch(queue[i].user, queue[j].user) &&
                        (!restrictionsCheck || restrictionsCheck(queue[i].user, queue[j].user))) {
                        match1 = queue.splice(i, 1)[0];
                        match2 = queue.splice(j - 1, 1)[0]; // `i`가 제거되었으므로 `j-1` 사용
                        validMatchFound = true;
                        break;
                    }
                }
                if (validMatchFound) break;
            }

            if (!validMatchFound) {
                console.log("❌ 매칭 실패: 대기 중인 상대 없음");
                break;
            }

            const matchId = uuidv4();
            const roomName = `${matchType}_room_${match1.socket.id}_${match2.socket.id}`;

            // ✅ 매칭 정보 저장
            matchDataStore[matchId] = {
                matchId,
                roomName,
                players: [
                    {
                        userid: match1.user.userid,
                        nickname: match1.user.nickname,
                        position: match1.user.position,
                        microphone: match1.user.microphone,
                    },
                    {
                        userid: match2.user.userid,
                        nickname: match2.user.nickname,
                        position: match2.user.position,
                        microphone: match2.user.microphone,
                    }
                ]
            };

            console.log(`✅ 매칭 성공! MatchId: ${matchId}`);
            console.log(`🔹 현재 matchDataStore:`, matchDataStore);

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

        socket.on('cancel match', () => {
            const cancelMatch = (queue) => {
                const index = queue.findIndex(entry => entry.socket.id === socket.id);
                if (index !== -1) {
                    const cancelledUser = queue.splice(index, 1)[0];
                    queue.forEach(entry => recordMatchCancellation(cancelledUser.user, entry.user));
                    socket.emit('matchCancelled', { message: "매칭이 취소되었습니다." });
                    return true;
                }
                return false;
            };

            if (!cancelMatch(waitingNormalQueue)) cancelMatch(rankQueue);
        });

        socket.on('disconnect', () => {
            console.log(`❌ 연결 해제: ${socket.id}`);
        });
    });

    return io;
}

module.exports = { setupSocketIo, matchDataStore };