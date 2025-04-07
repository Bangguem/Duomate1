const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');
const cookieParser = require('cookie-parser');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();
const PORT = 3000;

// Socket.IO 설정
const { setupSocketIo, matchDataStore } = require('./setupSocketIo');

// 데이터베이스 및 인증 관련 함수들
const { connectToMongo, fetchUser, createUser, removeUser, ChangeUserprofile,
    createSummoner, fetchUserByemail, updatePassword } = require('./db');
const { generateToken, verifyToken } = require('./auth');

// 라우터 불러오기
const boardRouter = require('./routes/board');
const patchNotesFetcherRouter = require('./routes/patchNotesFetcher');
const noticesRoutes = require('./routes/notices'); // notices 라우트 불러오기
const updateRouter = require('./routes/updateFetcher'); // 업데이트 라우터 추가
const inquiriesRouter = require('./routes/inquiries');
const path = require('path');
// ─────────────────────────────────────────────
//  Middleware 설정
// ─────────────────────────────────────────────
app.use(cors({
    origin: ['http://localhost:8080', 'https://bangguem.github.io'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.options('*', cors());

// ─────────────────────────────────────────────
//  라우터 설정
// ─────────────────────────────────────────────
app.use('/api/board', boardRouter);
app.use('/api/patch-notes', patchNotesFetcherRouter);
app.use('/api/notices', noticesRoutes);
app.use('/api/updates', updateRouter); // 업데이트 API 추가
app.use('/api/inquiries', inquiriesRouter);
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
// ─────────────────────────────────────────────
//  HTTP 서버 및 Socket.IO 초기화
// ─────────────────────────────────────────────
const server = http.createServer(app);
const io = setupSocketIo(server);

connectToMongo().then(() => {
    server.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });
});

// ─────────────────────────────────────────────
//  JWT 인증 미들웨어
// ─────────────────────────────────────────────
function authenticateJWT(req, res, next) {
    const token = req.cookies.auth_token;
    if (!token) {
        req.user = null;
        return res.status(401).json({ message: '로그인이 필요합니다.' });
    }
    const decoded = verifyToken(token);
    if (!decoded) {
        req.user = null;
        res.clearCookie('auth_token');
        return res.status(401).json({ message: '세션이 만료되었거나 유효하지 않은 토큰입니다.' });
    }
    req.user = decoded;
    next();
}

// ─────────────────────────────────────────────
//  사용자 관련 API
// ─────────────────────────────────────────────
// 회원가입
app.post('/signup', async (req, res) => {
    const { userid, password, passwordcheck, email, nickname, birthdate, gender } = req.body;
    if (password !== passwordcheck) {
        return res.status(400).json({ success: false, message: '비밀번호가 일치하지 않습니다.' });
    }
    const user = await fetchUser(userid);
    if (user) {
        return res.status(400).json({ success: false, message: `이미 존재하는 아이디입니다: ${userid}` });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
        userid,
        password: hashedPassword,
        email: email || null,
        nickname,
        birthdate: birthdate || null,
        gender: gender || 'other',
        introduction: "안녕하세요."
    };
    await createUser(newUser);
    const token = generateToken({ userid: newUser.userid });
    res.cookie('auth_token', token, { httpOnly: true });
    return res.status(201).json({ success: true, message: '회원가입이 완료되었습니다.' });
});

// 중복 확인
app.post('/check-duplicate', async (req, res) => {
    const { userid } = req.body;
    const user = await fetchUser(userid);
    if (user) {
        return res.status(400).json({ success: false, message: `이미 존재하는 아이디입니다: ${userid}` });
    }
    return res.status(200).json({ success: true, message: '사용할 수 있는 아이디입니다.' });
});

// 로그인
app.post('/login', async (req, res) => {
    const { userid, password } = req.body;
    try {
        const user = await fetchUser(userid);
        if (!user) {
            return res.status(400).json({ success: false, message: '가입되지 않은 계정입니다.' });
        }
        const matchPassword = await bcrypt.compare(password, user.password);
        if (!matchPassword) {
            return res.status(400).json({ success: false, message: '비밀번호가 틀립니다.' });
        }
        const token = generateToken({ userid: user.userid });
        res.cookie('auth_token', token, {
            httpOnly: true,
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production',
        });
        return res.status(200).json({ success: true, message: '로그인 성공' });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ success: false, message: '서버 오류가 발생했습니다. 다시 시도해주세요.' });
    }
});

// 로그아웃
app.get('/logout', (req, res) => {
    res.clearCookie('auth_token');
    return res.status(200).json({ success: true, message: '로그아웃 성공' });
});

// 로그인 상태 체크
app.get('/auth/check-login', authenticateJWT, async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ loggedIn: false, message: '로그인 상태가 아닙니다.' });
    } else {
        const user = await fetchUser(req.user.userid);
        delete user.password;
        return res.status(200).json({ loggedIn: true, message: '로그인 상태입니다.', user });
    }
});

// 회원 탈퇴
app.get('/withdraw', authenticateJWT, async (req, res) => {
    const user = req.user;
    try {
        const isDeleted = await removeUser(user.userid);
        if (isDeleted) {
            res.clearCookie('auth_token');
            return res.status(200).json({ success: true, message: 'Account successfully deleted' });
        } else {
            return res.status(404).json({ success: false, message: 'User not found in database' });
        }
    } catch (error) {
        console.error('Error during withdrawal:', error);
        return res.status(500).json({ success: false, message: 'Error during account withdrawal' });
    }
});

