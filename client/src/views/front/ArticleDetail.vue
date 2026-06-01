<template>
  <div class="article-detail" v-if="article">
    <div class="page-banner">
      <h1>{{ article.title }}</h1>
      <p class="meta">{{ article.category_name }} | {{ article.created_at }}</p>
    </div>
    <div class="article-body">
      <div v-if="article.cover_image" class="article-cover">
        <img :src="article.cover_image" :alt="article.title" />
      </div>
      <div class="article-content" v-html="article.content"></div>
      <div class="back-link">
        <router-link :to="`/category/${categorySlug}`">&larr; 返回列表</router-link>
      </div>
    </div>
  </div>
  <div v-else class="loading">加载中...</div>
</template>

<script setup lang="ts">
import {ref, onMounted, computed} from "vue";
import {useRoute} from "vue-router";
import {getPublicArticle} from "../../api";
import type {Article} from "../../types";

const route = useRoute();
const article = ref<Article | null>(null);

const categorySlug = computed(() => {
  // Fallback: go back to home
  return "";
});

onMounted(async () => {
  const id = Number(route.params.id);
  if (!id) return;
  try {
    const res = await getPublicArticle(id);
    article.value = res.data.data;
  } catch (e) {
    // ignore
  }
});
</script>

<style scoped>
.article-detail {
  min-height: 60vh;
}
.page-banner {
  background: linear-gradient(135deg, #1a1a2e, #0f3460);
  color: #fff;
  padding: 60px 20px;
  text-align: center;
}
.page-banner h1 {
  font-size: 30px;
  margin-bottom: 10px;
}
.meta {
  color: #ccc;
  font-size: 14px;
}
.article-body {
  max-width: 900px;
  margin: 30px auto;
  padding: 0 20px;
}
.article-cover {
  text-align: center;
  margin-bottom: 20px;
}
.article-cover img {
  max-width: 100%;
  border-radius: 8px;
}
.article-content {
  background: #fff;
  border-radius: 8px;
  padding: 40px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  line-height: 1.8;
  font-size: 16px;
  color: #333;
}
.article-content :deep(h1) {
  font-size: 26px;
  margin: 24px 0 12px;
}
.article-content :deep(h2) {
  font-size: 22px;
  margin: 20px 0 10px;
}
.article-content :deep(h3) {
  font-size: 18px;
  margin: 16px 0 8px;
}
.article-content :deep(p) {
  margin-bottom: 16px;
  text-indent: 2em;
}
.article-content :deep(img) {
  max-width: 100%;
  border-radius: 4px;
  margin: 10px 0;
}
.article-content :deep(blockquote) {
  border-left: 4px solid #ddd;
  padding: 8px 16px;
  margin: 16px 0;
  color: #666;
  background: #f9f9f9;
}
.article-content :deep(ul),
.article-content :deep(ol) {
  padding-left: 2em;
  margin-bottom: 16px;
}
.article-content :deep(li) {
  margin-bottom: 4px;
}
.article-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 16px;
}
.article-content :deep(th),
.article-content :deep(td) {
  border: 1px solid #ddd;
  padding: 8px 12px;
}
.article-content :deep(th) {
  background: #f5f5f5;
}
.article-content :deep(pre) {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
}
.article-content :deep(code) {
  background: #f0f0f0;
  padding: 2px 4px;
  border-radius: 2px;
  font-size: 14px;
}
.article-content :deep(a) {
  color: #0f3460;
  text-decoration: underline;
}
.back-link {
  margin-top: 30px;
}
.back-link a {
  color: #0f3460;
  text-decoration: none;
  font-size: 14px;
}
.back-link a:hover {
  text-decoration: underline;
}
.loading {
  text-align: center;
  padding: 100px;
  color: #999;
}
</style>
