const express = require('express');
const router = express.Router();
const { createPost, fetchPosts, deletePost } = require('../db');  // db.js에서 함수 가져오기

// 게시글 목록 조회
router.get('/', async (req, res) => {
    try {
        const posts = await fetchPosts();  // 모든 게시글 가져오기
        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch posts', error });
    }
});

// 게시글 작성
router.post('/', async (req, res) => {
    const { title, content, author } = req.body;

    if (!title || !content || !author) {
        return res.status(400).json({ message: 'Title, content, and author are required' });
    }

    try {
        const post = await createPost({ title, content, author });
        res.status(201).json(post);
    } catch (error) {
        res.status(500).json({ message: 'Failed to create post', error });
    }
});

// 게시글 삭제
router.delete('/:id', async (req, res) => {
    const postId = req.params.id;

    try {
        const success = await deletePost(postId);
        if (success) {
            res.status(200).json({ message: 'Post deleted successfully' });
        } else {
            res.status(404).json({ message: 'Post not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete post', error });
    }
});

module.exports = router;