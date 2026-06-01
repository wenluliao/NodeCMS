<template>
  <div class="front-layout">
    <header class="front-header">
      <div class="container">
        <div class="logo" @click="$router.push('/')">律师事务所</div>
        <nav class="front-nav">
          <router-link to="/" class="nav-link">首页</router-link>
          <template v-for="cat in categories" :key="cat.id">
            <router-link
              v-if="cat.slug !== 'messages'"
              :to="`/category/${cat.slug}`"
              class="nav-link">
              {{ cat.name }}
            </router-link>
          </template>
          <router-link to="/message" class="nav-link">在线留言</router-link>
        </nav>
      </div>
    </header>
    <main class="front-main">
      <router-view />
    </main>
    <footer class="front-footer">
      <div class="container">
        <p>&copy; {{ new Date().getFullYear() }} 律师事务所 版权所有</p>
      </div>
    </footer>
    <ChatWidget />
  </div>
</template>

<script setup lang="ts">
import {ref, onMounted} from "vue";
import {getCategories} from "../../api";
import type {Category} from "../../types";
import ChatWidget from "../../components/ChatWidget.vue";

const categories = ref<Category[]>([]);

onMounted(async () => {
  try {
    const res = await getCategories();
    categories.value = res.data.data;
  } catch (e) {
    // ignore
  }
});
</script>

<style scoped>
.front-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.front-header {
  background: #1a1a2e;
  color: #fff;
  padding: 0 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
.container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 70px;
}
.logo {
  font-size: 22px;
  font-weight: bold;
  cursor: pointer;
  letter-spacing: 2px;
}
.front-nav {
  display: flex;
  gap: 8px;
}
.nav-link {
  color: #ccc;
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 4px;
  transition: all 0.3s;
  font-size: 15px;
}
.nav-link:hover,
.nav-link.router-link-active {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
}
.front-main {
  flex: 1;
  background: #f5f5f5;
}
.front-footer {
  background: #1a1a2e;
  color: #999;
  text-align: center;
  padding: 20px;
  font-size: 14px;
}
</style>
