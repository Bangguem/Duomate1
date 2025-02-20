<template>
  <div>
    <h1>게시판</h1>

    <!-- 검색 필터 (게시글 작성 페이지에서는 보이지 않도록) -->
    <div v-if="currentPage === 'board'">
      <label for="search">검색:</label>
      <input v-model="searchQuery" @keyup.enter="filterPosts" type="text" id="search" placeholder="검색어를 입력하세요" />
      
      <!-- 검색 조건 선택 -->
      <select v-model="searchType">
        <option value="title">제목</option>
        <option value="content">내용</option>
        <option value="author">등록자명</option>
      </select>

      <button @click="resetSearch">초기화</button> <!-- 초기화 버튼 추가 -->
    </div>

    <!-- 정렬 옵션 (게시글 작성 페이지에서는 보이지 않도록) -->
    <div v-if="currentPage === 'board'">
      <label for="sort">정렬:</label>
      <select id="sort" v-model="sortOrder" @change="sortPosts">
        <option value="latest">최신순</option>
        <option value="oldest">오래된순</option>
        <option value="likes">좋아요순</option>
        <option value="views">조회수순</option>
      </select>
    </div>

    <!-- 게시글 작성 버튼 -->
    <button @click="goToWritePage" v-if="currentPage === 'board'">게시글 작성</button>

    <!-- 게시글 목록 -->
    <div v-if="currentPage === 'board'">
      <div v-if="loading">로딩 중...</div>
      <div v-else-if="error" class="error">게시글을 불러오는 데 실패했습니다.</div>
      <ul v-else-if="sortedPosts.length">
        <li v-for="post in sortedPosts" :key="post._id">
          <h2 @click="goToDetailPage(post._id)">{{ post.title }}</h2>
          <p v-html="convertNewLinesToBreaks(post.content)"></p>
          <small>{{ post.author || '작성자 없음' }} - {{ formatDate(post.createdAt) }}</small>
          <div>
            <span>👍 {{ post.likes || 0 }}</span> | <span>👎 {{ post.dislikes || 0 }}</span>
          </div>
          <div>
            조회수 : {{ post.views || 0 }}
          </div>
        </li>
      </ul>
      <div v-else>
        게시글이 없습니다.
      </div>
    </div>

    <!-- 게시글 작성 폼 -->
    <div v-if="currentPage === 'write'">
      <h2>게시글 작성</h2>
      <form @submit.prevent="submitPost">
        <div>
          <label for="title">제목</label>
          <input v-model="title" type="text" id="title" required />
        </div>
        <div>
          <label for="content">내용</label>
          <textarea v-model="content" id="content" required></textarea>
        </div>
        <button type="submit">게시글 작성</button>
        <button type="button" @click="goToBoardPage">취소</button>
      </form>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      posts: [], // 게시글 목록
      filteredPosts: [], // 필터링된 게시글 목록
      loading: true, // 로딩 상태
      error: false, // 오류 상태
      title: '', // 게시글 제목
      content: '', // 게시글 내용
      currentPage: 'board', // 현재 페이지 상태 ('board', 'write')
      currentUser: null, // 현재 로그인한 사용자 정보
      sortOrder: 'latest', // 정렬 기준 ('latest' or 'oldest')
      searchQuery: '', // 검색어
      searchType: 'title', // 검색 항목 (제목, 내용, 등록자명)
    };
  },
  computed: {
    // 검색된 게시글 목록을 기준으로 정렬된 게시글을 반환하는 계산된 속성
    sortedPosts() {
      return [...this.filteredPosts].sort((a, b) => {
        if (this.sortOrder === 'latest') {
          return new Date(b.createdAt) - new Date(a.createdAt); // 최신순
        } else if (this.sortOrder === 'oldest') {
          return new Date(a.createdAt) - new Date(b.createdAt); // 오래된순
        } else if (this.sortOrder === 'likes') {
          return (b.likes || 0) - (a.likes || 0); // 좋아요순
        } else if (this.sortOrder === 'views') {
          return (b.views || 0) - (a.views || 0); // 조회수순
        }
      });
    }
  },
  created() {
    this.initData(); // 초기 데이터 로드
    this.checkLoginStatus(); // 로그인 상태 확인
  },
  methods: {
    // 로그인 상태 확인
    async checkLoginStatus() {
      try {
        const response = await axios.get('http://localhost:3000/auth/check-login', { withCredentials: true });
        this.currentUser = response.data.user || null; // 로그인한 사용자 정보 저장
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
        const response = await axios.get('http://localhost:3000/api/board', { withCredentials: true });
        this.posts = response.data;
        this.filteredPosts = [...this.posts]; // 처음에는 모든 게시글을 필터링된 게시글로 설정
      } catch (error) {
        console.error('게시글을 가져오는 중 오류 발생:', error);
        this.error = true;
      }
    },

    // 게시글을 검색어로 필터링
    filterPosts() {
      if (this.searchQuery.trim()) {
        if (this.searchType === 'title') {
          this.filteredPosts = this.posts.filter(post =>
            post.title.toLowerCase().includes(this.searchQuery.toLowerCase())
          );
        } else if (this.searchType === 'content') {
          this.filteredPosts = this.posts.filter(post =>
            post.content.toLowerCase().includes(this.searchQuery.toLowerCase())
          );
        } else if (this.searchType === 'author') {
          this.filteredPosts = this.posts.filter(post =>
            post.author.toLowerCase().includes(this.searchQuery.toLowerCase())
          );
        }
      } else {
        this.filteredPosts = [...this.posts]; // 검색어가 없으면 모든 게시글을 표시
      }
    },

    // 게시글 작성 요청
    async submitPost() {
      try {
        await axios.post('http://localhost:3000/api/board', { title: this.title, content: this.content }, { withCredentials: true });
        this.goToBoardPage();
        this.initData();
      } catch (error) {
        console.error('게시글 작성 중 오류 발생:', error);
      }
    },

    // 페이지 이동 핸들러
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

    // 초기화 버튼 클릭 시 검색어와 게시글 필터링 초기화
    resetSearch() {
      this.searchQuery = ''; // 검색어 초기화
      this.filteredPosts = [...this.posts]; // 모든 게시글 다시 표시
    },
    convertNewLinesToBreaks(text) {
      return text.replace(/\n/g, '<br>');
    },
  }
};
</script>

<style scoped>
.error {
  color: red;
}
button {
  margin: 5px;
}
</style>