<template>
  <div class="category-page">
    <div class="page-banner">
      <h1>{{ category?.name || "加载中..." }}</h1>
    </div>
    <div class="category-content">
      <div v-if="articles.length" class="article-list">
        <div
          v-for="article in articles"
          :key="article.id"
          class="article-item"
          @click="$router.push(`/article/${article.id}`)">
          <div v-if="article.cover_image" class="article-item-cover">
            <img :src="article.cover_image" :alt="article.title" />
          </div>
          <div class="article-item-content">
            <h3>{{ article.title }}</h3>
            <p class="article-summary">{{ article.summary }}</p>
            <span class="article-date">{{ article.created_at }}</span>
          </div>
        </div>
      </div>
      <div v-else class="empty-tip">暂无内容</div>
      <div class="pagination" v-if="total > pageSize">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next"
          @current-change="loadArticles" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, onMounted, watch} from "vue";
import {useRoute} from "vue-router";
import {getCategoryBySlug, getPublicArticles} from "../../api";
import type {Category, Article} from "../../types";

const route = useRoute();
const category = ref<Category | null>(null);
const articles = ref<Article[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = 10;

async function loadCategory() {
  const slug = route.params.slug as string;
  if (!slug) return;
  try {
    const res = await getCategoryBySlug(slug);
    category.value = res.data.data;
    currentPage.value = 1;
    await loadArticles();
  } catch (e) {
    // ignore
  }
}

async function loadArticles() {
  if (!category.value) return;
  try {
    const res = await getPublicArticles({
      category_id: category.value.id,
      page: currentPage.value,
      pageSize,
    });
    articles.value = res.data.data.list;
    total.value = res.data.data.total;
  } catch (e) {
    // ignore
  }
}

onMounted(loadCategory);
watch(() => route.params.slug, loadCategory);
</script>

<style scoped>
.category-page {
  min-height: 60vh;
}
.page-banner {
  background: linear-gradient(135deg, #1a1a2e, #0f3460);
  color: #fff;
  padding: 60px 20px;
  text-align: center;
}
.page-banner h1 {
  font-size: 32px;
}
.category-content {
  max-width: 900px;
  margin: 30px auto;
  padding: 0 20px;
}
.article-item {
  background: #fff;
  border-radius: 8px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  overflow: hidden;
}
.article-item-cover {
  width: 200px;
  min-height: 140px;
  flex-shrink: 0;
  overflow: hidden;
}
.article-item-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.article-item-content {
  padding: 24px;
  flex: 1;
}
.article-item:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}
.article-item h3 {
  font-size: 18px;
  color: #333;
  margin-bottom: 8px;
}
.article-summary {
  color: #666;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 8px;
}
.article-date {
  color: #999;
  font-size: 12px;
}
.empty-tip {
  text-align: center;
  padding: 60px;
  color: #999;
}
.pagination {
  display: flex;
  justify-content: center;
  margin-top: 30px;
}
</style>
