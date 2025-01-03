<template>
  <div>
    <h1>게시판</h1>

    <!-- 게시글 작성 버튼 -->
    <button @click="goToWritePage" v-if="currentPage === 'board'">게시글 작성</button>

    <!-- 게시글 목록 -->
    <div v-if="currentPage === 'board'">
      <div v-if="loading">로딩 중...</div>
      <div v-else-if="error" class="error">게시글을 불러오는 데 실패했습니다.</div>
      <ul v-else-if="posts.length">
        <li v-for="post in posts" :key="post._id">
          <h2>{{ post.title }}</h2>
          <p>{{ post.content }}</p>
          <small>{{ post.author }} - {{ formatDate(post.createdAt) }}</small>
          <!-- 좋아요/싫어요 -->
          <div>
            <button
              @click="likePost(post._id)"
              :class="{ active: post.userActions?.[currentUser?.userid] === 'like' }"
            >
              좋아요 ({{ post.likes }})
            </button>
            <button
              @click="dislikePost(post._id)"
              :class="{ active: post.userActions?.[currentUser?.userid] === 'dislike' }"
            >
              싫어요 ({{ post.dislikes }})
            </button>
          </div>
          <!-- 수정 및 삭제 버튼 -->
          <div v-if="isAuthor(post)">
            <button @click="goToEditPage(post)">수정</button>
            <button @click="deletePost(post._id)">삭제</button>
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

    <!-- 게시글 수정 폼 -->
    <div v-if="currentPage === 'edit'">
      <h2>게시글 수정</h2>
      <form @submit.prevent="updatePost">
        <div>
          <label for="title">제목</label>
          <input v-model="title" type="text" id="title" required />
        </div>
        <div>
          <label for="content">내용</label>
          <textarea v-model="content" id="content" required></textarea>
        </div>
        <button type="submit">수정 완료</button>
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
      currentPage: 'board', // 현재 페이지 상태 ('board', 'write', 'edit')
      currentUser: null, // 현재 로그인한 사용자 정보
      editPostId: null // 수정 중인 게시글 ID
    };
  },
  created() {
    this.initData(); // 초기 데이터 로드
  },
  methods: {
    // 초기 데이터 로드
    async initData() {
      this.loading = true;
      this.error = false;
      try {
        await Promise.all([this.fetchPosts(), this.fetchCurrentUser()]);
      } catch (error) {
        console.error('초기 데이터를 가져오는 중 오류 발생:', error);
        this.error = true;
      } finally {
        this.loading = false;
      }
    },

    // 현재 로그인한 사용자 정보 가져오기
    async fetchCurrentUser() {
      try {
        const response = await axios.get('http://localhost:3000/auth/check-login', { withCredentials: true });
        if (response.data.loggedIn) {
          this.currentUser = response.data.user;
        }
      } catch (error) {
        console.error('현재 사용자 정보를 가져오는 데 실패했습니다:', error);
      }
    },

    // 게시글 목록 가져오기
    async fetchPosts() {
      try {
        const response = await axios.get('http://localhost:3000/api/board', { withCredentials: true });
        this.posts = response.data;
      } catch (error) {
        console.error('게시글을 가져오는 중 오류 발생:', error);
        this.error = true;
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

    // 게시글 삭제 요청
    async deletePost(postId) {
      try {
        await axios.delete(`http://localhost:3000/api/board/${postId}`, { withCredentials: true });
        this.initData();
      } catch (error) {
        console.error('게시글 삭제 중 오류 발생:', error);
      }
    },

    // 게시글 수정 요청
    async updatePost() {
      try {
        await axios.put(`http://localhost:3000/api/board/${this.editPostId}`, { title: this.title, content: this.content }, { withCredentials: true });
        this.goToBoardPage();
        this.initData();
      } catch (error) {
        console.error('게시글 수정 중 오류 발생:', error);
      }
    },

    // 좋아요 처리
    async likePost(postId) {
      if (!this.currentUser) {
        alert('로그인이 필요합니다.');
        return;
      }
      try {
        await axios.put(`http://localhost:3000/api/board/${postId}/like`, { action: 'like' }, { withCredentials: true });
        this.initData();
      } catch (error) {
        console.error('좋아요 처리 중 오류 발생:', error);
      }
    },

    // 싫어요 처리
    async dislikePost(postId) {
      if (!this.currentUser) {
        alert('로그인이 필요합니다.');
        return;
      }
      try {
        await axios.put(`http://localhost:3000/api/board/${postId}/like`, { action: 'dislike' }, { withCredentials: true });
        this.initData();
      } catch (error) {
        console.error('싫어요 처리 중 오류 발생:', error);
      }
    },

    // 페이지 이동 핸들러
    goToBoardPage() {
      this.currentPage = 'board';
      this.title = '';
      this.content = '';
    },
    goToWritePage() {
      this.currentPage = 'write';
    },
    goToEditPage(post) {
      this.editPostId = post._id;
      this.title = post.title;
      this.content = post.content;
      this.currentPage = 'edit';
    },

    // 현재 사용자가 게시글 작성자인지 확인
    isAuthor(post) {
      return this.currentUser?.nickname === post.author;
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
button.active {
  background-color: #007bff;
  color: white;
  font-weight: bold;
}
</style>