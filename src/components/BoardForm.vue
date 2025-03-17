<template>
  <div class="contents">
    <!-- [1] 게시글 목록(검색/정렬/작성 버튼 포함) 영역 -->
    <section class="contents-header" v-if="currentPage === 'board'">
      <div class="header-left">
        <!-- 정렬 방식 선택 -->
        <div class="select-wrapper">
          <select id="sort" v-model="sortOrder" @change="sortPosts" class="filter-dropdown">
            <option value="latest">최신순</option>
            <option value="oldest">오래된순</option>
            <option value="likes">좋아요순</option>
            <option value="views">조회수순</option>
          </select>
        </div>

        <!-- 검색 조건 선택 -->
        <div class="select-wrapper">
          <select v-model="searchType" class="filter-dropdown">
            <option value="title">제목</option>
            <option value="content">내용</option>
            <option value="author">등록자명</option>
          </select>
        </div>

        <!-- 검색 초기화 버튼 -->
        <button @click="resetSearch" class="reset-button">초기화</button>
      </div>

      <div class="header-right">
        <!-- 검색 박스 -->
        <div class="search-box">
          <input
            v-model="searchQuery"
            @keyup.enter="filterPosts"
            type="text"
            placeholder="검색어를 입력하세요"
            class="search-input"
          />
          <span class="search-icon" @click="filterPosts">🔍</span>
        </div>
      </div>
    </section>

    <!-- 게시글 작성 이동 버튼 -->
    <div class="write-button-container" v-if="currentPage === 'board'">
      <button @click="goToWritePage" class="write-button">게시글 작성</button>
    </div>

    <!-- 게시글 목록 -->
    <div v-if="currentPage === 'board'" class="feed-container">
      <!-- 로딩/에러/게시글 목록 상태 표시 -->
      <div v-if="loading" class="loading">로딩 중...</div>
      <div v-else-if="error" class="error">게시글을 불러오는 데 실패했습니다.</div>
      
      <div v-else-if="sortedPosts.length" class="feed-list">
        <div
          v-for="post in sortedPosts"
          :key="post._id"
          class="feed-card"
        >
          <div class="feed-header">
            <strong>{{ post.author || '작성자 없음' }}</strong>
            <div>{{ formatDate(post.createdAt) }}</div>
          </div>
          <h2 class="feed-title" @click="goToDetailPage(post._id)">{{ post.title }}</h2>
          <p class="feed-content" v-html="convertNewLinesToBreaks(post.content)"></p>

          <div class="feed-actions">
            <span>👍 {{ post.likes || 0 }}</span>
            <span style="margin-left: 10px;">👎 {{ post.dislikes || 0 }}</span>
            <span class="view-count" style="margin-left: 10px;">조회수: {{ post.views || 0 }}</span>
          </div>
        </div>
      </div>
      
      <div v-else class="no-posts">게시글이 없습니다.</div>
    </div>

    <!-- 게시글 작성 폼 -->
    <div v-if="currentPage === 'write'" class="post-form">
      <h2 class="post-title">게시글 작성</h2>
      <form @submit.prevent="submitPost">
        <input
          v-model="title"
          type="text"
          placeholder="제목을 입력하세요"
          class="post-input"
          required
        />
        <textarea
          v-model="content"
          placeholder="내용을 입력하세요"
          class="post-textarea"
          required
        ></textarea>
        
        <div class="post-buttons">
          <button type="submit" class="post-submit">게시글 작성</button>
          <button type="button" @click="goToBoardPage" class="post-cancel">취소</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      posts: [],          // 게시글 목록
      filteredPosts: [],  // 필터링된 게시글 목록
      loading: true,      // 로딩 상태
      error: false,       // 오류 상태
      title: '',          // 게시글 제목
      content: '',        // 게시글 내용
      currentPage: 'board',   // 현재 페이지 상태 ('board', 'write')
      currentUser: null,      // 현재 로그인한 사용자 정보
      sortOrder: 'latest',    // 정렬 기준
      searchQuery: '',        // 검색어
      searchType: 'title',    // 검색 항목 (제목, 내용, 등록자명)
    };
  },
  computed: {
    // 검색된 게시글 목록을 기준으로 정렬된 게시글을 반환
    sortedPosts() {
      return [...this.filteredPosts].sort((a, b) => {
        if (this.sortOrder === 'latest') {
          return new Date(b.createdAt) - new Date(a.createdAt); // 최신순
        } else if (this.sortOrder === 'oldest') {
          return new Date(a.createdAt) - new Date(b.createdAt); // 오래된순
        } else if (this.sortOrder === 'likes') {
          return (b.likes || 0) - (a.likes || 0);               // 좋아요순
        } else if (this.sortOrder === 'views') {
          return (b.views || 0) - (a.views || 0);               // 조회수순
        }
      });
    }
  },
  created() {
    this.initData();        // 초기 데이터 로드
    this.checkLoginStatus(); // 로그인 상태 확인
  },
  methods: {
    // 로그인 상태 확인
    async checkLoginStatus() {
      try {
        const response = await axios.get('http://localhost:3000/auth/check-login', {
          withCredentials: true
        });
        this.currentUser = response.data.user || null; // 로그인 사용자 정보
      } catch (error) {
        console.error('로그인 상태 확인 중 오류 발생:', error);
        this.currentUser = null; // 로그아웃 상태
      }
    },

    // 초기 데이터 로드
    async initData() {
      this.loading = true;
      this.error = false;
      try {
        await this.fetchPosts();
      } catch (error) {
        console.error('초기 데이터를 가져오는 중 오류 발생:', error);
        this.error = true;
      } finally {
        this.loading = false;
      }
    },

    // 게시글 목록 가져오기
    async fetchPosts() {
      try {
        const response = await axios.get('http://localhost:3000/api/board', {
          withCredentials: true
        });
        this.posts = response.data;
        this.filteredPosts = [...this.posts];
      } catch (error) {
        console.error('게시글을 가져오는 중 오류 발생:', error);
        this.error = true;
      }
    },

    // 게시글 검색
    filterPosts() {
      if (this.searchQuery.trim()) {
        // 제목 검색
        if (this.searchType === 'title') {
          this.filteredPosts = this.posts.filter(post =>
            post.title.toLowerCase().includes(this.searchQuery.toLowerCase())
          );
        }
        // 내용 검색
        else if (this.searchType === 'content') {
          this.filteredPosts = this.posts.filter(post =>
            post.content.toLowerCase().includes(this.searchQuery.toLowerCase())
          );
        }
        // 등록자명 검색
        else if (this.searchType === 'author') {
          this.filteredPosts = this.posts.filter(post =>
            (post.author || '').toLowerCase().includes(this.searchQuery.toLowerCase())
          );
        }
      } else {
        this.filteredPosts = [...this.posts]; // 검색어 없으면 원본 전체
      }
    },

    // 게시글 작성
    async submitPost() {
      try {
        await axios.post('http://localhost:3000/api/board',
          {
            title: this.title,
            content: this.content
          },
          { withCredentials: true }
        );
        // 작성 후 게시판 페이지로 이동 + 다시 데이터 불러오기
        this.goToBoardPage();
        this.initData();
      } catch (error) {
        console.error('게시글 작성 중 오류 발생:', error);
      }
    },

    // 페이지 이동
    goToBoardPage() {
      this.currentPage = 'board';
      this.title = '';
      this.content = '';
    },
    goToWritePage() {
      if (!this.currentUser) {
        alert('로그인이 필요합니다.');
        return;
      }
      this.currentPage = 'write';
    },
    goToDetailPage(postId) {
      this.$router.push({ name: 'BoardDetail', params: { id: postId } });
    },

    // 날짜 형식 변경
    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },

    // 검색 초기화
    resetSearch() {
      this.searchQuery = '';
      this.filteredPosts = [...this.posts];
    },

    // 개행 문자 -> <br> 변환
    convertNewLinesToBreaks(text) {
      return text.replace(/\n/g, '<br>');
    }
  }
};
</script>

