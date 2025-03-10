const axios = require('axios');
const cheerio = require('cheerio');
const express = require('express');
const router = express.Router();

// 롤 패치노트 크롤링 API
const getPatchNotes = async (req, res) => {
  try {
    const url = 'https://www.leagueoflegends.com/ko-kr/news/tags/patch-notes/';
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    
    const patchNotes = [];

    $('.sc-ce9b75fd-0.lmZfRs').each((index, element) => {
      if (patchNotes.length >= 12) return false; // 12개까지만 가져오기

      const title = $(element).text().trim();
      let link = $(element).closest('a').attr('href'); // 링크 가져오기
      let date = $(element).parent().find('time').attr('datetime'); // 날짜 가져오기

      if (link && link.startsWith('/')) {
        link = `https://www.leagueoflegends.com${link}`;
      }

      // 날짜 변환 (UTC -> KST)
      if (date) {
        const utcDate = new Date(date); // UTC 시간
        utcDate.setHours(utcDate.getHours() + 9); // KST로 변환
        date = utcDate.toISOString().split('T')[0]; // YYYY-MM-DD 형식으로 변환
      }

      patchNotes.push({
        title: title,
        link: link || '',
        date: date || '', // 날짜 없으면 빈 값 처리
      });
    });

    res.json(patchNotes);
  } catch (error) {
    console.error('Error fetching patch notes:', error);
    res.status(500).json({ message: 'Error fetching patch notes' });
  }
};

// GET 요청 처리
router.get('/patch-notes', getPatchNotes);

module.exports = router;