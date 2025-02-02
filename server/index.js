const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');
const app = express();
const PORT = 3000;
const { setupSocketIo, matchDataStore } = require('./setupSocketIo');// Socket.IO 설정 가져오기

// Middleware 설정
app.use(cors({
    origin: 'http://localhost:8080', // Vue 개발 서버 URL
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // 허용할 HTTP 메서드
    credentials: true, // 쿠키를 포함한 요청 허용
    allowedHeaders: ['Content-Type', 'Authorization'], // 허용할 헤더
}));
app.use(bodyParser.json());
app.options('*', cors()); // 모든 경로에 대해 OPTIONS 요청 허용


const server = http.createServer(app);
const io = setupSocketIo(server);
// 서버 실행


const bcrypt = require('bcrypt');
require('dotenv').config();
const { connectToMongo, fetchUser, createUser, removeUser, closeMongoConnection,
    createUserprofile, createSummoner, fetchUserByemail, updatePassword, } = require('./db');
const { generateToken, verifyToken } = require('./auth');
const cookieParser = require('cookie-parser');
app.use(cookieParser()); // 쿠키 파싱
app.use(express.urlencoded({ extended: true })); // URL-encoded 요청 본문 파싱
const nodemailer = require('nodemailer');
const boardRouter = require('./routes/board');  // board 라우터 추가
// /api/board 라우트 추가
app.use('/api/board', boardRouter);

connectToMongo().then(() => {
    server.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });
});

function authenticateJWT(req, res, next) {
    const token = req.cookies.auth_token;

    if (!token) {
        req.user = null; // 토큰이 없으면 사용자 정보를 null로 설정
        return next();
    }

    // 토큰 검증
    const decoded = verifyToken(token);
    if (!decoded) {
        req.user = null; // 토큰이 유효하지 않으면 사용자 정보를 null로 설정
        return next();
    }

    // 검증이 완료되면 req.user에 사용자 정보 추가
    req.user = decoded;
    next();
}

// 회원가입 API
app.post('/signup', async (req, res) => {
    const { userid, password, passwordcheck, email, nickname, birthdate, gender } = req.body;

    // 비밀번호 확인
    if (password !== passwordcheck) {
        res.status(400).json({ success: false, message: '비밀번호가 일치하지 않습니다.' });
        return;
    }

    // 중복 아이디 확인
    const user = await fetchUser(userid);
    if (user) {
        res.status(400).json({ success: false, message: `이미 존재하는 아이디입니다: ${userid}` });
        return;
    }

    // 비밀번호 해싱 및 사용자 생성
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
        userid,
        password: hashedPassword,
        email: email || null, // 이메일이 없으면 null로 설정
        nickname,
        birthdate: birthdate || null, // 생년월일이 없으면 null로 설정
        gender: gender || 'other', // 성별이 없으면 기본값을 'other'로 설정
    };
    await createUser(newUser);

    // JWT 토큰 생성 및 쿠키에 저장
    const token = generateToken({ userid: newUser.userid });
    res.cookie('auth_token', token, { httpOnly: true });
    res.status(201).json({ success: true, message: '회원가입이 완료되었습니다.' });
});

// 중복 확인 API
app.post('/check-duplicate', async (req, res) => {
    const { userid } = req.body;

    const user = await fetchUser(userid);
    if (user) {
        res.status(400).json({ success: false, message: `이미 존재하는 아이디입니다: ${userid}` });
    } else {
        res.status(200).json({ success: true, message: '사용할 수 있는 아이디입니다.' });
    }
});

app.get('/logout', (req, res) => {
    res.clearCookie('auth_token');
    res.status(200).json({ success: true, message: '로그아웃 성공' });
});

app.get('/auth/check-login', authenticateJWT, async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ loggedIn: false, message: '로그인 상태가 아닙니다.' });
    } else {
        const user = await fetchUser(req.user.userid);
        res.status(200).json({
            loggedIn: true,
            message: '로그인 상태입니다.',
            user,
        });
    }
});


app.post('/login', async (req, res) => {
    const { userid, password } = req.body;

    try {
        // 사용자 조회
        const user = await fetchUser(userid);

        if (!user) {
            return res.status(400).json({
                success: false,
                message: '가입되지 않은 계정입니다.',
            });
        }

        // 비밀번호 확인
        const matchPassword = await bcrypt.compare(password, user.password);
        if (!matchPassword) {
            return res.status(400).json({
                success: false,
                message: '비밀번호가 틀립니다.',
            });
        }

        // JWT 토큰 생성
        const token = generateToken({ userid: user.userid });
        res.cookie('auth_token', token, {
            httpOnly: true, // 클라이언트에서 접근할 수 없도록 설정
            sameSite: 'strict', // CSRF 공격 방지
            secure: process.env.NODE_ENV === 'production', // HTTPS에서만 전송 (배포 시)
        });

        // 성공 응답
        return res.status(200).json({
            success: true,
            message: '로그인 성공',
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다. 다시 시도해주세요.',
        });
    }
});

app.get('/withdraw', authenticateJWT, async (req, res) => {
    const user = req.user;
    try {
        const isDeleted = await removeUser(user.userid);
        if (isDeleted) {
            res.clearCookie('auth_token');
            return res.status(200).json({
                success: true,
                message: 'Account successfully deleted',
            });
        } else {
            return res.status(404).json({
                success: false,
                message: 'User not found in database',
            });
        }
    } catch (error) {
        console.error('Error during withdrawal:', error);
        return res.status(500).json({
            success: false,
            message: 'Error during account withdrawal',
        });
    }
});

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.NODEMAILER_USER,
        pass: process.env.NODEMAILER_PASSWORD,
    },
});

