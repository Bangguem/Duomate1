<template>
  <div class="contents">
    <!-- 목록 상단 필터 -->
    <section class="contents-header" v-if="currentPage === 'list'">
      <div class="header-left">
        <button @click="sortUpdates('latest')" class="filter-button">최신순</button>
        <button @click="sortUpdates('oldest')" class="filter-button">오래된순</button>
      </div>
      <div class="header-right">
        <div class="search-box">
          <input v-model="searchQuery" type="text" placeholder="검색" class="search-input" />
          <span class="search-icon" @click="filterUpdates">🔍</span>
        </div>
      </div>
    </section>

    <!-- ✅ 관리자일 때만 보이는 작성 버튼 -->
    <div class="write-button-container" v-if="currentPage === 'list' && isAdmin">
      <button @click="goToWritePage" class="write-button">업데이트 작성</button>
    </div>

    <!-- 업데이트 목록 -->
    <div v-if="currentPage === 'list'" class="feed-container">
      <div v-if="loading" class="loading">로딩 중...</div>
      <div v-else-if="error" class="error">업데이트를 불러오는 데 실패했습니다.</div>
      <div v-else-if="filteredUpdates.length" class="feed-list">
        <div v-for="update in filteredUpdates" :key="update._id" class="feed-card">
          <div class="feed-header">
            <img src="@/assets/icon_setting.png" alt="업데이트 아이콘" class="patch-icon" />
            <div class="patch-info">
              <router-link :to="{ name: 'UpdateDetail', params: { id: update._id } }" class="patch-title">
                {{ update.title }}
              </router-link>
              <p class="patch-date">{{ formatDate(update.date) }}</p>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="no-updates">업데이트가 없습니다.</div>
    </div>

    <!-- 업데이트 작성 폼 -->
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
      updates: [],
      loading: false,
      error: false,
      currentPage: 'list',
      sortOrder: 'latest',
      searchQuery: '',
      title: '',
      content: '',
      currentUser: null // ✅ 로그인 사용자 정보
    };
  },
  computed: {
    // 검색 필터링
    filteredUpdates() {
      if (!this.searchQuery.trim()) return this.updates;
      return this.updates.filter(update => {
        return (
          (update.title && update.title.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
          (update.content && update.content.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
          (update.date && update.date.toString().includes(this.searchQuery))
        );
      });
    },
    // ✅ Admin 여부 판별
    isAdmin() {
      return this.currentUser?.userid === 'Admin';
    }
  },
  created() {
    Promise.all([
      this.fetchUpdates(),
      this.checkLogin()
    ]);
  },
  methods: {
    // ✅ 로그인 유저 정보 확인
    async checkLogin() {
      try {
        const res = await axios.get(`${process.env.VUE_APP_API_URL}/auth/check-login`, {
          withCredentials: true
        });
        if (res.data.loggedIn) {
          this.currentUser = res.data.user;
        }
      } catch (err) {
        console.error('로그인 정보 확인 실패:', err);
      }
    },

    async fetchUpdates() {
      this.loading = true;
      this.error = false;
      try {
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/api/updates?sort=${this.sortOrder}`);
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
      // computed에서 처리됨
    },
    async submitUpdate() {
      try {
        await axios.post(`${process.env.VUE_APP_API_URL}/api/updates`, {
          title: this.title,
          content: this.content
        }, { withCredentials: true }); // ✅ 쿠키 인증 필요
        this.title = '';
        this.content = '';
        this.fetchUpdates();
        this.currentPage = 'list';
      } catch (err) {
        console.error('업데이트 작성 중 오류:', err);
        alert('작성 실패! 관리자만 작성 가능합니다.');
      }
    },
    // ✅ Admin만 작성 페이지 이동 가능
    goToWritePage() {
      if (!this.isAdmin) {
        alert('관리자만 작성할 수 있습니다.');
        return;
      }
      this.currentPage = 'write';
    },
    goToListPage() {
      this.currentPage = 'list';
    },
    convertNewLinesToBreaks(text) {
      return text ? text.replace(/\n/g, '<br>') : text;
    },
    formatDate(date) {
      return new Date(date).toLocaleDateString();
    }
  }
};
</script>

<style scoped>
/* 기존 스타일 그대로 유지 */
.contents {
  width: 100%;
  max-width: 1260px;
  margin: 0 auto;
  padding: 20px 50px;
}

.contents-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #424242;
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 10px;
}

.header-left,
.header-right {
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
  align-items: center;
  gap: 10px;
}

.patch-icon {
  width: 40px;
  height: 40px;
}

.patch-info {
  display: flex;
  flex-direction: column;
  margin-left: 20px;
  flex: 1;
}

.patch-title {
  font-size: 16px;
  font-weight: bold;
  color: white;
  text-decoration: none;
}

.patch-title:hover {
  text-decoration: underline;
}

.patch-date {
  font-size: 14px;
  color: #bbb !important;
}

.no-updates,
.loading,
.error {
  color: white;
  text-align: center;
}

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