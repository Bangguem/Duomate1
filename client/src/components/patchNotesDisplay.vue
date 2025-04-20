<template>
  <div class="contents">
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
      <div class="patch-item" v-for="(patch, index) in patchNotes" :key="index">
        <img src="@/assets/icon_lol.png" alt="패치 아이콘" class="patch-icon" />
        <div class="patch-info">
          <a :href="patch.link" target="_blank" class="patch-title">{{ patch.title }}</a>
          <p class="patch-review" v-if="patch.review">{{ patch.review }}</p>
          <p class="patch-date">{{ patch.date || '날짜 없음' }}</p>
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
      searchTimeout: null,
    };
  },
  watch: {
    searchQuery() {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => {
        this.fetchPatchNotes(true);
      }, 500); // 500ms 동안 입력 없으면 API 요청
    }
  },
  mounted() {
    this.fetchPatchNotes();
  },
  methods: {
    async fetchPatchNotes(reset = false) {
      if (reset) {
        this.skip = 0;
        this.canLoadMore = true;
      }

      try {
        const response = await fetch(`http://localhost:3000/api/patch-notes/patch-notes?skip=${this.skip}&limit=${this.limit}&searchQuery=${encodeURIComponent(this.searchQuery)}`, {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          this.patchNotes = reset ? data : [...this.patchNotes, ...data];
          this.skip = reset ? this.limit : this.skip + this.limit;
          this.canLoadMore = data.length === this.limit;
        } else {
          console.error('Error fetching patch notes');
        }
      } catch (error) {
        console.error('Error fetching patch notes:', error);
      }
    },
    async loadMore() {
      if (!this.canLoadMore) return;

      try {
        const response = await fetch(`${process.env.VUE_APP_API_URL}/api/patch-notes/patch-notes?skip=${this.skip}&limit=${this.limit}&searchQuery=${encodeURIComponent(this.searchQuery)}`, {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          this.patchNotes = [...this.patchNotes, ...data];
          this.skip += this.limit;
          this.canLoadMore = data.length === this.limit;
        } else {
          console.error('Error fetching patch notes');
        }
      } catch (error) {
        console.error('Error fetching patch notes:', error);
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

.header-left,
.header-right {
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
  flex-direction: column;
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

.patch-review {
  font-size: 14px;
  color: lightgray;
  margin: 4px 0;
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