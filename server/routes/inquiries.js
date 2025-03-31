const express = require('express');
const router = express.Router();
const { verifyToken } = require('../auth');
const {
  createInquiry,
  getInquiriesByUser,
  getAllInquiries,
  getInquiryById,
  answerInquiry,
} = require('../db');

function authenticateJWT(req, res, next) {
  const token = req.cookies.auth_token;

  if (!token) {
    req.user = null;
    return next();
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    req.user = null;
    return next();
  }

  req.user = decoded;
  next();
}

// 문의 등록 (POST)
router.post('/', authenticateJWT, async (req, res) => {
  const user = req.user;
  const { title, content } = req.body;

  if (!user || !title || !content) {
    return res.status(400).json({ success: false, message: '필수 정보 누락' });
  }

  try {
    const inquiry = await createInquiry({
      userId: user.userid,
      name: user.nickname || user.userid, // 닉네임 없으면 아이디 사용
      title,
      content,
    });
    res.status(201).json({ success: true, inquiry });
  } catch (error) {
    console.error('문의 등록 오류:', error);
    res.status(500).json({ success: false, message: '문의 등록 실패' });
  }
});

// 문의 목록 조회 (사용자 / 관리자)
router.get('/', authenticateJWT, async (req, res) => {
  const user = req.user;

  try {
    const inquiries =
      user.userid === 'Admin'
        ? await getAllInquiries()
        : await getInquiriesByUser(user.userid);
    res.json({ success: true, inquiries });
  } catch (error) {
    console.error('문의 목록 조회 오류:', error);
    res.status(500).json({ success: false, message: '문의 목록 조회 실패' });
  }
});

// 문의 상세 조회
router.get('/:id', authenticateJWT, async (req, res) => {
  const user = req.user;
  const inquiryId = req.params.id;

  try {
    const inquiry = await getInquiryById(inquiryId);

    if (!inquiry) {
      return res.status(404).json({ success: false, message: '문의 없음' });
    }

    if (user.userid !== 'Admin' && user.userid !== inquiry.userId) {
      return res.status(403).json({ success: false, message: '접근 권한 없음' });
    }

    res.json({ success: true, inquiry });
  } catch (error) {
    console.error('문의 상세 조회 오류:', error);
    res.status(500).json({ success: false, message: '문의 상세 조회 실패' });
  }
});

// 관리자 답변 등록
router.put('/:id/answer', authenticateJWT, async (req, res) => {
  const user = req.user;
  const inquiryId = req.params.id;
  const { answer } = req.body;

  if (user.userid !== 'Admin') {
    return res.status(403).json({ success: false, message: '관리자만 답변 가능' });
  }

  try {
    const success = await answerInquiry(inquiryId, answer);
    if (!success) {
      return res.status(404).json({ success: false, message: '문의 없음' });
    }

    res.json({ success: true, message: '답변 등록 완료' });
  } catch (error) {
    console.error('답변 등록 오류:', error);
    res.status(500).json({ success: false, message: '답변 등록 실패' });
  }
});

module.exports = router;