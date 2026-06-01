<template>
  <div class="articles-page">
    <div class="page-header">
      <h2>文章管理</h2>
      <el-button type="primary" @click="$router.push('/admin/articles/create')">新增文章</el-button>
    </div>
    <div class="filter-bar">
      <el-select
        v-model="filter.category_id"
        placeholder="按分类筛选"
        clearable
        @change="loadArticles"
        style="width: 200px">
        <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id" />
      </el-select>
      <el-input
        v-model="filter.keyword"
        placeholder="搜索标题"
        clearable
        @clear="loadArticles"
        @keyup.enter="loadArticles"
        style="width: 240px; margin-left: 12px" />
      <el-button type="primary" @click="loadArticles" style="margin-left: 8px">搜索</el-button>
    </div>
    <el-table :data="articles" stripe v-loading="loading">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
      <el-table-column prop="category_name" label="分类" width="120" />
      <el-table-column label="显示状态" width="100">
        <template #default="{row}">
          <el-switch
            :model-value="row.is_visible === 1"
            @change="handleToggleVisibility(row)"
            active-text="显示"
            inactive-text="隐藏"
            inline-prompt />
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="180" />
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{row}">
          <el-button size="small" @click="$router.push(`/admin/articles/edit/${row.id}`)">
            编辑
          </el-button>
          <el-popconfirm title="确定删除该文章？" @confirm="handleDelete(row.id)">
            <template #reference>
              <el-button size="small" type="danger">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>
    <div class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @current-change="loadArticles"
        @size-change="loadArticles" />
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, reactive, onMounted} from "vue";
import {ElMessage} from "element-plus";
import {getArticles, getCategories, toggleArticleVisibility, deleteArticle} from "../../api";
import type {Article, Category} from "../../types";

const articles = ref<Article[]>([]);
const categories = ref<Category[]>([]);
const loading = ref(false);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);

const filter = reactive({
  category_id: undefined as number | undefined,
  keyword: "",
});

async function loadArticles() {
  loading.value = true;
  try {
    const res = await getArticles({
      category_id: filter.category_id,
      keyword: filter.keyword || undefined,
      page: currentPage.value,
      pageSize: pageSize.value,
    });
    articles.value = res.data.data.list;
    total.value = res.data.data.total;
  } catch (e) {
    // handled
  } finally {
    loading.value = false;
  }
}

async function handleToggleVisibility(article: Article) {
  try {
    await toggleArticleVisibility(article.id);
    ElMessage.success(article.is_visible ? "已隐藏" : "已显示");
    loadArticles();
  } catch (e) {
    // handled
  }
}

async function handleDelete(id: number) {
  try {
    await deleteArticle(id);
    ElMessage.success("删除成功");
    loadArticles();
  } catch (e) {
    // handled
  }
}

onMounted(async () => {
  const catRes = await getCategories();
  categories.value = catRes.data.data;
  loadArticles();
});
</script>

<style scoped>
.articles-page {
  padding: 0;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.page-header h2 {
  font-size: 20px;
  color: #333;
  margin: 0;
}
.filter-bar {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}
.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
