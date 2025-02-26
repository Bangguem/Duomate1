// routes/notices.js
const express = require('express');
const router = express.Router();

// 예시 공지사항 데이터 (각 항목에 type 추가)
const notices = [
    { version: '1.1', date: '2021년 8월 15일', description: '- 새로운 기능 추가 및 버그 수정', type: 'patch' },
    { version: '1.0.1', date: '2021년 7월 30일', description: '- 보안 업데이트 및 성능 개선', type: 'update' },
    { version: '1.5.10', date: '3일 전', description: '- 기타 성능 향상', type: 'inquiry' },
    { version: '1.5.9', date: '2주 전', description: '- 게임 밸런스 조정', type: 'update' },
    { version: '1.5.8', date: '1달 전', description: '- UI 개선', type: 'patch' },
    { version: '1.5.7', date: '2달 전', description: '- 서버 안정성 강화', type: 'inquiry' }
];

// 공지사항 목록 가져오기 (GET /api/notices)
router.get('/', (req, res) => {
    res.json({ notices });
});

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

// 공지사항 추가 (POST /api/notices)
router.post('/', (req, res) => {
    const { version, date, description, type } = req.body;

    if (!version || !date || !description || !type) {
        return res.status(400).json({ success: false, message: '모든 필드를 입력해야 합니다.' });
    }

    const newNotice = {
        version,
        date,
        description,
        type,
    };

    notices.push(newNotice);
    res.status(201).json({ success: true, message: '새로운 공지사항이 추가되었습니다.', notice: newNotice });
});

// 공지사항 삭제 (DELETE /api/notices/:id)
router.delete('/:id', (req, res) => {
    const noticeId = parseInt(req.params.id, 10);
    const index = notices.findIndex(n => n.version === noticeId);

    if (index !== -1) {
        const deletedNotice = notices.splice(index, 1);
        res.json({ success: true, message: '공지사항이 삭제되었습니다.', notice: deletedNotice });
    } else {
        res.status(404).json({ success: false, message: '공지사항을 찾을 수 없습니다.' });
    }
});

module.exports = router;