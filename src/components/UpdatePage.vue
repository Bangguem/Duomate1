<template>
  <div class="contents">
    <!-- 목록 및 상단 필터 영역 (목록 모드일 때) -->
    <section class="contents-header" v-if="currentPage === 'list'">
      <div class="header-left">
        <button @click="sortUpdates('latest')" class="filter-button">최신순</button>
        <button @click="sortUpdates('oldest')" class="filter-button">오래된순</button>
      </div>
      <div class="header-right">
        <div class="search-box">
          <input v-model="searchQuery" type="text" placeholder="검색" class="search-input">
          <span class="search-icon" @click="filterUpdates">🔍</span>
        </div>
      </div>
    </section>

    <!-- 업데이트 작성 이동 버튼 (목록 모드일 때) -->
    <div class="write-button-container" v-if="currentPage === 'list'">
      <button @click="goToWritePage" class="write-button">업데이트 작성</button>
    </div>

    <!-- 업데이트 목록 영역 (목록 모드) -->
    <div v-if="currentPage === 'list'" class="feed-container">
      <div v-if="loading" class="loading">로딩 중...</div>
      <div v-else-if="error" class="error">업데이트를 불러오는 데 실패했습니다.</div>
      <div v-else-if="filteredUpdates.length" class="feed-list">
        <div
          v-for="update in filteredUpdates"
          :key="update._id"
          class="feed-card"
        >
          <div class="feed-header">
            <strong>{{ update.title }}</strong>
            <div>{{ formatDate(update.date) }}</div>
          </div>
          <p class="feed-content" v-html="convertNewLinesToBreaks(update.content)"></p>
        </div>
      </div>
      <div v-else class="no-updates">업데이트가 없습니다.</div>
    </div>

    <!-- 업데이트 작성 폼 (작성 모드) -->
    <div v-if="currentPage === 'write'" class="update-form">
      <h2>업데이트 작성</h2>
      <form @submit.prevent="submitUpdate">
        <input v-model="title" type="text" placeholder="제목 입력" required />
        <textarea v-model="content" placeholder="업데이트 내용 입력" required></textarea>
        <div class="form-buttons">
          <button type="submit" class="submit-button">작성</button>
          <button type="button" @click="goToListPage" class="cancel-button">취소</button>
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
      updates: [],        // 업데이트 목록
      loading: false,     // 로딩 상태
      error: false,       // 오류 발생 여부
      currentPage: 'list',// 'list' (목록 모드) 또는 'write' (작성 모드)
      sortOrder: 'latest',// 정렬 기준 (latest 또는 oldest)
      searchQuery: '',    // 검색어
      // 업데이트 작성 폼 데이터 (제목과 내용)
      title: '',
      content: ''
    };
  },
  computed: {
    filteredUpdates() {
      if (!this.searchQuery.trim()) return this.updates;
      return this.updates.filter(update => {
        return (
          (update.title && update.title.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
          (update.content && update.content.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
          (update.date && update.date.toString().includes(this.searchQuery))
        );
      });
    }
  },
  created() {
    this.fetchUpdates();
  },
  methods: {
    async fetchUpdates() {
      this.loading = true;
      this.error = false;
      try {
        const response = await axios.get(`http://localhost:3000/api/updates?sort=${this.sortOrder}`);
        this.updates = response.data;
      } catch (err) {
        console.error('업데이트를 가져오는 중 오류:', err);
        this.error = true;
      } finally {
        this.loading = false;
      }
    },
    sortUpdates(order) {
      this.sortOrder = order;
      this.fetchUpdates();
    },
    filterUpdates() {
      // 검색어는 computed(filteredUpdates)에서 처리합니다.
    },
    async submitUpdate() {
      try {
        await axios.post('http://localhost:3000/api/updates', {
          title: this.title,
          content: this.content
        });
        // 작성 후 폼 초기화, 목록 새로고침, 목록 모드 전환
        this.title = '';
        this.content = '';
        this.fetchUpdates();
        this.currentPage = 'list';
      } catch (err) {
        console.error('업데이트 작성 중 오류:', err);
      }
    },
    goToWritePage() {
      this.currentPage = 'write';
    },
    goToListPage() {
      this.currentPage = 'list';
    },
    convertNewLinesToBreaks(text) {
      return text ? text.replace(/\n/g, '<br>') : text;
    },
    formatDate(date) {
      // Date 객체 또는 ISO 문자열을 읽기 쉬운 형식으로 변환
      return new Date(date).toLocaleDateString();
    }
  }
};
</script>

<style scoped>
.contents {
  width: 100%;
  max-width: 1260px;
  margin: 0 auto;
  padding: 20px 50px;
}

/* 상단 필터 영역 */
.contents-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #424242;
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 10px;
}
.header-left, .header-right {
  display: flex;
  align-items: center;
}
.filter-button {
  background-color: #333;
  color: white;
  padding: 8px 12px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin-right: 10px;
}
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

/* 작성 버튼 */
.write-button-container {
  text-align: center;
  margin-bottom: 10px;
}
.write-button {
  background-color: transparent;
  border: 1px solid #42b983;
  color: white;
  padding: 10px 20px;
  border-radius: 20px;
  cursor: pointer;
}

/* 업데이트 목록 */
.feed-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}
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
}
.feed-header {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  margin-bottom: 10px;
}
.feed-content {
  font-size: 16px;
}
.no-updates {
  color: white;
  text-align: center;
}
.loading, .error {
  color: white;
  text-align: center;
}

/* 업데이트 작성 폼 */
.update-form {
  background-color: #424242;
  padding: 20px;
  border-radius: 12px;
  max-width: 500px;
  margin: 0 auto;
}
.update-form h2 {
  color: white;
  margin-bottom: 15px;
}
.update-form input,
.update-form textarea {
  width: 100%;
  padding: 10px;
  margin-bottom: 10px;
  border-radius: 8px;
  border: none;
  background-color: #222;
  color: white;
}
.form-buttons {
  display: flex;
  justify-content: space-between;
}
.submit-button {
  background-color: #42b983;
  border: none;
  padding: 10px 20px;
  color: white;
  border-radius: 8px;
  cursor: pointer;
}
.cancel-button {
  background-color: gray;
  border: none;
  padding: 10px 20px;
  color: white;
  border-radius: 8px;
  cursor: pointer;
}
</style>