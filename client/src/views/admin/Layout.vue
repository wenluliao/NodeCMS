<template>
  <el-container class="admin-layout">
    <el-aside width="220px" class="admin-aside">
      <div class="aside-logo">CMS管理</div>
      <el-menu
        :default-active="activeMenu"
        router
        background-color="#1a1a2e"
        text-color="#ccc"
        active-text-color="#fff">
        <el-menu-item index="/admin/articles">
          <span>文章管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/categories">
          <span>分类管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/messages">
          <span>留言管理</span>
          <el-badge v-if="unreadCount > 0" :value="unreadCount" class="unread-badge" />
        </el-menu-item>
        <el-menu-item index="/admin/chats">
          <span>AI客服记录</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="admin-header">
        <div class="header-right">
          <span class="username">{{ username }}</span>
          <el-button text @click="handleLogout">退出登录</el-button>
          <router-link to="/" class="front-link">前台首页</router-link>
        </div>
      </el-header>
      <el-main class="admin-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import {ref, computed, onMounted} from "vue";
import {useRoute, useRouter} from "vue-router";
import {getUnreadCount} from "../../api";

const route = useRoute();
const router = useRouter();
const username = ref(localStorage.getItem("cms_username") || "admin");
const unreadCount = ref(0);

const activeMenu = computed(() => {
  const path = route.path;
  if (path.startsWith("/admin/articles")) return "/admin/articles";
  if (path.startsWith("/admin/categories")) return "/admin/categories";
  if (path.startsWith("/admin/messages")) return "/admin/messages";
  if (path.startsWith("/admin/chats")) return "/admin/chats";
  return "/admin/articles";
});

function handleLogout() {
  localStorage.removeItem("cms_token");
  localStorage.removeItem("cms_username");
  router.push("/admin/login");
}

onMounted(async () => {
  try {
    const res = await getUnreadCount();
    unreadCount.value = res.data.data.count;
  } catch (e) {
    // ignore
  }
});
</script>

<style scoped>
.admin-layout {
  min-height: 100vh;
}
.admin-aside {
  background: #1a1a2e;
  overflow-y: auto;
}
.aside-logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  letter-spacing: 2px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
.admin-header {
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  border-bottom: 1px solid #eee;
  padding: 0 20px;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}
.username {
  color: #666;
  font-size: 14px;
}
.front-link {
  color: #409eff;
  text-decoration: none;
  font-size: 13px;
}
.admin-main {
  background: #f5f5f5;
}
.unread-badge {
  margin-left: 8px;
}
</style>
