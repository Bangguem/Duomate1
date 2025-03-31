// routes/notices.js
const express = require('express');
const router = express.Router();

// 패치노트 목록 가져오기 (GET /api/notices/patch)
router.get('/patch', (req, res) => {
    const patchNotices = notices.filter(notice => notice.type === 'patch');
    res.json({ notices: patchNotices });
});

// 업데이트 목록 가져오기 (GET /api/notices/update)
router.get('/update', (req, res) => {
    const updateNotices = notices.filter(notice => notice.type === 'update');
    res.json({ notices: updateNotices });
});

// 문의내역 목록 가져오기 (GET /api/notices/inquiry)
router.get('/inquiry', (req, res) => {
    const inquiryNotices = notices.filter(notice => notice.type === 'inquiry');
    res.json({ notices: inquiryNotices });
});

module.exports = router;