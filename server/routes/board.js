// routes/board.js
const express = require('express');
const { verifyToken } = require('../auth'); // auth.js에서 함수 가져오기
const router = express.Router();
const { createPost, fetchPosts, deletePost, getPostById, fetchUser, updatePost, 
        updatePostLikes,addComment, getComments, deleteComment, updateComment,
        deleteCommentsByPostId, updateCommentLikes, incrementPostViews} = require('../db');
const { ObjectId } = require('mongodb');
require('dotenv').config();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 업로드 폴더 설정
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../../public/uploads'));
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + decodeURIComponent(file.originalname);
      cb(null, uniqueSuffix);
    }
});
const upload = multer({ storage });


// 공통 에러 처리 함수
function handleError(res, status, message) {
    return res.status(status).json({ message });
}

// JWT 인증 미들웨어 (auth.js의 verifyToken 활용)
async function authenticateJWT(req, res, next) {
    const token = req.cookies.auth_token;

    if (!token) {
        req.user = null;
        return handleError(res, 401, '로그인이 필요합니다.');
    }

    const decoded = verifyToken(token);

    if (!decoded) {
        res.clearCookie('auth_token'); // 유효하지 않은 토큰일 경우 쿠키 삭제
        return handleError(res, 401, '세션이 만료되었거나 유효하지 않은 토큰입니다.');
    }

    try {
        const user = await fetchUser(decoded.userid);

        if (!user) {
            req.user = null;
            return handleError(res, 401, '사용자를 찾을 수 없습니다.');
        }

        req.user = { userid: user.userid, nickname: user.nickname };
        next();
    } catch (error) {
        console.error('Error fetching user:', error);
        req.user = null;
        res.clearCookie('auth_token'); // 쿠키 삭제
        return handleError(res, 500, '서버 오류가 발생했습니다.');
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
router.post('/', authenticateJWT, upload.single('image'), async (req, res) => {
    const { title, content } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
  
    if (!title || !content) {
      return res.status(400).json({ message: '제목과 내용은 필수입니다.' });
    }
  
    if (!req.user || !req.user.nickname) {
      return res.status(401).json({ message: '인증되지 않은 사용자입니다.' });
    }
  
    const author = req.user.nickname;
  
    try {
      const post = await createPost({ title, content, author, imageUrl }); // imageUrl도 저장
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

        // ✅ 이미지 파일 삭제 처리
        if (post.imageUrl) {
            try {
                const imagePath = path.join(__dirname, '../../public', post.imageUrl);
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                    console.log('✅ 이미지 삭제 완료:', imagePath);
                } else {
                    console.warn('⚠️ 이미지 파일이 존재하지 않음:', imagePath);
                }
            } catch (err) {
                console.error('❌ 이미지 삭제 중 오류:', err.message);
            }
        }
        
        // 게시글 삭제
        const postDeleted = await deletePost(postId, req.user.nickname);
        if (postDeleted) {
            // 댓글 삭제
            const deletedCommentsCount = await deleteCommentsByPostId(postId);

            return res.status(200).json({
                message: '게시글 및 관련 댓글이 성공적으로 삭제되었습니다.',
                deletedComments: deletedCommentsCount, // 삭제된 댓글 수 반환
            });
        } else {
            return res.status(404).json({ message: '삭제할 게시글을 찾을 수 없습니다.' });
        }
    } catch (error) {
        console.error('게시글 삭제 중 오류 발생:', error);
        return res.status(500).json({ message: '게시글 삭제에 실패했습니다.', error });
    }
});

router.put('/:id', authenticateJWT, upload.single('image'), async (req, res) => {
    const postId = req.params.id;
    const { title, content } = req.body;
    const newImageUrl = req.file ? `/uploads/${req.file.filename}` : null;
  
    if (!ObjectId.isValid(postId)) {
      return res.status(400).json({ message: '잘못된 게시글 ID 형식입니다.' });
    }
  
    if (!title || (!content && !newImageUrl)) {
      return res.status(400).json({ message: '제목은 필수이며, 내용 또는 이미지가 필요합니다.' });
    }
  
    try {
      const post = await getPostById(postId);
      if (!post) {
        return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
      }
  
      if (post.author !== req.user.nickname) {
        return res.status(403).json({ message: '게시글 작성자만 수정할 수 있습니다.' });
      }
  
      // 새 이미지가 첨부되었을 경우, 기존 이미지가 있다면 삭제
      if (newImageUrl && post.imageUrl) {
        try {
          const oldImagePath = path.join(__dirname, '../../public', post.imageUrl);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
            console.log('✅ 기존 이미지 삭제 완료:', oldImagePath);
          }
        } catch (err) {
          console.error('❌ 기존 이미지 삭제 중 오류:', err.message);
        }
      }
  
      // 업데이트할 데이터 구성
      const updateData = { title, content };
      if (newImageUrl) {
        updateData.imageUrl = newImageUrl;
      }
  
      const updatedPost = await updatePost(postId, updateData);
      res.status(200).json(updatedPost);
    } catch (error) {
      res.status(500).json({ message: '게시글 수정에 실패했습니다.', error });
    }
});

