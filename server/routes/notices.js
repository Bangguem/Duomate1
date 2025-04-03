// routes/notices.js
const express = require('express');
const router = express.Router();

// 패치노트 목록 가져오기 (GET /api/notices/patch)
router.get('/patch', (req, res) => {
    // 쿼리 파라미터로 전달된 limit 값 읽기, 없으면 기본값 2 사용
    const limit = parseInt(req.query.limit, 10) || 2;
    const patchNotices = notices.filter(notice => notice.type === 'patch').slice(0, limit);
    res.json({ notices: patchNotices });
});

// 업데이트 목록 가져오기 (GET /api/notices/update)
router.get('/update', (req, res) => {
    const limit = parseInt(req.query.limit, 10) || 2;
    const updateNotices = notices.filter(notice => notice.type === 'update').slice(0, limit);
    res.json({ notices: updateNotices });
});

// 문의내역 목록 가져오기 (GET /api/notices/inquiry)
router.get('/inquiry', (req, res) => {
    const limit = parseInt(req.query.limit, 10) || 2;
    const inquiryNotices = notices.filter(notice => notice.type === 'inquiry').slice(0, limit);
    res.json({ notices: inquiryNotices });
});

module.exports = router;