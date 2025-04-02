<template>
    <div class="inquiry-detail" v-if="inquiry">
      <h2>{{ inquiry.title }}</h2>
      <p><strong>작성자:</strong> {{ inquiry.name }}</p>
      <p><strong>작성일:</strong> {{ formatDate(inquiry.createdAt) }}</p>
      <p><strong>내용:</strong></p>
      <p class="preserve-newlines">{{ inquiry.content }}</p>
  
      <div v-if="inquiry.answer">
        <hr />
        <h3>💬 관리자 답변</h3>
        <p class="preserve-newlines">{{ inquiry.answer }}</p>
      </div>
  
      <div v-else-if="isAdmin">
        <hr />
        <h3>🛠 답변 작성</h3>
        <textarea v-model="answer" rows="5" style="width: 100%;"></textarea>
        <button @click="submitAnswer">답변 등록</button>
      </div>
    </div>
  </template>
  
  <script>
  import axios from 'axios';
  
  export default {
    name: 'InquiryDetail',
    props: ['id'],
    data() {
      return {
        inquiry: null,
        answer: '',
        user: null,
      };
    },
    computed: {
      isAdmin() {
        return this.user && this.user.userid === 'Admin';
      },
    },
    async created() {
      await this.fetchUser();
      await this.fetchInquiry();
    },
    methods: {
      async fetchUser() {
        try {
          const res = await axios.get('http://localhost:3000/auth/check-login', {
            withCredentials: true,
          });
          this.user = res.data.user;
        } catch (error) {
          console.error('유저 정보 불러오기 실패:', error);
        }
      },
      async fetchInquiry() {
        try {
          const res = await axios.get(`http://localhost:3000/api/inquiries/${this.id}`, {
            withCredentials: true,
          });
          this.inquiry = res.data.inquiry;
        } catch (error) {
          console.error('문의 불러오기 실패:', error);
        }
      },
      async submitAnswer() {
        try {
          await axios.put(
            `http://localhost:3000/api/inquiries/${this.id}/answer`,
            { answer: this.answer },
            { withCredentials: true }
          );
          this.inquiry.answer = this.answer;
          this.inquiry.status = 'answered';
          this.answer = '';
          alert('답변이 등록되었습니다!');
        } catch (error) {
          console.error('답변 등록 실패:', error);
        }
      },
      formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
      },
    },
  };
  </script>
  
  <style scoped>
  .preserve-newlines {
    white-space: pre-wrap;
  }
  .inquiry-detail {
    max-width: 700px;
    margin: 0 auto;
  }
  textarea {
    margin-top: 0.5rem;
  }
  button {
    margin-top: 0.5rem;
    padding: 0.5rem 1rem;
  }
  </style>