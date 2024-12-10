// routes/board.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { createPost, fetchPosts, deletePost, getPostById, fetchUser } = require('../db');
const { ObjectId } = require('mongodb');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

// JWT 인증 미들웨어 정의
async function authenticateJWT(req, res, next) {
    const token = req.cookies.auth_token;
    if (!token) {
        req.user = null;
        return next();
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (!decoded || !decoded.userid) {
            req.user = null;
            return next();
        }

        // 사용자 정보 가져오기
        const user = await fetchUser(decoded.userid);
        if (!user) {
            req.user = null;
            return next();
        }

        req.user = { userid: user.userid, nickname: user.nickname };
        next();
    } catch (error) {
        console.error('Token verification failed:', error);
        req.user = null;
        next();
    }
}

// 게시글 목록 조회
router.get('/', async (req, res) => {
    try {
        const posts = await fetchPosts();
        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: '게시글을 가져오는데 실패했습니다.', error });
    }
});

// 게시글 작성
router.post('/', authenticateJWT, async (req, res) => {
    const { title, content } = req.body;

    if (!title || !content) {
        return res.status(400).json({ message: '제목과 내용은 필수입니다.' });
    }

    if (!req.user || !req.user.nickname) {
        return res.status(401).json({ message: '인증되지 않은 사용자입니다.' });
    }

    const author = req.user.nickname;

    try {
        const post = await createPost({ title, content, author });
        res.status(201).json(post);
    } catch (error) {
        res.status(500).json({ message: '게시글 작성에 실패했습니다.', error });
    }
});

// 게시글 삭제
router.delete('/:id', authenticateJWT, async (req, res) => {
    const postId = req.params.id;

    if (!ObjectId.isValid(postId)) {
        return res.status(400).json({ message: '잘못된 게시글 ID 형식입니다.' });
    }

    try {
        const post = await getPostById(postId);
        if (!post) {
            return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
        }

        if (post.author !== req.user.nickname) {
            return res.status(403).json({ message: '게시글 작성자만 삭제할 수 있습니다.' });
        }

        const success = await deletePost(postId, req.user.nickname);
        if (success) {
            res.status(200).json({ message: '게시글이 성공적으로 삭제되었습니다.' });
        } else {
            res.status(404).json({ message: '삭제할 게시글을 찾을 수 없습니다.' });
        }
    } catch (error) {
        res.status(500).json({ message: '게시글 삭제에 실패했습니다.', error });
    }
});

module.exports = router;