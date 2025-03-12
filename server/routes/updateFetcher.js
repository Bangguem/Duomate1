const express = require('express');
const moment = require('moment-timezone');
const router = express.Router();

// 업데이트 공지 데이터 (실제 서비스에서는 DB에서 불러오도록 수정 가능)
const updates = [
    { month: '1', day: '14', date: moment().subtract(3, 'days').format('YYYY-MM-DD') },
    { month: '1', day: '1', date: moment().subtract(14, 'days').format('YYYY-MM-DD') },
    { month: '12', day: '17', date: moment().subtract(1, 'months').format('YYYY-MM-DD') },
    { month: '11', day: '3', date: moment().subtract(2, 'months').format('YYYY-MM-DD') },
    { month: '10', day: '9', date: moment().subtract(3, 'months').format('YYYY-MM-DD') },
];

// 업데이트 공지를 반환하는 API
router.get('/updates', (req, res) => {
    try {
        let { sort } = req.query;
        
        let sortedUpdates = [...updates];

        // 정렬 기능: 최신순 / 오래된순
        if (sort === 'latest') {
            sortedUpdates.sort((a, b) => new Date(b.date) - new Date(a.date));
        } else if (sort === 'oldest') {
            sortedUpdates.sort((a, b) => new Date(a.date) - new Date(b.date));
        }

        res.json(sortedUpdates);
    } catch (error) {
        console.error('Error fetching updates:', error);
        res.status(500).json({ message: 'Error fetching updates' });
    }
});

module.exports = router;