<template>
  <div class="contents">  <!-- 전체 콘텐츠 컨테이너 -->
      <section class="contents-header">
          <div class="header-right">
              <div class="search-box">
                  <input v-model="searchQuery" type="text" placeholder="검색" class="search-input">
                  <span class="search-icon">🔍</span>
              </div>
          </div>
      </section>

      <section class="patch-list">
          <div v-if="patchNotes.length === 0">
              <p>패치 노트를 불러오는 중...</p>
          </div>
          <div class="patch-item" v-for="(patch, index) in filteredPatchNotes" :key="index">
              <img src="@/assets/icon_lol.png" alt="패치 아이콘" class="patch-icon" />
              <div class="patch-info">
                  <a :href="patch.link" target="_blank" class="patch-title">{{ patch.title }}</a>
                  <p class="patch-date">{{ patch.date }}</p>
              </div>
          </div>
      </section>

      <button v-if="canLoadMore" @click="loadMore">더보기</button>
  </div>
</template>

<script>
export default {
  data() {
      return {
          patchNotes: [],
          skip: 0,
          limit: 12,
          canLoadMore: true,
          searchQuery: '',
      };
  },
  computed: {
      filteredPatchNotes() {
          return this.patchNotes.filter(patch =>
              patch.title.toLowerCase().includes(this.searchQuery.toLowerCase())
          );
      }
  },
  mounted() {
      this.fetchPatchNotes();
  },
  methods: {
      async fetchPatchNotes() {
          try {
              const response = await fetch(`http://localhost:3000/api/patch-notes/patch-notes?skip=${this.skip}&limit=${this.limit}`, {
                  method: 'GET',
                  credentials: 'include',
              });

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
      async loadMore() {
          try {
              const response = await fetch(`http://localhost:3000/api/patch-notes/patch-notes?skip=${this.skip}&limit=${this.limit}`, {
                  method: 'GET',
                  credentials: 'include',
              });

              if (response.ok) {
                  const data = await response.json();
                  this.patchNotes = [...this.patchNotes, ...data];
                  if (data.length < this.limit) {
                      this.canLoadMore = false;
                  }
                  this.skip += this.limit;
              } else {
                  console.error('Error fetching patch notes');
              }
          } catch (error) {
              console.error('Error fetching patch notes:', error);
          }
      },
      sortBy(type) {
          if (type === 'latest') {
              this.patchNotes.sort((a, b) => new Date(b.date) - new Date(a.date));
          } else if (type === 'popular') {
              // 인기순 정렬 (예: 좋아요 개수 기준, 데이터 형식에 맞게 수정 필요)
          }
      }
  }
};
</script>

<style scoped>
.contents {
  width: 100%;
  max-width: 1260px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px 50px;
  border-radius: 0.5rem;
}

.contents-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #424242;
  padding: 15px;
  border-radius: 10px;
}

.header-left, .header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-button {
  background-color: #333;
  color: white;
  padding: 8px 12px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
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

.patch-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.patch-item {
  display: flex;
  align-items: center;
  background-color: #333;
  padding: 15px;
  border-radius: 8px;
  gap: 15px;
}

.patch-icon {
  width: 40px;
  height: 40px;
}

.patch-info {
  display: flex;
  justify-content: space-between;
  width: 100%;
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

button {
  background-color: #008cba;
  color: white;
  padding: 10px 20px;
  border: none;
  cursor: pointer;
  margin-top: 20px;
  border-radius: 5px;
}

button:hover {
  background-color: #0077a3;
}
</style>
