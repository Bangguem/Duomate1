const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// Middleware 설정
app.use(cors({
    origin: 'http://localhost:8080', // Vue 개발 서버 URL
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // 허용할 HTTP 메서드
    credentials: true, // 쿠키를 포함한 요청 허용
    allowedHeaders: ['Content-Type', 'Authorization'], // 허용할 헤더
}));
app.use(bodyParser.json());
app.options('*', cors()); // 모든 경로에 대해 OPTIONS 요청 허용

// 서버 실행


const bcrypt = require('bcrypt');
require('dotenv').config();
const { connectToMongo, fetchUser, createUser, removeUser, closeMongoConnection,
    createUserprofile, createSummoner, fetchUserByemail, updatePassword, } = require('./db');
const { generateToken, verifyToken } = require('./auth');
const cookieParser = require('cookie-parser');
app.use(cookieParser()); // 쿠키 파싱
app.use(express.urlencoded({ extended: true })); // URL-encoded 요청 본문 파싱

connectToMongo().then(() => {
    app.listen(PORT, () => {
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
    const newUser = { userid, password: hashedPassword, email, nickname, birthdate, gender };
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

app.get('/auth/check-login', authenticateJWT, (req, res) => {
    if (!req.user) {
        return res.status(401).json({ loggedIn: false, message: '로그인 상태가 아닙니다.' });
    }

    res.status(200).json({
        loggedIn: true,
        username: req.user.username, // JWT에 저장된 사용자 정보 반환
        message: '로그인 상태입니다.',
    });
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