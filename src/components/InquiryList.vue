<template>
  <div class="contents">
    <!-- 1:1 문의 섹션 (문의 목록) -->
    <section class="contents-item">
      <p class="section-title">1:1 문의</p>
      <button @click="goToForm" class="write-btn">문의 작성</button>
      <div v-if="inquiries.length === 0">문의 내역이 없습니다.</div>
      <div v-else class="feed-list">
        <div v-for="inquiry in inquiries" :key="inquiry._id" class="feed-card" @click="goToDetail(inquiry._id)">
          <h3>{{ inquiry.title }}</h3>
          <p>작성자: {{ inquiry.name }}</p>
          <p>상태: {{ inquiry.status === 'answered' ? '답변완료' : '대기중' }}</p>
          <p>등록일: {{ formatDate(inquiry.createdAt) }}</p>
        </div>
      </div>
    </section>
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
        const res = await axios.get(`${process.env.VUE_APP_API_URL}/api/inquiries`, {
          withCredentials: true,
        });
        this.inquiries = res.data.inquiries;
      } catch (error) {
        console.error('문의 목록 불러오기 실패:', error);
      }
    },
    goToForm() {
      this.$router.push('/inquiries/new');
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
.contents {
  width: 80%;
  max-width: 1260px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 40px 20px;
}

.contents-item {
  width: 60%;
  max-width: 800px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 20px;
  padding: 20px;
}

.section-title {
  font-size: 40px;
  font-weight: bold;
  color: black;
}

.write-btn {
  padding: 0.5rem 1rem;
  margin-bottom: 1rem;
  cursor: pointer;
}

/* 업데이트 페이지 디자인 요소 적용 */
.feed-list {
  width: 100%;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.feed-card {
  background-color: #333;
  padding: 15px;
  border-radius: 12px;
  color: white;
  cursor: pointer;
  transition: background-color 0.3s;
}

.feed-card:hover {
  background-color: #444;
}
</style>