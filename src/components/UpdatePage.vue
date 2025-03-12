<template>
    <div class="contents">
        <!-- 필터 및 검색 기능 -->
        <section class="contents-header">
            <div class="header-left">
                <button class="filter-button" @click="sortUpdates('latest')">최신순</button>
                <button class="filter-button" @click="sortUpdates('oldest')">오래된순</button>
            </div>
            <div class="header-right">
                <div class="search-box">
                    <input v-model="searchQuery" type="text" placeholder="검색" class="search-input">
                    <span class="search-icon">🔍</span>
                </div>
            </div>
        </section>

        <!-- 업데이트 공지 리스트 -->
        <section class="patch-list">
            <div v-if="filteredUpdates.length === 0">
                <p>업데이트 공지가 없습니다.</p>
            </div>
            <div class="patch-item" v-for="(patch, index) in filteredUpdates" :key="index">
                <img src="@/assets/icon_setting.png" alt="업데이트 아이콘" class="update-icon" />
                <div class="patch-info">
                    <p class="patch-title">{{ patch.month }}월 {{ patch.day }}일 업데이트 공지</p>
                    <p class="patch-date">{{ patch.date }}</p>
                </div>
            </div>
        </section>
    </div>
</template>

<script>
export default {
    data() {
        return {
            updates: [],      // 서버에서 가져온 업데이트 공지 리스트
            searchQuery: '',  // 검색어
            sortType: 'latest', // 정렬 기준
        };
    },
    computed: {
        filteredUpdates() {
            return this.updates.filter(patch => 
                patch.month.includes(this.searchQuery) || 
                patch.day.includes(this.searchQuery) || 
                patch.date.includes(this.searchQuery)
            );
        }
    },
    watch: {
        searchQuery() {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.fetchUpdates();
            }, 500); // 500ms 동안 입력 없으면 API 요청
        }
    },
    mounted() {
        this.fetchUpdates();
    },
    methods: {
        async fetchUpdates() {
            try {
                const response = await fetch(`http://localhost:3000/api/updates?sort=${this.sortType}`);
                if (response.ok) {
                    this.updates = await response.json();
                } else {
                    console.error('Error fetching updates');
                }
            } catch (error) {
                console.error('Error fetching updates:', error);
            }
        },
        sortUpdates(order) {
            this.sortType = order;
            this.fetchUpdates();
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

.header-left {
    display: flex;
    align-items: center;
    gap: 10px;
}

.header-right {
    display: flex;
    align-items: center;
    gap: 10px;
}

.update-icon {
    width: 40px;
    height: 40px;
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

.search-icon {
    color: gray;
    cursor: pointer;
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

.patch-info {
    display: flex;
    justify-content: space-between;
    width: 100%;
    color: white;
}

.patch-title {
    font-size: 16px;
    font-weight: bold;
}

.patch-date {
    font-size: 14px;
    color: gray;
}
</style>