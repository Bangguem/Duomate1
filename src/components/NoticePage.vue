<template>
  <div class="contents">  <!-- 전체 콘텐츠를 감싸는 컨테이너 -->

    <!-- 패치노트 섹션 (동적 데이터) -->
    <section class="left-grid-item">
      <p class="section-title">패치노트</p>
    </section>
    <section class="right-grid-item">
      <div class="post-item" v-for="patch in patchNotes.slice(0, 2)" :key="patch.link">
        <img src="@/assets/icon_lol.png" alt="패치 아이콘" class="patch-icon" />
        <div class="patch-info">
          <a :href="patch.link" target="_blank" class="patch-title">{{ patch.title }}</a>
          <p class="patch-date">{{ patch.date || '날짜 없음' }}</p>
          <p class="patch-description">{{ patch.review }}</p>
        </div>
      </div>
      <button class="more-button" @click="goToPatchNotes">더보기</button>
    </section>

    <!-- 업데이트 섹션 (동적 데이터) -->
    <section class="left-grid-item">
      <p class="section-title">업데이트</p>
    </section>
    <section class="right-grid-item">
      <div class="post-item" v-for="update in dynamicUpdates.slice(0, 2)" :key="update._id">
        <img src="@/assets/icon_setting.png" alt="업데이트 아이콘" class="patch-icon" />
        <div class="patch-info">
          <!-- 제목을 router-link로 감싸 클릭 시 상세페이지로 이동 -->
          <router-link :to="{ name: 'UpdateDetail', params: { id: update._id } }" class="patch-title">
            {{ update.title }}
          </router-link>
          <p class="patch-date">{{ formatDate(update.date) }}</p>
          <!-- 업데이트 내용을 숨기기 위해 주석 처리 -->
          <!-- <p class="patch-description">{{ update.content }}</p> -->
        </div>
      </div>
      <button class="more-button" @click="goToUpdates">더보기</button>
    </section>

    <!-- 문의내역 섹션 (static 데이터) -->
    <section class="left-grid-item">
      <p class="section-title">문의내역</p>
    </section>
    <section class="right-grid-item">
      <div class="post-item" v-for="inquiry in staticInquiries" :key="inquiry.version">
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
import axios from 'axios';
export default {
  data() {
    return {
      patchNotes: [],       // 패치노트 데이터 (동적)
      dynamicUpdates: [],   // 업데이트 데이터 (동적)
      staticInquiries: [    // 문의내역 (static)
        { version: '1.5.8', date: '1달 전', description: '- UI 개선' },
        { version: '1.5.7', date: '2달 전', description: '- 서버 안정성 강화' }
      ]
    };
  },
  mounted() {
    this.fetchPatchNotes();
    this.fetchDynamicUpdates();
  },
  methods: {
    async fetchPatchNotes() {
      try {
        const response = await fetch(
          'http://localhost:3000/api/patch-notes/patch-notes?skip=0&limit=12',
          { method: 'GET', credentials: 'include' }
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
    async fetchDynamicUpdates() {
      try {
        const response = await axios.get('http://localhost:3000/api/updates?sort=latest');
        this.dynamicUpdates = response.data;
      } catch (error) {
        console.error('Error fetching dynamic updates:', error);
      }
    },
    goToPatchNotes() {
      this.$router.push('/patch-notes');
    },
    goToUpdates() {
      this.$router.push('/updates');
    },
    formatDate(date) {
      return new Date(date).toLocaleDateString();
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
  gap: 20px;
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