<template>
  <div class="inquiry-form">
    <h2>문의 등록</h2>
    <form @submit.prevent="submitInquiry">
      <div>
        <label for="title">제목</label>
        <input v-model="title" id="title" required />
      </div>
      <div>
        <label for="content">내용</label>
        <textarea v-model="content" id="content" rows="6" required></textarea>
      </div>
      <button type="submit">등록</button>
    </form>

    <p v-if="message">{{ message }}</p>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'InquiryForm',
  data() {
    return {
      title: '',
      content: '',
      message: '',
    };
  },
  methods: {
    async submitInquiry() {
      try {
        await axios.post(
          `${process.env.VUE_APP_API_URL}/api/inquiries`,
          {
            title: this.title,
            content: this.content,
          },
          { withCredentials: true }
        );
        this.message = '문의가 성공적으로 등록되었습니다!';
        this.title = '';
        this.content = '';
        this.$router.push('/inquiries');
      } catch (error) {
        console.error('문의 등록 실패:', error);
        this.message = '문의 등록 중 오류가 발생했습니다.';
      }
    },
  },
};
</script>

<style scoped>
.inquiry-form {
  max-width: 600px;
  margin: 0 auto;
}

label {
  display: block;
  margin-top: 1rem;
}

input,
textarea {
  width: 100%;
  padding: 0.5rem;
  margin-top: 0.25rem;
}

button {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
}
</style>