// 비밀번호 재설정 요청 API
app.post('/request-password-reset', async (req, res) => {
    const { email } = req.body;

    try {
        // 이메일로 사용자 확인
        const user = await fetchUserByemail(email);
        if (!user) {
            return res.status(404).json({ success: false, message: '가입되지 않은 이메일입니다.' });
        }

        // JWT 토큰 생성 (유효 시간: 15분)
        const token = generateToken({ email }, '15m');

        // 비밀번호 변경 링크 생성
        const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

        // 이메일 전송
        await transporter.sendMail({
            from: process.env.NODEMAILER_USER,
            to: email,
            subject: '비밀번호 변경 요청',
            text: `비밀번호를 변경하려면 다음 링크를 클릭하세요: ${resetLink}`,
        });

        res.status(200).json({ success: true, message: '비밀번호 변경 링크가 이메일로 전송되었습니다.' });
    } catch (error) {
        console.error('Error requesting password reset:', error);
        res.status(500).json({ success: false, message: '비밀번호 변경 요청 중 오류가 발생했습니다.' });
    }
});

app.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        // 토큰 검증
        const decoded = verifyToken(token);
        if (!decoded) {
            return res.status(400).json({
                success: false,
                message: '유효하지 않거나 만료된 링크입니다.',
            });
        }

        // 비밀번호 해싱 및 업데이트
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const result = await updatePassword(decoded.email, hashedPassword);

        if (result.matchedCount > 0) {
            return res.status(200).json({
                success: true,
                message: '비밀번호가 성공적으로 변경되었습니다.',
            });
        } else {
            return res.status(404).json({
                success: false,
                message: '사용자를 찾을 수 없습니다.',
            });
        }
    } catch (error) {
        console.error('Error resetting password:', error);
        return res.status(500).json({
            success: false,
            message: '비밀번호 변경 중 오류가 발생했습니다.',
        });
    }
});

app.post('/request-userid', async (req, res) => {
    const { email } = req.body;

    try {
        // 이메일로 사용자 확인
        const user = await fetchUserByemail(email);
        if (!user) {
            return res.status(404).json({ success: false, message: '가입되지 않은 이메일입니다.' });
        }

        // 이메일 전송
        await transporter.sendMail({
            from: process.env.NODEMAILER_USER,
            to: email,
            subject: 'Duo-Mate 아이디 찾기',
            text: `사용자님의 아이디는 : ${user.userid} 입니다`,
        });

        res.status(200).json({ success: true, message: '아이디가 이메일로 전송되었습니다.' });
    } catch (error) {
        console.error('Error requesting password reset:', error);
        res.status(500).json({ success: false, message: '아이디 요청 중 오류가 발생했습니다.' });
    }
});

function splitSummonerAndTag(input) {
    const [summonerName, tag = 'kr1'] = input.split('#');
    return { summonerName, tag };
}
//라이엇 정보 가져오기
app.post('/summonerInfo', authenticateJWT, async (req, res) => {
    const userData = req.user;
    if (userData) {
        const { summoner } = req.body;
        const { summonerName, tag } = splitSummonerAndTag(summoner);
        try {
            const summonerprofile = {
                userid: userData.userid,
                summonerName,
                tag,
            };
            await createSummoner(summonerprofile);
            res.status(200).json({ success: true, message: '소환사 정보 가져오기 성공' })
        } catch (error) {
            console.error('Error updating profile:', error);
            res.status(500).json({ success: false, message: '소환사 정보 가져오기 실패' });
        }
    } else {
        res.status(404).json({ success: false, message: 'User Not Found' });
    }
});

// ✅ 매칭 정보 조회 API
app.get("/match/get/:matchId", (req, res) => {
    const matchId = req.params.matchId;

    console.log(`📢 매칭 정보 요청: ${matchId}`);
    console.log(`🔍 저장된 매칭 데이터:`, matchDataStore);

    // ✅ `matchId`가 `matchDataStore`에 존재하는지 확인
    if (!matchId || !matchDataStore[matchId]) {
        console.error(`❌ matchId(${matchId})에 해당하는 매칭 정보를 찾을 수 없음`);
        return res.status(404).json({ success: false, message: "매칭 정보 없음" });
    }

    res.json({ success: true, match: matchDataStore[matchId] });
});

// index.js의 /match/save 엔드포인트 수정
app.post("/match/save", (req, res) => {
    const { matchId } = req.body;
    console.log("📢 매칭 저장 요청 받음. matchId:", matchId);
    console.log("📢 현재 matchDataStore:", matchDataStore);

    if (!matchId || !matchDataStore[matchId]) {
        console.error(`❌ 유효하지 않은 매칭 데이터 (matchId: ${matchId})`);
        return res.status(400).json({
            success: false,
            message: "유효하지 않은 매칭 데이터",
            matchId: matchId,
            availableMatches: Object.keys(matchDataStore)
        });
    }

    console.log(`✅ 매칭 데이터 확인 성공: ${matchId}`);
    console.log("🔹 저장된 매칭 데이터:", matchDataStore[matchId]);

    res.json({ success: true, matchId });
});