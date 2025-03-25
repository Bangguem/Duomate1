const express = require('express');
const moment = require('moment-timezone');
const router = express.Router();
const { fetchUpdates, createUpdate } = require('../db'); // db.js의 함수 임포트

// GET / : 업데이트 목록을 가져옴 (최종 URL: /api/updates)
router.get('/', async (req, res) => {
    try {
        const { sort } = req.query;
        let sortOption = { date: -1 }; // 기본: 최신순
        if (sort === 'oldest') {
            sortOption = { date: 1 };
        }
        const updates = await fetchUpdates(sortOption);
        res.json(updates);
    } catch (error) {
        console.error('Error fetching updates:', error);
        res.status(500).json({ message: 'Error fetching updates' });
    }
});

// POST /: 새로운 업데이트 작성 (내용과 Date 객체를 저장)
router.post('/', async (req, res) => {
    try {
        const { content } = req.body;
        const date = new Date(); // Date 객체로 저장
        const newUpdate = { content, date };
        const createdUpdate = await createUpdate(newUpdate);
        res.json(createdUpdate);
    } catch (error) {
        console.error('Error creating update:', error);
        res.status(500).json({ message: 'Error creating update' });
    }
});

module.exports = router;