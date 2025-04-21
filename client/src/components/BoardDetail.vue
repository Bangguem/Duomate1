<template>
  <div class="post-container">
    <!-- [1] 게시글 로드 중/에러 상태 -->
    <div v-if="loading" class="loading">
      <h2>로딩 중...</h2>
    </div>
    <div v-else-if="!post" class="error">
      <h2>게시글을 불러오지 못했습니다.</h2>
    </div>

    <!-- [2] 게시글이 로드되었을 때 -->
    <div v-else class="post-card">
      <!-- [2-1] 게시글 수정 모드 -->
      <div v-if="isEditing">
        <h2>게시글 수정</h2>
        <form @submit.prevent="updatePost" class="edit-form">
          <input v-model="editedTitle" type="text" placeholder="제목을 입력하세요" required class="input-field" />
          <textarea v-model="editedContent" placeholder="내용을 입력하세요" required class="textarea-field"></textarea>

          <!-- 파일 첨부 입력 추가 -->
          <input type="file" @change="handleEditImageUpload" accept="image/*" />

          <div class="form-buttons">
            <button type="submit" class="save-btn">수정 완료</button>
            <button type="button" @click="cancelEdit" class="cancel-btn">취소</button>
          </div>
        </form>
      </div>

      <!-- [2-2] 게시글 일반 보기 모드 -->
      <div v-else>
        <!-- 제목/작성자/조회수 영역 -->
        <div class="post-header">
          <h1>{{ post.title }}</h1>
          <div class="post-meta">
            <span>작성자: <strong>{{ post.author || '익명' }}</strong></span>
            <span>작성일: {{ formatDate(post.createdAt) }}</span>
            <span>조회수: {{ post.views || 0 }}</span>
          </div>
        </div>

        <!-- 게시글 본문 -->
        <p class="post-content" v-html="convertNewLinesToBreaks(post.content)"></p>

        <!-- 이미지가 있을 경우 보여주기 -->
        <div v-if="post.imageUrl" class="post-image">
          <img :src="`${process.env.VUE_APP_API_URL}${post.imageUrl}?t=${new Date().getTime()}`" alt="게시글 이미지" />
        </div>

        <!-- 좋아요/싫어요 -->
        <div class="action-buttons">
          <button @click="likePost" class="like-btn">
            👍 좋아요 ({{ post.likes }})
          </button>
          <button @click="dislikePost" class="like-btn" style="margin-left:8px;">
            👎 싫어요 ({{ post.dislikes }})
          </button>
        </div>

        <!-- 게시글 수정/삭제 버튼 (글 작성자만) -->
        <div v-if="isAuthor" class="edit-actions">
          <button @click="enterEditMode" class="edit-btn">✏️ 수정</button>
          <button @click="deletePost" class="delete-btn">🗑 삭제</button>
        </div>
      </div>

      <!-- [3] 댓글 섹션 -->
      <div class="comments-section" v-if="!isEditing">
        <h3>댓글 ({{ comments.length }})</h3>

        <!-- 댓글 정렬 옵션 (댓글이 1개 이상일 때만 표시) -->
        <div v-if="comments.length > 0" style="margin-bottom: 15px;">
          <label for="comment-sort" style="margin-right:6px;">정렬 기준:</label>
          <select id="comment-sort" v-model="sortOrder" @change="sortComments"
            style="border-radius:5px; background:#444; color:white; border:none; padding:4px 8px;">
            <option value="latest">최신순</option>
            <option value="oldest">오래된순</option>
            <option value="likes">좋아요순</option>
          </select>
        </div>

        <!-- 댓글 작성 영역 (로그인 유저 & 수정 중 아닐 때만 보임) -->
        <div v-if="currentUser && !isEditing" class="comment-input">
          <textarea v-model="newComment" placeholder="댓글을 입력하세요"></textarea>
          <button @click="submitComment" class="comment-submit">댓글 작성</button>
        </div>

        <!-- 댓글 리스트 -->
        <ul class="comment-list">
          <li v-for="comment in sortedComments" :key="comment._id" class="comment-item">
            <div class="comment-header">
              <strong>{{ comment.nickname }}</strong>
              <span> | {{ formatDate(comment.createdAt) }}</span>
            </div>

            <!-- 댓글 수정 모드 -->
            <div v-if="editingCommentId === comment._id">
              <textarea v-model="editingContent" class="textarea-field"></textarea>
              <div class="comment-actions">
                <button @click="saveEditedComment(comment._id)" class="save-btn">
                  저장
                </button>
                <button @click="cancelEditing" class="cancel-btn">취소</button>
              </div>
            </div>

            <!-- 댓글 보기 모드 -->
            <div v-else>
              <p v-html="convertNewLinesToBreaks(comment.content)"></p>
              <div class="comment-actions">
                <!-- 좋아요/싫어요 -->
                <button @click="likeComment(comment._id)" class="like-btn">
                  👍 ({{ comment.likes || 0 }})
                </button>
                <button @click="dislikeComment(comment._id)" class="like-btn" style="margin-left:8px;">
                  👎 ({{ comment.dislikes || 0 }})
                </button>

                <!-- 댓글 수정/삭제 버튼 (작성자만 노출) -->
                <div v-if="currentUser?.userid === comment.userId" style="display:inline-block; margin-left:10px;">
                  <button @click="startEditingComment(comment._id, comment.content)" class="edit-btn">✏️ 수정</button>
                  <button @click="deleteComment(comment._id)" class="delete-btn">🗑 삭제</button>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  props: ['id'], // 라우터 params로 받은 게시글 ID
  data() {
    return {
      post: null,            // 게시글 데이터
      currentUser: null,     // 현재 로그인한 사용자
      loading: true,         // 로딩 상태
      isEditing: false,      // 게시글 수정 모드
      editedTitle: '',       // 수정 중인 제목
      editedContent: '',     // 수정 중인 내용
      comments: [],          // 댓글 리스트
      newComment: '',        // 새 댓글 내용
      editingCommentId: null,// 수정 중인 댓글 ID
      editingContent: '',    // 수정 중인 댓글 내용
      sortOrder: 'latest',   // 댓글 정렬 기준
      editedImage: null, // 새 이미지 파일 저장 변수 추가
    };
  },
  computed: {
    // 현재 게시글 작성자인지 판단
    isAuthor() {
      return this.currentUser?.nickname === this.post?.author;
    },
    // 정렬된 댓글 목록
    sortedComments() {
      return [...this.comments].sort((a, b) => {
        if (this.sortOrder === 'latest') {
          return new Date(b.createdAt) - new Date(a.createdAt); // 최신순
        } else if (this.sortOrder === 'oldest') {
          return new Date(a.createdAt) - new Date(b.createdAt); // 오래된순
        } else if (this.sortOrder === 'likes') {
          return (b.likes || 0) - (a.likes || 0);               // 좋아요순
        }
      });
    },
  },
  methods: {
    // 초기 데이터 로드
    async loadData() {
      this.loading = true;
      try {
        // 게시글, 댓글, 유저 정보 한번에 불러오기
        await Promise.all([this.fetchPost(), this.fetchComments(), this.fetchCurrentUser()]);
      } catch (error) {
        console.error('데이터를 가져오는 중 오류 발생:', error);
      } finally {
        this.loading = false;
      }
    },
    // 게시글 가져오기
    async fetchPost() {
      try {
        const response = await axios.get(`${process.env.VUE_APP_API_URL}api/board/${this.id}`, {
          withCredentials: true
        });
        this.post = response.data;
        this.editedTitle = this.post.title;
        this.editedContent = this.post.content;
      } catch (error) {
        console.error('게시글을 가져오는 중 오류 발생:', error);
        this.post = null;
      }
    },
    // 댓글 가져오기
    async fetchComments() {
      try {
        const response = await axios.get(`${process.env.VUE_APP_API_URL}api/board/${this.id}/comments`, {
          withCredentials: true
        });
        this.comments = response.data;
      } catch (error) {
        console.error('댓글을 가져오는 중 오류 발생:', error);
      }
    },
    // 현재 로그인 유저 가져오기
    async fetchCurrentUser() {
      try {
        const response = await axios.get(`${process.env.VUE_APP_API_URL}auth/check-login`, {
          withCredentials: true
        });
        if (response.data.loggedIn) {
          this.currentUser = response.data.user;
        }
      } catch (error) {
        console.error('현재 사용자 정보를 가져오는 데 실패했습니다:', error);
        this.currentUser = null;
      }
    },
    // 날짜 포맷
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    },
    // 게시글 수정 진입
    enterEditMode() {
      this.isEditing = true;
    },
    // 게시글 수정 취소
    cancelEdit() {
      this.isEditing = false;
      // 원래 값으로 복구
      this.editedTitle = this.post.title;
      this.editedContent = this.post.content;
    },
    // 게시글 수정 완료
    async updatePost() {
      try {
        if (this.editedImage) {
          // 파일이 첨부된 경우, FormData를 사용하여 전송
          const formData = new FormData();
          formData.append('title', this.editedTitle);
          formData.append('content', this.editedContent);
          formData.append('image', this.editedImage);
          await axios.put(`${process.env.VUE_APP_API_URL}api/board/${this.id}`, formData, {
            withCredentials: true,
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
        } else {
          // 파일 없이 텍스트만 수정하는 경우
          await axios.put(
            `${process.env.VUE_APP_API_URL}api/board/${this.id}`,
            { title: this.editedTitle, content: this.editedContent },
            { withCredentials: true }
          );
        }
        // 수정이 완료된 후 최신 데이터를 서버에서 다시 불러와 화면 갱신
        await this.fetchPost();
        this.isEditing = false;
        alert('게시글이 수정되었습니다.');
      } catch (error) {
        console.error('게시글 수정 중 오류 발생:', error);
        alert('게시글 수정에 실패했습니다.');
      }
    },
    // 게시글 삭제
    async deletePost() {
      try {
        await axios.delete(`${process.env.VUE_APP_API_URL}api/board/${this.id}`, {
          withCredentials: true
        });
        alert('게시글이 삭제되었습니다.');
        this.$router.push('/board');
      } catch (error) {
        console.error('게시글 삭제 중 오류 발생:', error);
      }
    },
    // 게시글 좋아요
    async likePost() {
      if (!this.currentUser) {
        alert('로그인이 필요합니다.');
        return;
      }
      try {
        const response = await axios.put(
          `${process.env.VUE_APP_API_URL}api/board/${this.id}/like`,
          { action: 'like' },
          { withCredentials: true }
        );
        this.post.likes = response.data.likes;
        this.post.dislikes = response.data.dislikes;
      } catch (error) {
        console.error('좋아요 처리 중 오류 발생:', error);
        alert('좋아요 처리에 실패했습니다.');
      }
    },
    // 게시글 싫어요
    async dislikePost() {
      if (!this.currentUser) {
        alert('로그인이 필요합니다.');
        return;
      }
      try {
        const response = await axios.put(
          `${process.env.VUE_APP_API_URL}api/board/${this.id}/like`,
          { action: 'dislike' },
          { withCredentials: true }
        );
        this.post.likes = response.data.likes;
        this.post.dislikes = response.data.dislikes;
      } catch (error) {
        console.error('싫어요 처리 중 오류 발생:', error);
        alert('싫어요 처리에 실패했습니다.');
      }
    },
    // 댓글 작성
    async submitComment() {
      if (!this.newComment.trim()) {
        alert('댓글 내용을 입력해주세요.');
        return;
      }
      try {
        const response = await axios.post(
          `${process.env.VUE_APP_API_URL}api/board/${this.id}/comments`,
          { content: this.newComment },
          { withCredentials: true }
        );
        this.comments.push(response.data);
        this.newComment = '';
      } catch (error) {
        console.error('댓글 작성 중 오류 발생:', error);
        alert('댓글 작성에 실패했습니다.');
      }
    },
    // 댓글 수정 시작
    startEditingComment(commentId, content) {
      this.editingCommentId = commentId;
      this.editingContent = content;
    },
    // 댓글 수정 취소
    cancelEditing() {
      this.editingCommentId = null;
      this.editingContent = '';
    },
    // 댓글 수정 완료
    async saveEditedComment(commentId) {
      if (!this.editingContent.trim()) {
        alert('수정할 내용을 입력해주세요.');
        return;
      }
      try {
        await axios.put(
          `${process.env.VUE_APP_API_URL}api/board/comments/${commentId}`,
          { content: this.editingContent },
          { withCredentials: true }
        );
        const comment = this.comments.find(c => c._id === commentId);
        if (comment) {
          comment.content = this.editingContent;
        }
        this.cancelEditing();
        alert('댓글이 수정되었습니다.');
      } catch (error) {
        console.error('댓글 수정 중 오류 발생:', error);
        alert('댓글 수정에 실패했습니다.');
      }
    },
    // 댓글 삭제
    async deleteComment(commentId) {
      try {
        await axios.delete(`${process.env.VUE_APP_API_URL}api/board/comments/${commentId}`, {
          withCredentials: true
        });
        this.comments = this.comments.filter(comment => comment._id !== commentId);
        alert('댓글이 삭제되었습니다.');
      } catch (error) {
        console.error('댓글 삭제 중 오류 발생:', error);
        alert('댓글 삭제에 실패했습니다.');
      }
    },
    // 댓글 좋아요
    async likeComment(commentId) {
      if (!this.currentUser) {
        alert('로그인이 필요합니다.');
        return;
      }
      try {
        await axios.put(
          `${process.env.VUE_APP_API_URL}api/board/comments/${commentId}/like`,
          { action: 'like' },
          { withCredentials: true }
        );
        await this.fetchComments(); // 갱신
      } catch (error) {
        console.error('댓글 좋아요 처리 중 오류 발생:', error);
      }
    },
    // 댓글 싫어요
    async dislikeComment(commentId) {
      if (!this.currentUser) {
        alert('로그인이 필요합니다.');
        return;
      }
      try {
        await axios.put(
          `${process.env.VUE_APP_API_URL}api/board/comments/${commentId}/like`,
          { action: 'dislike' },
          { withCredentials: true }
        );
        await this.fetchComments(); // 갱신
      } catch (error) {
        console.error('댓글 싫어요 처리 중 오류 발생:', error);
      }
    },
    // 댓글 정렬 이벤트 (옵션 변경 시 콘솔 로그)
    sortComments() {
      console.log(`정렬 기준이 ${this.sortOrder}로 변경되었습니다.`);
    },
    // 조회수 증가
    async incrementViews() {
      try {
        const response = await axios.post(
          `${process.env.VUE_APP_API_URL}api/board/${this.id}/views`,
          {},
          { withCredentials: true }
        );
        if (response.status === 200) {
          this.post.views += 1;
        }
      } catch (error) {
        console.error('조회수 증가 요청 중 오류 발생:', error);
      }
    },
    // 개행 문자 -> <br> 치환
    convertNewLinesToBreaks(text) {
      return text.replace(/\n/g, '<br>');
    },
    handleEditImageUpload(event) {
      this.editedImage = event.target.files[0];
    },
  },
  created() {
    // 컴포넌트 생성 시 데이터 로드 -> 조회수 증가
    this.loadData().then(() => {
      this.incrementViews();
    });
  },
};
</script>

