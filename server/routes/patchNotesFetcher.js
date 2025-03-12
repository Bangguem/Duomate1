const axios = require('axios');
const cheerio = require('cheerio');
const express = require('express');
const moment = require('moment-timezone'); // 타임존 처리를 위한 라이브러리 추가
const router = express.Router();

const ITEMS_PER_PAGE = 12;

// 특정 페이지의 __NEXT_DATA__에 있는 patch note 아이템들을 가져오는 함수
const fetchPageData = async (pageNumber) => {
  let pageUrl = 'https://www.leagueoflegends.com/ko-kr/news/tags/patch-notes/';
  if (pageNumber > 1) {
    pageUrl += `?page=${pageNumber}`;
  }
  const { data } = await axios.get(pageUrl);
  const $ = cheerio.load(data);
  const nextDataScript = $('#__NEXT_DATA__').html();
  if (!nextDataScript) throw new Error('__NEXT_DATA__ not found');
  const nextData = JSON.parse(nextDataScript);

  // blades 배열에서 articleCardGrid 타입의 데이터를 찾습니다.
  let items = [];
  const blades = nextData.props?.pageProps?.page?.blades || [];
  for (let blade of blades) {
    if (blade.type === 'articleCardGrid' && blade.items) {
      items = blade.items;
      break;
    }
  }
  return items;
};

// 중복 항목 제거 (URL과 제목을 결합하여 고유하게)
const deduplicateItems = (items) => {
  const seen = new Set();
  const unique = [];
  for (let item of items) {
    const url = item.action?.payload?.url || '';
    const title = item.title || '';
    const key = `${url}-${title}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(item);
    }
  }
  return unique;
};

const getPatchNotes = async (req, res) => {
  try {
    const skip = parseInt(req.query.skip, 10) || 0;
    const limit = parseInt(req.query.limit, 10) || ITEMS_PER_PAGE;

    // 두 페이지(최신 12개와 그 다음 12개)를 모두 가져와 결합합니다.
    const itemsPage1 = await fetchPageData(1);
    const itemsPage2 = await fetchPageData(2);

    // 두 페이지의 아이템을 결합하고 중복 제거
    const allItems = deduplicateItems([...itemsPage1, ...itemsPage2]);

    // allItems를 원하는 데이터 형식으로 가공
    const patchNotes = allItems.map(item => {
      let link = item.action?.payload?.url || '';
      if (link && link.startsWith('/')) {
        link = `https://www.leagueoflegends.com${link}`;
      }
      // publishedAt를 YYYY-MM-DD 형식으로 변환 (KST 기준)
      const date = item.publishedAt 
        ? moment(item.publishedAt).tz('Asia/Seoul').format('YYYY-MM-DD')
        : '';
      // description.body에서 HTML 태그 제거 (간단하게 텍스트만 추출)
      const review = item.description?.body 
        ? item.description.body.replace(/<[^>]*>?/gm, '').trim()
        : '';
      return { title: item.title || '', link, date, review };
    });

    // 클라이언트의 요청 파라미터(skip, limit)에 따라 페이징 처리
    const paginatedNotes = patchNotes.slice(skip, skip + limit);
    res.json(paginatedNotes);
  } catch (error) {
    console.error('Error fetching patch notes:', error);
    res.status(500).json({ message: 'Error fetching patch notes' });
  }
};

router.get('/patch-notes', getPatchNotes);

module.exports = router;