// 내 정보 변경
app.post('/change-userprofile', authenticateJWT, async (req, res) => {
    const userData = req.user;
    if (userData) {
        const { nickname, birthdate, gender, email, introduction } = req.body;
        
        if (introduction && introduction.length > 500) {
            return res.status(400).json({ success: false, message: '자기소개는 최대 500자까지 입력 가능합니다.' });
        }
        
        try {
            const userprofile = {
                userid: userData.userid,
                nickname,
                birthdate,
                gender,
                email,
                introduction
            };
            await ChangeUserprofile(userprofile);
            return res.status(200).json({ success: true, message: '내 정보 변경 성공' });
        } catch (error) {
            console.error('Error updating profile:', error);
            return res.status(500).json({ success: false, message: '내 정보 변경 실패' });
        }
    } else {
        return res.status(404).json({ success: false, message: 'User Not Found' });
    }
});

// ─────────────────────────────────────────────
//  비밀번호 및 아이디 관련 API
// ─────────────────────────────────────────────
// 비밀번호 재설정 요청
app.post('/request-password-reset', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await fetchUserByemail(email);
        if (!user) {
            return res.status(404).json({ success: false, message: '가입되지 않은 이메일입니다.' });
        }
        const token = generateToken({ email }, '15m');
        const resetLink = `${process.env.CLIENT_URL}/find-password?token=${token}`;
        await transporter.sendMail({
            from: process.env.NODEMAILER_USER,
            to: email,
            subject: '비밀번호 변경 요청',
            text: `비밀번호를 변경하려면 다음 링크를 클릭하세요: ${resetLink}`,
        });
        return res.status(200).json({ success: true, message: '비밀번호 변경 링크가 이메일로 전송되었습니다.' });
    } catch (error) {
        console.error('Error requesting password reset:', error);
        return res.status(500).json({ success: false, message: '비밀번호 변경 요청 중 오류가 발생했습니다.' });
    }
});

// 비밀번호 재설정
app.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;
    try {
        const decoded = verifyToken(token);
        if (!decoded) {
            return res.status(400).json({ success: false, message: '유효하지 않거나 만료된 링크입니다.' });
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const result = await updatePassword(decoded.email, hashedPassword);
        if (result.matchedCount > 0) {
            return res.status(200).json({ success: true, message: '비밀번호가 성공적으로 변경되었습니다.' });
        } else {
            return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
        }
    } catch (error) {
        console.error('Error resetting password:', error);
        return res.status(500).json({ success: false, message: '비밀번호 변경 중 오류가 발생했습니다.' });
    }
});

// 아이디 찾기 요청
app.post('/request-userid', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await fetchUserByemail(email);
        if (!user) {
            return res.status(404).json({ success: false, message: '가입되지 않은 이메일입니다.' });
        }
        await transporter.sendMail({
            from: process.env.NODEMAILER_USER,
            to: email,
            subject: 'Duo-Mate 아이디 찾기',
            text: `사용자님의 아이디는 : ${user.userid} 입니다`,
        });
        return res.status(200).json({ success: true, message: '아이디가 이메일로 전송되었습니다.' });
    } catch (error) {
        console.error('Error requesting password reset:', error);
        return res.status(500).json({ success: false, message: '아이디 요청 중 오류가 발생했습니다.' });
    }
});

// ─────────────────────────────────────────────
//  소환사 정보 관련 API
// ─────────────────────────────────────────────
// 소환사 정보 가져오기
app.post('/summonerInfo', async (req, res) => {
    const { userid, summonerName, tag } = req.body;
    try {
        // 로그인 상태일 때는 세션에서 userData 사용
        let finalUserid = userid;
        if (!finalUserid && req.session && req.session.userData) {
            finalUserid = req.session.userData.userid;
        }

        if (!finalUserid) {
            return res.status(400).json({ success: false, message: 'userid가 없습니다.' });
        }
        const summonerprofile = {
            userid: finalUserid,
            summonerName,
            tag,
        };
        await createSummoner(summonerprofile);
        return res.status(200).json({ success: true, message: '소환사 정보 가져오기 성공' });
    } catch (error) {
        console.error('Error updating profile:', error);
        return res.status(500).json({ success: false, message: '소환사 정보 가져오기 실패' });
    }

});


// 소환사 정보 갱신
app.post('/updateSummonerInfo', authenticateJWT, async (req, res) => {
    const userData = req.user;
    if (userData) {
        const user = await fetchUser(userData.userid);
        try {
            const summonerprofile = {
                userid: user.userid,
                summonerName: user.SummonerName,
                tag: user.Tag
            };
            await createSummoner(summonerprofile);
            return res.status(200).json({ success: true, message: '소환사 정보 갱신 성공' });
        } catch (error) {
            console.error('Error updating profile:', error);
            return res.status(500).json({ success: false, message: '소환사 정보 갱신 실패' });
        }
    } else {
        return res.status(404).json({ success: false, message: 'User Not Found' });
    }
});

// ─────────────────────────────────────────────
//  매칭 관련 API
// ─────────────────────────────────────────────
// 매칭 정보 조회
app.get("/match/get/:matchId", (req, res) => {
    const matchId = req.params.matchId;
    console.log(`📢 매칭 정보 요청: ${matchId}`);
    console.log(`🔍 저장된 매칭 데이터:`, matchDataStore);
    if (!matchId || !matchDataStore[matchId]) {
        console.error(`❌ matchId(${matchId})에 해당하는 매칭 정보를 찾을 수 없음`);
        return res.status(404).json({ success: false, message: "매칭 정보 없음" });
    }
    return res.json({ success: true, match: matchDataStore[matchId] });
});

// 매칭 저장
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
    return res.json({ success: true, matchId });
});

// ─────────────────────────────────────────────
//  Express 앱 내보내기
// ─────────────────────────────────────────────
module.exports = app;