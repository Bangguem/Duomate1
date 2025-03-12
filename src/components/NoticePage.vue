<template>
  <div class="contents">  <!-- 전체 콘텐츠를 감싸는 컨테이너 -->

    <!-- 패치노트 섹션 (동적 데이터) -->
    <section class="left-grid-item">
      <p class="section-title">패치노트</p>
    </section>
    <section class="right-grid-item">
      <div class="post-item" v-for="(patch, index) in patchNotes.slice(0, 2)" :key="index">
        <img src="@/assets/icon_lol.png" alt="패치 아이콘" class="patch-icon" />
        <div class="patch-info">
          <!-- 제목에 링크 추가 -->
          <a :href="patch.link" target="_blank" class="patch-title">{{ patch.title }}</a>
          <p class="patch-date">{{ patch.date || '날짜 없음' }}</p>
          <p class="patch-description">{{ patch.review }}</p>
        </div>
      </div>
      <!-- 더보기 버튼 -->
      <button class="more-button" @click="goToPatchNotes">더보기</button>
    </section>

    <!-- 업데이트 섹션 (static 데이터) -->
    <section class="left-grid-item">
      <p class="section-title">업데이트</p>
    </section>
    <section class="right-grid-item">
      <div class="post-item" v-for="(update, index) in staticUpdates" :key="index">
        <img src="@/assets/icon_setting.png" alt="업데이트 아이콘" class="patch-icon" />
        <div class="patch-info">
          <p class="patch-title">버전 {{ update.version }} 업데이트</p>
          <p class="patch-date">{{ update.date }}</p>
          <p class="patch-description">{{ update.description }}</p>
        </div>
      </div>
    </section>

    <!-- 문의내역 섹션 (static 데이터) -->
    <section class="left-grid-item">
      <p class="section-title">문의내역</p>
    </section>
    <section class="right-grid-item">
      <div class="post-item" v-for="(inquiry, index) in staticInquiries" :key="index">
        <span class="inquiry-icon">🙋🏻</span>
        <div class="patch-info">
          <p class="patch-title">버전 {{ inquiry.version }} 문의</p>
          <p class="patch-date">{{ inquiry.date }}</p>
          <p class="patch-description">{{ inquiry.description }}</p>
        </div>
      </div>
    </section>

  </div>
</template>

<script>
export default {
  data() {
    return {
      // 패치노트 섹션: 동적 데이터
      patchNotes: [],
      // 업데이트와 문의내역 섹션: 기존 static 데이터
      staticUpdates: [
        { version: '1.5.10', date: '3일 전', description: '- 기타 성능 향상' },
        { version: '1.5.9', date: '2주 전', description: '- 게임 밸런스 조정' }
      ],
      staticInquiries: [
        { version: '1.5.8', date: '1달 전', description: '- UI 개선' },
        { version: '1.5.7', date: '2달 전', description: '- 서버 안정성 강화' }
      ]
    };
  },
  mounted() {
    this.fetchPatchNotes();
  },
  methods: {
    async fetchPatchNotes() {
      try {
        const response = await fetch(
          'http://localhost:3000/api/patch-notes/patch-notes?skip=0&limit=12',
          {
            method: 'GET',
            credentials: 'include'
          }
        );
        if (response.ok) {
          const data = await response.json();
          this.patchNotes = data;
        } else {
          console.error('Error fetching patch notes');
        }
      } catch (error) {
        console.error('Error fetching patch notes:', error);
      }
    },
    goToPatchNotes() {
      this.$router.push('/patch-notes');
    }
  }
};
</script>

<style scoped>
.contents {
  width: 100%;
  max-width: 1260px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 20px; /* 각 그리드 셀 사이에 간격 추가 */
  padding: 20px 10px;
}

.left-grid-item {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.right-grid-item {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 10px;
}

.section-title {
  font-size: 30px;
  font-weight: bold;
  color: white;
}

.post-item {
  display: flex;
  align-items: center;
  background-color: #333;
  padding: 15px;
  border-radius: 8px;
  gap: 15px;
  width: 100%;
}

.patch-icon {
  width: 40px;
  height: 40px;
  margin-left: 20px;
}

.patch-info {
  display: flex;
  flex-direction: column;
  width: 100%;
  margin-left: 20px;
  color: white;
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
  color: gray;
}

.patch-description {
  font-size: 14px;
  color: lightgray;
}

.inquiry-icon {
  font-size: 24px;
  margin-right: 8px;
}

.more-button {
  background-color: #555;
  color: white;
  font-size: 16px;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin-top: 10px;
}

.more-button:hover {
  background-color: #777;
}
</style>