<style scoped>
/* 최상위 컨테이너 */
.post-container {
  max-width: 700px;
  margin: 40px auto;
  padding: 20px;
  background: #222;
  border-radius: 8px;
  color: white;
}

/* 게시글 카드 전체 래퍼 */
.post-card {
  background: #333;
  padding: 20px;
  border-radius: 10px;
  position: relative;
}

/* 게시글 상단의 수정/삭제 버튼 (작성자 전용) */
.edit-actions {
  position: absolute;
  top: 15px;
  right: 15px;
  display: flex;
  gap: 8px;
}

.edit-btn,
.delete-btn {
  border: 1px solid gray;
  background: transparent;
  color: gray;
  padding: 5px 12px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
}

.edit-btn:hover,
.delete-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

/* 게시글 헤더 */
.post-header h1 {
  margin-bottom: 5px;
}

.post-meta {
  font-size: 14px;
  color: #bbb;
  display: flex;
  gap: 10px;
}

/* 게시글 본문 */
.post-content {
  margin: 20px 0;
  line-height: 1.6;
}

/* 좋아요/싫어요 버튼 영역 */
.action-buttons {
  margin-top: 10px;
}

.like-btn {
  border: 1px solid gray;
  background: transparent;
  color: white;
  padding: 5px 12px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
}

