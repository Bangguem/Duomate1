// routes/board.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { createPost, fetchPosts, deletePost, getPostById, fetchUser, updatePost, updatePostLikes} = require('../db');
const { ObjectId } = require('mongodb');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

// ObjectId 유효성 검사
function isValidObjectId(id) {
    return ObjectId.isValid(id);
}

// 작성자 확인
function isAuthor(post, user) {
    return post.author === user.nickname;
}

// 공통 에러 처리 함수
function handleError(res, status, message) {
    return res.status(status).json({ message });
}

// JWT 인증 미들웨어
async function authenticateJWT(req, res, next) {
    const token = req.cookies.auth_token;

    if (!token) {
        req.user = null;
        return handleError(res, 401, '로그인이 필요합니다.');
    }

    try {
        // Access Token 검증
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await fetchUser(decoded.userid);

        if (!user) {
            req.user = null;
            return handleError(res, 401, '사용자를 찾을 수 없습니다.');
        }

        req.user = { userid: user.userid, nickname: user.nickname };
        next();
    } catch (error) {
        // Access Token 만료 시 로그아웃 처리
        if (error.name === 'TokenExpiredError') {
            res.clearCookie('auth_token'); // 쿠키 삭제
            return handleError(res, 401, '세션이 만료되었습니다. 다시 로그인하세요.');
        } else {
            console.error('Token verification failed:', error);
            req.user = null;
            res.clearCookie('auth_token'); // 쿠키 삭제
            return handleError(res, 401, '유효하지 않은 토큰입니다.');
        }
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

// 게시글 수정
router.put('/:id', authenticateJWT, async (req, res) => {
    const postId = req.params.id;
    const { title, content } = req.body;

    if (!ObjectId.isValid(postId)) {
        return res.status(400).json({ message: '잘못된 게시글 ID 형식입니다.' });
    }

    if (!title || !content) {
        return res.status(400).json({ message: '제목과 내용은 필수입니다.' });
    }

    try {
        const post = await getPostById(postId);
        if (!post) {
            return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
        }

        if (post.author !== req.user.nickname) {
            return res.status(403).json({ message: '게시글 작성자만 수정할 수 있습니다.' });
        }

        const updatedPost = await updatePost(postId, { title, content });
        res.status(200).json(updatedPost);
    } catch (error) {
        res.status(500).json({ message: '게시글 수정에 실패했습니다.', error });
    }
});

// 게시글 좋아요/싫어요 처리
router.put('/:id/like', authenticateJWT, async (req, res) => {
    const postId = req.params.id;
    const { action } = req.body; // 'like' 또는 'dislike'

    if (!ObjectId.isValid(postId)) {
        return res.status(400).json({ message: '잘못된 게시글 ID 형식입니다.' });
    }

    if (!['like', 'dislike'].includes(action)) {
        return res.status(400).json({ message: 'action 값은 "like" 또는 "dislike"여야 합니다.' });
    }

    if (!req.user || !req.user.userid) {
        return res.status(401).json({ message: '로그인이 필요합니다.' });
    }

    try {
        const success = await updatePostLikes(postId, req.user.userid, action);
        if (success) {
            res.status(200).json({ message: `게시글 ${action} 처리 완료` });
        } else {
            res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
        }
    } catch (error) {
        res.status(500).json({ message: `게시글 ${action} 처리 중 오류 발생`, error });
    }
});

module.exports = router;