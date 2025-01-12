<template>
  <div>
    <h1>게시판</h1>

    <!-- 정렬 옵션 -->
    <div>
      <label for="sort">정렬:</label>
      <select id="sort" v-model="sortOrder" @change="sortPosts">
        <option value="latest">최신순</option>
        <option value="oldest">오래된순</option>
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
          <p>{{ post.content }}</p>
          <!-- 작성자와 날짜 표시 -->
          <small>{{ post.author || '작성자 없음' }} - {{ formatDate(post.createdAt) }}</small>
          <!-- 좋아요/싫어요 갯수 표시 -->
          <div>
            <span>👍 {{ post.likes || 0 }}</span> | <span>👎 {{ post.dislikes || 0 }}</span>
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
      loading: true, // 로딩 상태
      error: false, // 오류 상태
      title: '', // 게시글 제목
      content: '', // 게시글 내용
      currentPage: 'board', // 현재 페이지 상태 ('board', 'write')
      currentUser: null, // 현재 로그인한 사용자 정보
      sortOrder: 'latest', // 정렬 기준 ('latest' or 'oldest')
    };
  },
  computed: {
    sortedPosts() {
      return [...this.posts].sort((a, b) => {
        if (this.sortOrder === 'latest') {
          return new Date(b.createdAt) - new Date(a.createdAt); // 최신순
        } else {
          return new Date(a.createdAt) - new Date(b.createdAt); // 오래된순
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
        console.log('게시글 목록:', this.posts); // API에서 받은 데이터 확인
      } catch (error) {
        console.error('게시글을 가져오는 중 오류 발생:', error);
        this.error = true;
      }
    },
    sortPosts() {
      console.log(`정렬 기준이 ${this.sortOrder}로 변경되었습니다.`);
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
        // 로그아웃 상태
        alert('로그인이 필요합니다.'); // 메시지 띄우기
        return; // 종료
      }
      // 로그인 상태일 경우 작성 페이지로 이동
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
    }
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