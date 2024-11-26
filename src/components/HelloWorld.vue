<template>
  <div>
    <h1>Vue와 Node.js 연동</h1>
    <p>{{ message }}</p>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      message: 'Loading...',
    };
  },
  mounted() {
    axios
      .get('http://localhost:3000/api/message')
      .then((response) => {
        this.message = response.data.message;
      })
      .catch((error) => {
        console.error('Error fetching message:', error);
        this.message = 'Error loading message.';
      });
  },
};
</script>