<template>
    <div>
      <h1>롤 패치 노트</h1>
      <div v-if="patchNotes.length === 0">
        <p>패치 노트를 불러오는 중...</p>
      </div>
      <ul v-else>
        <li v-for="(note, index) in patchNotes" :key="index">
          <a :href="note.link" target="_blank">{{ note.title }}</a>
        </li>
      </ul>
  
      <!-- 더보기 버튼 추가 -->
      <button v-if="canLoadMore" @click="loadMore">더보기</button>
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        patchNotes: [],     // 패치 노트 데이터
        skip: 0,            // 데이터 건너뛰기 (페이지네이션)
        limit: 12,          // 한 번에 불러올 데이터 개수
        canLoadMore: true,  // 더보기 버튼이 활성화될지 여부
      };
    },
    mounted() {
      this.fetchPatchNotes();  // 컴포넌트가 마운트되면 API 호출
    },
    methods: {
      async fetchPatchNotes() {
        try {
          const response = await fetch('http://localhost:3000/api/patch-notes/patch-notes', {
            method: 'GET',
            credentials: 'include', // 쿠키 포함
          });
  
          if (response.ok) {
            const data = await response.json();
            this.patchNotes = data;  // 서버에서 받은 패치 노트를 화면에 표시
          } else {
            console.error('Error fetching patch notes');
          }
        } catch (error) {
          console.error('Error fetching patch notes:', error);
        }
      },
  
      // "더보기" 버튼 클릭 시 추가 데이터 로드
      async loadMore() {
        try {
          const response = await fetch(`http://localhost:3000/api/patch-notes/patch-notes?skip=${this.skip}&limit=${this.limit}`, {
            method: 'GET',
            credentials: 'include', // 쿠키 포함
          });
  
          if (response.ok) {
            const data = await response.json();
            
            // 더보기 버튼 클릭 시 기존 패치 노트에 새로운 패치 노트 추가
            this.patchNotes = [...this.patchNotes, ...data];
            
            // 더 이상 로드할 데이터가 없으면 더보기 버튼 비활성화
            if (data.length < this.limit) {
              this.canLoadMore = false;
            }
  
            // skip 값을 갱신하여 더 많은 데이터를 요청
            this.skip += this.limit;
          } else {
            console.error('Error fetching patch notes');
          }
        } catch (error) {
          console.error('Error fetching patch notes:', error);
        }
      },
    },
  };
  </script>
  
  <style scoped>
  /* 스타일링 */
  h1 {
    font-size: 24px;
    margin-bottom: 20px;
    color: white; /* 글씨 색깔을 하얀색으로 변경 */
  }
  
  ul {
    list-style-type: none;
    padding: 0;
  }
  
  li {
    margin-bottom: 10px;
  }
  
  a {
    color: white; /* 글씨 색깔을 하얀색으로 변경 */
    text-decoration: none;
  }
  
  a:hover {
    text-decoration: underline;
  }
  
  button {
    background-color: #008cba;
    color: white;
    padding: 10px 20px;
    border: none;
    cursor: pointer;
    margin-top: 20px;
  }
  
  button:hover {
    background-color: #0077a3;
  }
  </style>