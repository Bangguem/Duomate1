<template>
    <div>
      <h1>게시판</h1>
  
      <!-- 게시글 작성 버튼 -->
      <button @click="goToWritePage">게시글 작성</button>
  
      <!-- 게시글 목록 -->
      <div v-if="currentPage === 'board'">
        <div v-if="loading">로딩 중...</div>
        <div v-if="error" class="error">게시글을 불러오는 데 실패했습니다.</div>
        <ul v-if="posts.length">
          <li v-for="post in posts" :key="post._id">
            <h2>{{ post.title }}</h2>
            <p>{{ post.content }}</p>
            <small>{{ post.author }} - {{ post.createdAt }}</small>
          </li>
        </ul>
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
          <div>
            <label for="author">작성자</label>
            <input v-model="author" type="text" id="author" required />
          </div>
          <button type="submit">게시글 작성</button>
        </form>
      </div>
    </div>
  </template>
  
  <script>
  import axios from 'axios';
  
  export default {
    data() {
      return {
        posts: [],    // 게시글 목록
        loading: true, // 로딩 상태
        error: false,  // 오류 상태
        title: '',
        content: '',
        author: '',
        currentPage: 'board'  // 현재 페이지 상태: 'board' 또는 'write'
      };
    },
    created() {
      this.fetchPosts(); // 페이지가 생성될 때 게시글을 가져옵니다.
    },
    methods: {
      // 게시글 목록 가져오기
      async fetchPosts() {
        try {
          const response = await axios.get('http://localhost:3000/api/board');
          this.posts = response.data; // 서버에서 받은 데이터로 posts 배열을 채웁니다.
        } catch (error) {
          console.error('게시글을 가져오는 중 오류 발생:', error);
          this.error = true;
        } finally {
          this.loading = false; // 로딩 끝
        }
      },
  
      // 게시글 작성 후 서버로 전송
      async submitPost() {
        const postData = {
          title: this.title,
          content: this.content,
          author: this.author,
          createdAt: new Date().toISOString() // 현재 날짜
        };
  
        try {
          await axios.post('http://localhost:3000/api/board', postData); // 서버로 POST 요청
          this.currentPage = 'board'; // 게시글 작성 후 목록 페이지로 돌아가기
          this.fetchPosts(); // 목록 갱신
        } catch (error) {
          console.error('게시글 작성 중 오류 발생:', error);
        }
      },
  
      // 게시글 작성 페이지로 이동
      goToWritePage() {
        this.currentPage = 'write'; // 'write' 페이지로 전환
      }
    }
  };
  </script>
  
  <style scoped>
  .error {
    color: red;
  }
  </style>