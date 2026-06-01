<template>
  <div class="home-page">
    <div class="hero-section">
      <div class="hero-content">
        <h1>专业法律服务 守护您的权益</h1>
        <p>我们致力于为客户提供专业、高效、诚信的法律服务</p>
      </div>
    </div>
    <div class="category-sections">
      <div v-for="cat in categories" :key="cat.id" class="category-section">
        <template v-if="cat.slug !== 'messages'">
          <div class="section-header">
            <h2>{{ cat.name }}</h2>
            <router-link :to="`/category/${cat.slug}`" class="more-link">更多 &rarr;</router-link>
          </div>
          <div class="article-list" v-if="catArticles[cat.id]?.length">
            <div
              v-for="article in catArticles[cat.id]"
              :key="article.id"
              class="article-card"
              @click="$router.push(`/article/${article.id}`)">
              <div v-if="article.cover_image" class="article-card-cover">
                <img :src="article.cover_image" :alt="article.title" />
              </div>
              <div class="article-card-body">
                <h3>{{ article.title }}</h3>
                <p class="article-summary">{{ article.summary }}</p>
                <span class="article-date">{{ article.created_at }}</span>
              </div>
            </div>
          </div>
          <div v-else class="empty-tip">暂无内容</div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, onMounted} from "vue";
import {getCategories, getPublicArticles} from "../../api";
import type {Category, Article} from "../../types";

const categories = ref<Category[]>([]);
const catArticles = ref<Record<number, Article[]>>({});

onMounted(async () => {
  try {
    const catRes = await getCategories();
    categories.value = catRes.data.data;
    for (const cat of categories.value) {
      if (cat.slug === "messages") continue;
      const artRes = await getPublicArticles({category_id: cat.id, pageSize: 4});
      catArticles.value[cat.id] = artRes.data.data.list;
    }
  } catch (e) {
    // ignore
  }
});
</script>

<style scoped>
.home-page {
  min-height: 60vh;
}
.hero-section {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  color: #fff;
  padding: 80px 20px;
  text-align: center;
}
.hero-content h1 {
  font-size: 36px;
  margin-bottom: 16px;
}
.hero-content p {
  font-size: 18px;
  color: #ccc;
}
.category-sections {
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px 20px;
}
.category-section {
  margin-bottom: 40px;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #1a1a2e;
  padding-bottom: 10px;
  margin-bottom: 20px;
}
.section-header h2 {
  font-size: 22px;
  color: #1a1a2e;
}
.more-link {
  color: #0f3460;
  text-decoration: none;
  font-size: 14px;
}
.more-link:hover {
  text-decoration: underline;
}
.article-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}
.article-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.3s;
  overflow: hidden;
}
.article-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
}
.article-card-cover {
  width: 100%;
  height: 180px;
  overflow: hidden;
}
.article-card-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.article-card-body {
  padding: 20px;
}
.article-card-body h3 {
  font-size: 16px;
  margin-bottom: 8px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.article-summary {
  color: #666;
  font-size: 14px;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 10px;
}
.article-date {
  color: #999;
  font-size: 12px;
}
.empty-tip {
  color: #999;
  text-align: center;
  padding: 40px;
  background: #fff;
  border-radius: 8px;
}
</style>
