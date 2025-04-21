<template>
  <div class="update-detail-container">
    <div v-if="loading" class="loading">
      <h2>로딩 중...</h2>
    </div>
    <div v-else-if="error" class="error">
      <h2>업데이트를 불러오지 못했습니다.</h2>
    </div>
    <div v-else class="update-detail-card">
      <!-- 수정 모드 -->
      <div v-if="isEditing">
        <h2>업데이트 수정</h2>
        <form @submit.prevent="updateUpdate">
          <input v-model="editedTitle" type="text" required class="input-field" placeholder="제목 입력" />
          <textarea v-model="editedContent" required class="textarea-field" placeholder="내용 입력"></textarea>
          <div class="form-buttons">
            <button type="submit" class="save-btn">수정 완료</button>
            <button type="button" @click="cancelEdit" class="cancel-btn">취소</button>
          </div>
        </form>
      </div>

      <!-- 보기 모드 -->
      <div v-else>
        <div class="update-header">
          <h1>{{ update.title }}</h1>
          <div class="update-meta">
            <span>작성일: {{ formatDate(update.date) }}</span>
          </div>
        </div>
        <p class="update-content" v-html="convertNewLinesToBreaks(update.content)"></p>

        <!-- ✅ Admin만 수정/삭제 버튼 표시 -->
        <div v-if="isAdmin" class="action-buttons">
          <button @click="enterEditMode" class="edit-btn">✏️ 수정</button>
          <button @click="deleteUpdate" class="delete-btn">🗑 삭제</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  props: ['id'],
  data() {
    return {
      update: null,
      loading: true,
      error: false,
      isEditing: false,
      editedTitle: '',
      editedContent: '',
      currentUser: null // ✅ 로그인 사용자 정보
    };
  },
  computed: {
    // ✅ Admin 여부 판단
    isAdmin() {
      return this.currentUser?.userid === 'Admin';
    }
  },
  methods: {
    async fetchUpdate() {
      this.loading = true;
      this.error = false;
      try {
        const response = await axios.get(`${process.env.VUE_APP_API_URL}api/updates/${this.id}`);
        this.update = response.data;
        this.editedTitle = response.data.title;
        this.editedContent = response.data.content;
      } catch (err) {
        console.error('업데이트를 가져오는 중 오류:', err);
        this.error = true;
      } finally {
        this.loading = false;
      }
    },

    async checkLogin() {
      try {
        const res = await axios.get(`${process.env.VUE_APP_API_URL}auth/check-login`, {
          withCredentials: true
        });
        if (res.data.loggedIn) {
          this.currentUser = res.data.user;
        }
      } catch (err) {
        console.error('로그인 정보 확인 실패:', err);
        this.currentUser = null;
      }
    },

    formatDate(date) {
      return new Date(date).toLocaleDateString();
    },

    convertNewLinesToBreaks(text) {
      return text ? text.replace(/\n/g, '<br>') : text;
    },

    enterEditMode() {
      this.isEditing = true;
    },

    cancelEdit() {
      this.isEditing = false;
      this.editedTitle = this.update.title;
      this.editedContent = this.update.content;
    },

    async updateUpdate() {
      try {
        const response = await axios.put(
          `${process.env.VUE_APP_API_URL}api/updates/${this.id}`,
          {
            title: this.editedTitle,
            content: this.editedContent
          },
          { withCredentials: true }
        );
        this.update = response.data;
        this.isEditing = false;
        alert('업데이트가 수정되었습니다.');
      } catch (err) {
        console.error('업데이트 수정 중 오류:', err.response ? err.response.data : err);
        alert('업데이트 수정에 실패했습니다.');
      }
    },

    async deleteUpdate() {
      if (confirm('정말 삭제하시겠습니까?')) {
        try {
          await axios.delete(`${process.env.VUE_APP_API_URL}api/updates/${this.id}`, {
            withCredentials: true
          });
          alert('업데이트가 삭제되었습니다.');
          this.$router.push('/updates');
        } catch (err) {
          console.error('업데이트 삭제 중 오류:', err);
          alert('업데이트 삭제에 실패했습니다.');
        }
      }
    }
  },
  created() {
    this.fetchUpdate();
    this.checkLogin(); // ✅ 로그인 유저 정보 확인
  }
};
</script>

<style scoped>
.update-detail-container {
  max-width: 700px;
  margin: 40px auto;
  padding: 20px;
  background: #222;
  border-radius: 8px;
  color: white;
}

.loading,
.error {
  text-align: center;
}

.update-detail-card {
  background: #333;
  padding: 20px;
  border-radius: 10px;
  position: relative;
}

.update-header h1 {
  margin: 0;
}

.update-meta {
  font-size: 14px;
  color: #bbb;
  margin-bottom: 10px;
}

.update-content {
  font-size: 16px;
  line-height: 1.6;
  margin-bottom: 20px;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.edit-btn,
.delete-btn {
  padding: 8px 12px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.edit-btn {
  background-color: #42b983;
  color: white;
}

.delete-btn {
  background-color: #d9534f;
  color: white;
}

.form-buttons {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.save-btn,
.cancel-btn {
  padding: 8px 12px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.save-btn {
  background-color: #42b983;
  color: white;
}

.cancel-btn {
  background-color: gray;
  color: white;
}

.input-field,
.textarea-field {
  width: 100%;
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #bbb;
  border-radius: 5px;
  background: #222;
  color: white;
}
</style>