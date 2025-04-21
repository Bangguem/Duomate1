const axios = require('axios');
const cheerio = require('cheerio');
const express = require('express');
const moment = require('moment-timezone'); // 타임존 처리를 위한 라이브러리 추가
// 추가: http, https 모듈 불러오기 (Keep-Alive 설정용)
const http = require('http');
const https = require('https');
const router = express.Router();

const ITEMS_PER_PAGE = 12;

// 추가: 캐시 관련 변수 (5분 동안 캐시 유지)
const CACHE_TTL = 5 * 60 * 1000; // 5분 (밀리초)
const cache = new Map();

// 추가: Keep-Alive 설정을 적용한 axios 인스턴스 생성
const axiosInstance = axios.create({
  httpAgent: new http.Agent({ keepAlive: true }),
  httpsAgent: new https.Agent({ keepAlive: true })
});

// 특정 페이지의 __NEXT_DATA__에 있는 patch note 아이템들을 가져오는 함수
const fetchPageData = async (pageNumber) => {
  const cacheKey = `pageData-${pageNumber}`;
  const cached = cache.get(cacheKey);
  if (cached && (Date.now() - cached.time < CACHE_TTL)) {
    return cached.data;
  }
  let pageUrl = 'https://www.leagueoflegends.com/ko-kr/news/tags/patch-notes/';
  if (pageNumber > 1) {
    pageUrl += `?page=${pageNumber}`;
  }
  const { data } = await axiosInstance.get(pageUrl);
  const $ = cheerio.load(data);
  const nextDataScript = $('#__NEXT_DATA__').html();
  if (!nextDataScript) throw new Error('__NEXT_DATA__ not found');
  const nextData = JSON.parse(nextDataScript);

  let items = [];
  const blades = nextData.props?.pageProps?.page?.blades || [];
  for (let blade of blades) {
    if (blade.type === 'articleCardGrid' && blade.items) {
      items = blade.items;
      break;
    }
  }
  cache.set(cacheKey, { data: items, time: Date.now() });
  return items;
};

// 중복 항목 제거
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
    const searchQuery = req.query.searchQuery ? req.query.searchQuery.toLowerCase() : '';

    // 최신 2페이지의 데이터를 가져옴
    const [itemsPage1, itemsPage2] = await Promise.all([
      fetchPageData(1),  // 페이지 1 데이터 요청
      fetchPageData(2)   // 페이지 2 데이터 요청
    ]);
    const allItems = deduplicateItems([...itemsPage1, ...itemsPage2]);

    // 데이터를 가공
    const patchNotes = allItems.map(item => {
      let link = item.action?.payload?.url || '';
      if (link && link.startsWith('/')) {
        link = `https://www.leagueoflegends.com${link}`;
      }
      const date = item.publishedAt 
        ? moment(item.publishedAt).tz('Asia/Seoul').format('YYYY-MM-DD')
        : '';
      const review = item.description?.body 
        ? item.description.body.replace(/<[^>]*>?/gm, '').trim()
        : '';
      return { title: item.title || '', link, date, review };
    });

    // 검색 기능 추가
    let filteredNotes = patchNotes;
    if (searchQuery) {
      filteredNotes = patchNotes.filter(patch => 
        patch.title.toLowerCase().includes(searchQuery) ||
        patch.review.toLowerCase().includes(searchQuery)
      );
    }

    // 페이징 처리
    const paginatedNotes = filteredNotes.slice(skip, skip + limit);
    res.json(paginatedNotes);
  } catch (error) {
    console.error('Error fetching patch notes:', error);
    res.status(500).json({ message: 'Error fetching patch notes' });
  }
};

router.get('/patch-notes', getPatchNotes);

module.exports = router;