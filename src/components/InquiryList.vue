<template>
    <div class="inquiry-list">
      <h2>문의 목록</h2>

      <!-- ✅ 여기에 작성 버튼 추가 -->
      <button @click="goToForm" class="write-btn">문의 작성</button>

      <div v-if="inquiries.length === 0">문의 내역이 없습니다.</div>
  
      <ul>
        <li v-for="inquiry in inquiries" :key="inquiry._id" @click="goToDetail(inquiry._id)">
          <h3>{{ inquiry.title }}</h3>
          <p>작성자: {{ inquiry.name }}</p>
          <p>상태: {{ inquiry.status === 'answered' ? '답변완료' : '대기중' }}</p>
          <p>등록일: {{ formatDate(inquiry.createdAt) }}</p>
        </li>
      </ul>
    </div>
  </template>
  
  <script>
  import axios from 'axios';
  
  export default {
    name: 'InquiryList',
    data() {
      return {
        inquiries: [],
      };
    },
    async created() {
      await this.fetchInquiries();
    },
    methods: {
      async fetchInquiries() {
        try {
          const res = await axios.get('http://localhost:3000/api/inquiries', {
            withCredentials: true,
          });
          this.inquiries = res.data.inquiries;
        } catch (error) {
          console.error('문의 목록 불러오기 실패:', error);
        }
      },
      goToForm() {
        this.$router.push('/inquiries/new'); // ✅ 문의 작성 페이지로 이동
      },
      goToDetail(id) {
        this.$router.push(`/inquiries/${id}`);
      },
      formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
      },
    },
  };
  </script>
  
  <style scoped>
  .inquiry-list {
    max-width: 700px;
    margin: 0 auto;
  }
  ul {
    list-style: none;
    padding: 0;
  }
  li {
    padding: 1rem;
    border-bottom: 1px solid #ccc;
    cursor: pointer;
  }
  li:hover {
    background-color: #f5f5f5;
  }
  </style>