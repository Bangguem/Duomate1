<template>
  <div id="app">
    <img alt="Vue logo" src="./assets/logo.png">
    <router-view />
    <router-link to="/signup">
      <button>회원가입</button>
    </router-link>
    <router-link to="/login">
      <button>로그인</button>
    </router-link>
  </div>
</template>

<script>
export default {
  name: 'App',
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

button {
  margin-top: 20px;
  padding: 10px 20px;
  font-size: 16px;
  background-color: #4caf50;
  color: white;
  border: none;
  cursor: pointer;
}

button:hover {
  background-color: #45a049;
}
</style>