<style scoped>
/* 메인 컨테이너 */
.contents {
  width: 100%;
  max-width: 1260px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px 50px;
  border-radius: 0.5rem;
}

/* 상단 검색/필터 영역 */
.contents-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #424242;
  padding: 15px;
  border-radius: 10px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-dropdown {
  background-color: #333;
  color: white;
  padding: 8px 32px 8px 12px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  position: relative;
  outline: none;
}

.select-wrapper {
  position: relative;
  display: inline-block;
}

.select-wrapper::after {
  content: '▼';
  color: gray;
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

/* 검색 초기화 버튼 */
.reset-button {
  color: #42b983;
  background: none;
  padding: 8px 8px;
  border: none;
  border-radius: 1.5rem;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s, color 0.2s;
}

@media (hover: hover) {
  .reset-button:hover {
    background-color: hsla(160, 100%, 37%, 0.2);
  }
}

/* 검색 박스 */
.search-box {
  display: flex;
  align-items: center;
  background-color: black;
  border-radius: 20px;
  padding: 5px 10px;
}

.search-input {
  background: none;
  border: none;
  color: white;
  outline: none;
}

.search-icon {
  color: gray;
  cursor: pointer;
}

/* 게시글 작성 버튼 컨테이너 */
.write-button-container {
  display: flex;
  justify-content: center;
  position: relative;
}

.write-button {
  width: 100px;
  height: 30px;
  border-radius: 20px;
  background-color: transparent;
  color: white;
  border: 1px solid #42b983;
  cursor: pointer;
  font-weight: bold;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s, transform 0.2s;
}

.write-button:hover {
  background-color: #36a372;
  transform: scale(1.1);
}

/* 게시글 목록 */
.feed-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.feed-list {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 600px;
  gap: 30px;
}

.feed-card {
  background: #333;
  border-radius: 12px;
  padding: 15px;
  color: white;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: transform 0.2s;
}

.feed-card:hover {
  transform: translateY(-3px);
}

.feed-header {
  font-size: 12px;
  color: gray;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.feed-title {
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  margin: 0;
}

.feed-content {
  font-size: 14px;
  color: lightgray;
  margin: 0;
}

.feed-actions {
  display: flex;
  align-items: center;
  padding-top: 10px;
  gap: 10px;
}

.view-count {
  font-size: 12px;
  color: lightgray;
}

/* 게시글 작성 폼 */
.post-form {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #333;
  padding: 20px;
  border-radius: 12px;
  max-width: 500px;
  width: 100%;
  margin: 0 auto;
}

.post-title {
  font-size: 20px;
  color: white;
}

.post-input,
.post-textarea {
  width: 100%;
  padding: 10px;
  margin: 10px 0;
  border-radius: 8px;
  border: none;
  background: #222;
  color: white;
  font-size: 14px;
}

.post-textarea {
  min-height: 100px;
}

.post-buttons {
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.post-submit,
.post-cancel {
  padding: 10px;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  border: none;
}

.post-submit {
  background-color: #42b983;
}

.post-cancel {
  background-color: gray;
}

/* 에러 표시 */
.error {
  color: red;
}

/* 공통 버튼 여백 */
button {
  margin: 5px;
}
</style>