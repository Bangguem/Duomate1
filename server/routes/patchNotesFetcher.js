const axios = require('axios');
const cheerio = require('cheerio');
const express = require('express');
const router = express.Router();

// 롤 패치노트 크롤링 API
const getPatchNotes = async (req, res) => {
  try {
    // 롤 패치노트 URL
    const url = 'https://www.leagueoflegends.com/ko-kr/news/tags/patch-notes/';
    
    // 해당 URL에서 HTML을 가져오기
    const { data } = await axios.get(url);
    
    // cheerio로 HTML 파싱
    const $ = cheerio.load(data);
    
    // 패치 노트 제목과 링크 추출
    const patchNotes = [];

    // 패치 노트 제목이 들어 있는 요소 선택자 확인
    $('.sc-ce9b75fd-0.lmZfRs').each((index, element) => {
      if (patchNotes.length >= 12) {
        return false; // 12개까지만 추가하고 종료
      }

      const title = $(element).text().trim();
      let link = $(element).closest('a').attr('href'); // 링크가 a 태그에 있을 수 있음

      // 상대 경로를 절대 경로로 변경
      if (link && link.startsWith('/')) {
        link = `https://www.leagueoflegends.com${link}`;
      }
      
      patchNotes.push({
        title: title,
        link: link || '', // link가 없으면 빈 문자열 처리
      });
    });
    
    // 패치 노트 응답
    res.json(patchNotes);
  } catch (error) {
    console.error('Error fetching patch notes:', error);
    res.status(500).json({ message: 'Error fetching patch notes' });
  }
};

// GET 요청 처리
router.get('/patch-notes', getPatchNotes);

module.exports = router;