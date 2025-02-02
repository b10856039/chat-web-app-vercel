<template>
  <div id="app">
    <!-- 主內容區域 -->
    <main class="app-main">
      <router-view />
    </main>

  </div>
</template>

<script>

export default {
  name: 'App',
};
</script>

<style lang="scss">
  html, body {
    height: 100%;
    margin: 0;
    padding: 0;
    font-family: 'Noto Sans TC', sans-serif;
  }

  #app {
    height: 100%;  /* 使 #app 占滿整個頁面 */
  }

  .app-main {
    height: 100%;  /* app-main 占滿剩餘的空間 */
    display: flex;  /* 可以加上 Flexbox 布局 */
    flex-direction: column;  /* 如果需要將子元素縱向排列 */
  }
</style>