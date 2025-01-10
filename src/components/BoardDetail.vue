<template>
  <div>
    <!-- 게시글이 로드되었을 때만 렌더링 -->
    <div v-if="post">
      <!-- 게시글 수정 모드 -->
      <div v-if="isEditing">
        <h1>게시글 수정</h1>
        <form @submit.prevent="updatePost">
          <div>
            <label for="title">제목</label>
            <input v-model="editedTitle" id="title" type="text" required />
          </div>
          <div>
            <label for="content">내용</label>
            <textarea v-model="editedContent" id="content" required></textarea>
          </div>
          <button type="submit">수정 완료</button>
          <button type="button" @click="cancelEdit">취소</button>
        </form>
      </div>

      <!-- 게시글 보기 모드 -->
      <div v-else>
        <h1>{{ post.title }}</h1>
        <p>{{ post.content }}</p>
        <small>작성자: {{ post.author || '작성자 없음' }}</small>
        <br />
        <small>작성 시간: {{ formatDate(post.createdAt) }}</small>

        <!-- 좋아요/싫어요 버튼 -->
        <div>
          <button @click="likePost">좋아요 ({{ post.likes }})</button>
          <button @click="dislikePost">싫어요 ({{ post.dislikes }})</button>
        </div>

        <!-- 게시글 수정/삭제 버튼 -->
        <div v-if="isAuthor">
          <button @click="enterEditMode">수정</button>
          <button @click="deletePost">삭제</button>
        </div>
      </div>

      <!-- 댓글 리스트 -->
      <div v-if="comments.length > 0">
        <h3>댓글 ({{ comments.length }})</h3>
        <ul>
          <li v-for="comment in comments" :key="comment._id" class="comment-item">
            <div class="comment-header">
              <strong>{{ comment.nickname }}</strong>
              <small>{{ formatDate(comment.createdAt) }}</small>

              <!-- 댓글 수정/삭제 버튼 -->
              <div v-if="currentUser?.userid === comment.userId" class="comment-actions">
                <button @click="startEditingComment(comment._id, comment.content)">댓글 수정</button>
                <button @click="deleteComment(comment._id)">댓글 삭제</button>
              </div>
            </div>

            <!-- 댓글 수정 모드 -->
            <div v-if="editingCommentId === comment._id">
              <textarea v-model="editingContent"></textarea>
              <button @click="saveEditedComment(comment._id)">저장</button>
              <button @click="cancelEditing">취소</button>
            </div>

            <!-- 댓글 내용 -->
            <div v-else>
              <p>{{ comment.content }}</p>
            </div>
            <!-- 댓글 좋아요/싫어요 버튼 -->
            <div>
              <button @click="likeComment(comment._id)">좋아요 ({{ comment.likes || 0 }})</button>
              <button @click="dislikeComment(comment._id)">싫어요 ({{ comment.dislikes || 0 }})</button>
            </div>
          </li>
        </ul>
      </div>

      <!-- 댓글 작성 -->
      <div v-if="currentUser">
        <textarea v-model="newComment" placeholder="댓글을 입력하세요"></textarea>
        <button @click="submitComment">댓글 작성</button>
      </div>
    </div>

    <!-- 로딩 중 -->
    <div v-else-if="loading">
      <h2>로딩 중...</h2>
    </div>

    <!-- 에러 상태 -->
    <div v-else>
      <h2>게시글을 불러오지 못했습니다.</h2>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  props: ['id'], // 게시글 ID를 props로 전달받음
  data() {
    return {
      post: null, // 게시글 데이터
      currentUser: null, // 현재 로그인한 사용자 정보
      loading: true, // 로딩 상태
      isEditing: false, // 게시글 수정 모드 여부
      editedTitle: '', // 수정 중인 제목
      editedContent: '', // 수정 중인 내용
      comments: [], // 댓글 리스트
      newComment: '', // 새 댓글 내용
      editingCommentId: null, // 수정 중인 댓글의 ID
      editingContent: '', // 수정 중인 댓글의 내용
    };
  },
  computed: {
    isAuthor() {
      return this.currentUser?.nickname === this.post?.author;
    },
  },
  methods: {
    async loadData() {
      this.loading = true;
      try {
        await Promise.all([this.fetchPost(), this.fetchComments(), this.fetchCurrentUser()]);
      } catch (error) {
        console.error('데이터를 가져오는 중 오류 발생:', error);
      } finally {
        this.loading = false;
      }
    },
    async fetchPost() {
      try {
        const response = await axios.get(`http://localhost:3000/api/board/${this.id}`, { withCredentials: true });
        this.post = response.data;
        this.editedTitle = this.post.title;
        this.editedContent = this.post.content;
      } catch (error) {
        console.error('게시글을 가져오는 중 오류 발생:', error);
        this.post = null;
      }
    },
    async fetchComments() {
      try {
        const response = await axios.get(`http://localhost:3000/api/board/${this.id}/comments`, { withCredentials: true });
        this.comments = response.data;
      } catch (error) {
        console.error('댓글을 가져오는 중 오류 발생:', error);
      }
    },
    async fetchCurrentUser() {
      try {
        const response = await axios.get('http://localhost:3000/auth/check-login', { withCredentials: true });
        if (response.data.loggedIn) {
          this.currentUser = response.data.user;
        }
      } catch (error) {
        console.error('현재 사용자 정보를 가져오는 데 실패했습니다:', error);
        this.currentUser = null;
      }
    },
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
    // 게시글 수정 관련 메서드
    enterEditMode() {
      this.isEditing = true;
    },
    cancelEdit() {
      this.isEditing = false;
      this.editedTitle = this.post.title;
      this.editedContent = this.post.content;
    },
    async updatePost() {
      try {
        const updatedData = {
          title: this.editedTitle,
          content: this.editedContent,
        };
        await axios.put(`http://localhost:3000/api/board/${this.id}`, updatedData, { withCredentials: true });
        this.post.title = this.editedTitle;
        this.post.content = this.editedContent;
        this.isEditing = false;
        alert('게시글이 수정되었습니다.');
      } catch (error) {
        console.error('게시글 수정 중 오류 발생:', error);
        alert('게시글 수정에 실패했습니다.');
      }
    },
    async deletePost() {
      try {
        await axios.delete(`http://localhost:3000/api/board/${this.id}`, { withCredentials: true });
        this.$router.push('/board');
      } catch (error) {
        console.error('게시글 삭제 중 오류 발생:', error);
      }
    },
    async likePost() {
      if (!this.currentUser) {
        alert('로그인이 필요합니다.');
        return;
      }
      try {
        await axios.put(`http://localhost:3000/api/board/${this.id}/like`, { action: 'like' }, { withCredentials: true });
        await this.fetchPost();
      } catch (error) {
        console.error('좋아요 처리 중 오류 발생:', error);
      }
    },
    async dislikePost() {
      if (!this.currentUser) {
        alert('로그인이 필요합니다.');
        return;
      }
      try {
        await axios.put(`http://localhost:3000/api/board/${this.id}/like`, { action: 'dislike' }, { withCredentials: true });
        await this.fetchPost();
      } catch (error) {
        console.error('싫어요 처리 중 오류 발생:', error);
      }
    },
    // 댓글 수정 관련 메서드
    startEditingComment(commentId, content) {
      this.editingCommentId = commentId;
      this.editingContent = content;
    },
    cancelEditing() {
      this.editingCommentId = null;
      this.editingContent = '';
    },
    async saveEditedComment(commentId) {
      if (!this.editingContent.trim()) {
        alert('수정할 내용을 입력해주세요.');
        return;
      }

      try {
        await axios.put(
          `http://localhost:3000/api/board/comments/${commentId}`,
          { content: this.editingContent },
          { withCredentials: true }
        );
        const comment = this.comments.find((c) => c._id === commentId);
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
    async deleteComment(commentId) {
      try {
        await axios.delete(`http://localhost:3000/api/board/comments/${commentId}`, { withCredentials: true });
        this.comments = this.comments.filter((comment) => comment._id !== commentId);
      } catch (error) {
        console.error('댓글 삭제 중 오류 발생:', error);
        alert('댓글 삭제에 실패했습니다.');
      }
    },
    async submitComment() {
      if (!this.newComment.trim()) {
        alert('댓글 내용을 입력해주세요.');
        return;
      }

      try {
        const response = await axios.post(
          `http://localhost:3000/api/board/${this.id}/comments`,
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
    async likeComment(commentId) {
      try {
        await axios.put(
          `http://localhost:3000/api/board/comments/${commentId}/like`,
          { action: 'like' },
          { withCredentials: true }
        );
        await this.fetchComments(); // 댓글 데이터 새로고침
      } catch (error) {
        console.error('댓글 좋아요 처리 중 오류 발생:', error);
      }
    },
    async dislikeComment(commentId) {
      try {
        await axios.put(
          `http://localhost:3000/api/board/comments/${commentId}/like`,
          { action: 'dislike' },
          { withCredentials: true }
        );
        await this.fetchComments(); // 댓글 데이터 새로고침
      } catch (error) {
        console.error('댓글 싫어요 처리 중 오류 발생:', error);
      }
    },
  },
  created() {
    this.loadData();
  },
};
</script>

<style>
.comment-item {
  margin-bottom: 15px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
}
.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>