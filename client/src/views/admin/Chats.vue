<template>
  <div class="chat-manage-page">
    <div class="page-header">
      <h2>AI客服记录</h2>
    </div>
    <el-table :data="sessions" stripe v-loading="loading">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="session_id" label="会话ID" width="220" show-overflow-tooltip />
      <el-table-column prop="visitor_name" label="访客" width="80" />
      <el-table-column prop="visitor_ip" label="IP" width="140" show-overflow-tooltip />
      <el-table-column prop="message_count" label="消息数" width="80" />
      <el-table-column prop="created_at" label="开始时间" width="180" />
      <el-table-column prop="updated_at" label="最后活跃" width="180" />
      <el-table-column label="操作" width="140" fixed="right">
        <template #default="{row}">
          <el-button size="small" type="primary" @click="viewSession(row.session_id)">
            查看
          </el-button>
          <el-popconfirm title="确定删除该会话记录？" @confirm="handleDelete(row.session_id)">
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
        @current-change="loadSessions"
        @size-change="loadSessions" />
    </div>

    <!-- Chat detail dialog -->
    <el-dialog v-model="dialogVisible" title="会话详情" width="600px" top="5vh">
      <div class="chat-detail" v-loading="dialogLoading">
        <div v-for="(msg, idx) in chatMessages" :key="idx" class="chat-msg" :class="msg.role">
          <div class="msg-avatar">{{ msg.role === "user" ? "👤" : "🤖" }}</div>
          <div class="msg-content">
            <div class="msg-text">{{ msg.content }}</div>
            <div class="msg-time">{{ msg.created_at }}</div>
          </div>
        </div>
        <div v-if="chatMessages.length === 0 && !dialogLoading" class="empty-chat">暂无消息</div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import {ref, onMounted} from "vue";
import {ElMessage} from "element-plus";
import {getChatSessions, getChatMessages, deleteChatSession} from "../../api";

const sessions = ref<any[]>([]);
const loading = ref(false);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);

const dialogVisible = ref(false);
const dialogLoading = ref(false);
const chatMessages = ref<any[]>([]);

async function loadSessions() {
  loading.value = true;
  try {
    const res = await getChatSessions({page: currentPage.value, pageSize: pageSize.value});
    sessions.value = res.data.data.list;
    total.value = res.data.data.total;
  } catch (e) {
    // handled
  } finally {
    loading.value = false;
  }
}

async function viewSession(sessionId: string) {
  dialogVisible.value = true;
  dialogLoading.value = true;
  chatMessages.value = [];
  try {
    const res = await getChatMessages(sessionId);
    chatMessages.value = res.data.data;
  } catch (e) {
    // handled
  } finally {
    dialogLoading.value = false;
  }
}

async function handleDelete(sessionId: string) {
  try {
    await deleteChatSession(sessionId);
    ElMessage.success("删除成功");
    loadSessions();
  } catch (e) {
    // handled
  }
}

onMounted(loadSessions);
</script>

<style scoped>
.chat-manage-page {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
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
.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
.chat-detail {
  max-height: 500px;
  overflow-y: auto;
  padding: 10px;
  background: #f9f9f9;
  border-radius: 8px;
}
.chat-msg {
  display: flex;
  margin-bottom: 14px;
  align-items: flex-start;
}
.chat-msg.user {
  flex-direction: row-reverse;
}
.msg-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}
.chat-msg.user .msg-avatar {
  background: #e8f4fd;
}
.msg-content {
  max-width: 380px;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
  white-space: pre-wrap;
}
.chat-msg.user .msg-content {
  background: #0f3460;
  color: #fff;
  margin-right: 8px;
  border-top-right-radius: 4px;
}
.chat-msg.assistant .msg-content {
  background: #fff;
  color: #333;
  margin-left: 8px;
  border-top-left-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}
.msg-time {
  font-size: 11px;
  color: #999;
  margin-top: 4px;
  text-align: right;
}
.empty-chat {
  text-align: center;
  padding: 40px;
  color: #999;
}
</style>