.like-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

/* 수정 폼 */
.edit-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
  align-items: center;
  /* 내부 요소 수평 가운데 정렬 */
  justify-content: center;
  /* 수직 정렬 (선택) */
  margin: 0 auto;
  /* edit-form 자체를 가운데로 */
  max-width: 600px;
  /* 전체 입력 폼 너비 제한 */
  width: 100%;
}

.input-field,
.textarea-field {
  width: 100%;
  padding: 10px;
  border: 1px solid gray;
  background: transparent;
  color: white;
  border-radius: 5px;
}

.textarea-field {
  height: 120px;
  resize: none;
}

.form-buttons {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.save-btn,
.cancel-btn {
  border: 1px solid gray;
  background: transparent;
  color: white;
  padding: 8px 12px;
  border-radius: 5px;
  cursor: pointer;
}

.save-btn:hover,
.cancel-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

/* 댓글 섹션 */
.comments-section {
  margin-top: 35px;
}

.comment-input {
  margin-bottom: 15px;
}

.comment-input textarea {
  width: 100%;
  padding: 8px;
  border-radius: 5px;
  background: #555;
  color: white;
  border: none;
  height: 60px;
  margin-bottom: 8px;
}

.comment-submit {
  background: transparent;
  border: 1px solid gray;
  color: white;
  padding: 6px 10px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
}

.comment-submit:hover {
  background: rgba(255, 255, 255, 0.1);
}

/* 댓글 목록 */
.comment-list {
  list-style: none;
  padding: 0;
}

.comment-item {
  padding: 8px 12px;
  background: #444;
  border-radius: 5px;
  margin-bottom: 10px;
  font-size: 13px;
  border: 1px solid #666;
}

.comment-header {
  font-weight: bold;
  margin-bottom: 4px;
}

.comment-header span {
  color: #bbb;
  margin-left: 4px;
}

.comment-actions {
  margin-top: 8px;
}

/* 로딩/에러 상태 */
.loading,
.error {
  text-align: center;
  color: white;
}

.post-image {
  margin: 20px 0;
  text-align: center;
}

.post-image img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
}
</style>