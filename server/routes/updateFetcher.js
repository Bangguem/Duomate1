const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const {
  fetchUpdates,
  createUpdate,
  fetchUpdateById,
  updateUpdate,
  deleteUpdate
} = require('../db');
const { verifyToken } = require('../auth'); // JWT 검증 함수 추가

// ✅ 인증 & Admin 확인 미들웨어
function authenticateAdmin(req, res, next) {
  const token = req.cookies.auth_token;
  if (!token) {
    return res.status(401).json({ message: '로그인이 필요합니다.' });
  }

  const decoded = verifyToken(token);
  if (!decoded || decoded.userid !== 'Admin') {
    return res.status(403).json({ message: '관리자만 접근 가능합니다.' });
  }

  req.user = decoded; // 인증된 사용자 정보 저장
  next();
}

// ✅ GET / : 업데이트 목록 조회 (모두 접근 가능)
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

// ✅ POST / : 신규 업데이트 작성 (관리자만)
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const { title, content } = req.body;
    const date = new Date();
    const newUpdate = { title, content, date };
    const createdUpdate = await createUpdate(newUpdate);
    res.json(createdUpdate);
  } catch (error) {
    console.error('Error creating update:', error);
    res.status(500).json({ message: 'Error creating update' });
  }
});

// ✅ GET /:id : 업데이트 상세 조회 (모두 접근 가능)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const update = await fetchUpdateById(id);
    if (!update) {
      return res.status(404).json({ message: '업데이트를 찾을 수 없습니다.' });
    }
    res.json(update);
  } catch (error) {
    console.error('Error fetching update detail:', error);
    res.status(500).json({ message: '업데이트 상세 정보를 불러오는데 실패했습니다.' });
  }
});

// ✅ PUT /:id : 업데이트 수정 (관리자만)
router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: '잘못된 업데이트 ID 형식입니다.' });
    }
    if (!title || !content) {
      return res.status(400).json({ message: '제목과 내용은 필수입니다.' });
    }
    
    const existingUpdate = await fetchUpdateById(id);
    if (!existingUpdate) {
      return res.status(404).json({ message: '업데이트를 찾을 수 없습니다.' });
    }
    
    const updatedUpdate = await updateUpdate(id, { title, content });
    res.status(200).json(updatedUpdate);
  } catch (error) {
    console.error('Error updating update:', error);
    res.status(500).json({ message: '업데이트 수정에 실패했습니다.' });
  }
});

// ✅ DELETE /:id : 업데이트 삭제 (관리자만)
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const success = await deleteUpdate(id);
    if (!success) {
      return res.status(404).json({ message: '업데이트를 찾을 수 없습니다.' });
    }
    res.json({ message: '업데이트가 삭제되었습니다.' });
  } catch (error) {
    console.error('Error deleting update:', error);
    res.status(500).json({ message: '업데이트 삭제에 실패했습니다.' });
  }
});

module.exports = router;