// 게시글 좋아요/싫어요 처리
router.put('/:id/like', authenticateJWT, async (req, res) => {
    const postId = req.params.id;
    const { action } = req.body;

    if (!['like', 'dislike'].includes(action)) {
        return res.status(400).json({ message: 'action 값은 "like" 또는 "dislike"여야 합니다.' });
    }

    try {
        const success = await updatePostLikes(postId, req.user.userid, action);
        if (success) {
            // 최신 좋아요/싫어요 수를 반환
            const post = await getPostById(postId);
            res.status(200).json({ likes: post.likes, dislikes: post.dislikes });
        } else {
            res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
        }
    } catch (error) {
        console.error('좋아요/싫어요 처리 중 오류 발생:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});


//게시글 상세 조회
router.get('/:id', async (req, res) => {
    const postId = req.params.id;

    if (!ObjectId.isValid(postId)) {
        return res.status(400).json({ message: '잘못된 게시글 ID 형식입니다.' });
    }

    try {
        //게시글 데이터 가져오기
        const post = await getPostById(postId); // 기존에 정의된 getPostById 함수 사용
        if (!post) {
            return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
        }

        res.status(200).json(post);
    } catch (error) {
        console.error('게시글 가져오기 중 오류 발생:', error);
        res.status(500).json({ message: '게시글을 가져오는 중 오류가 발생했습니다.' });
    }
});

//댓글 추가
router.post('/:id/comments', authenticateJWT, async (req, res) => {
    const postId = req.params.id;
    const { content } = req.body;

    if (!content) {
        return res.status(400).json({ message: '댓글 내용을 입력해주세요.' });
    }

    try {
        const newComment = await addComment(postId, {
            userId: req.user.userid,
            nickname: req.user.nickname,
            content
        });

        if (newComment) {
            res.status(201).json(newComment);
        } else {
            res.status(400).json({ message: '댓글 추가에 실패했습니다.' });
        }
    } catch (error) {
        console.error('댓글 추가 중 오류 발생:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

//댓글 조회
router.get('/:id/comments', async (req, res) => {
    const postId = req.params.id;

    try {
        const comments = await getComments(postId);
        res.status(200).json(comments);
    } catch (error) {
        console.error('댓글 조회 중 오류 발생:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

//댓글 삭제
router.delete('/comments/:commentId', authenticateJWT, async (req, res) => {
    const commentId = req.params.commentId;

    try {
        const success = await deleteComment(commentId, req.user.userid);
        if (success) {
            res.status(200).json({ message: '댓글이 성공적으로 삭제되었습니다.' });
        } else {
            res.status(403).json({ message: '댓글 삭제 권한이 없습니다.' });
        }
    } catch (error) {
        console.error('댓글 삭제 중 오류 발생:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

//댓글 수정
router.put('/comments/:commentId', authenticateJWT, async (req, res) => {
    const commentId = req.params.commentId;
    const { content } = req.body;

    if (!content) {
        return res.status(400).json({ message: '수정할 내용을 입력해주세요.' });
    }

    try {
        const success = await updateComment(commentId, req.user.userid, content);
        if (success) {
            res.status(200).json({ message: '댓글이 성공적으로 수정되었습니다.' });
        } else {
            res.status(403).json({ message: '댓글 수정 권한이 없습니다.' });
        }
    } catch (error) {
        console.error('댓글 수정 중 오류 발생:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 댓글 좋아요/싫어요 처리
router.put('/comments/:commentId/like', authenticateJWT, async (req, res) => {
    const commentId = req.params.commentId;
    const { action } = req.body; // 'like' 또는 'dislike'

    if (!ObjectId.isValid(commentId)) {
        return res.status(400).json({ message: '잘못된 댓글 ID 형식입니다.' });
    }

    if (!['like', 'dislike'].includes(action)) {
        return res.status(400).json({ message: 'action 값은 "like" 또는 "dislike"여야 합니다.' });
    }

    if (!req.user || !req.user.userid) {
        return res.status(401).json({ message: '로그인이 필요합니다.' });
    }

    try {
        const success = await updateCommentLikes(commentId, req.user.userid, action);
        if (success) {
            res.status(200).json({ message: `댓글 ${action} 처리 완료` });
        } else {
            res.status(404).json({ message: '댓글을 찾을 수 없습니다.' });
        }
    } catch (error) {
        console.error('댓글 좋아요/싫어요 처리 중 오류 발생:', error);
        res.status(500).json({ message: `댓글 ${action} 처리 중 오류 발생`, error });
    }
});

//게시글 조회수 증가
router.post('/:id/views', async (req, res) => {
    const postId = req.params.id;

    if (!ObjectId.isValid(postId)) {
        return res.status(400).json({ message: '잘못된 게시글 ID 형식입니다.' });
    }

    try {
        // 조회수 증가 함수 호출
        const success = await incrementPostViews(postId);

        if (success) {
            return res.status(200).json({ message: '조회수가 성공적으로 증가했습니다.' });
        } else {
            return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
        }
    } catch (error) {
        console.error('조회수 증가 처리 중 오류 발생:', error);
        return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

module.exports = router;