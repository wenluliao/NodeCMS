<template>
  <div class="messages-page">
    <div class="page-header">
      <h2>留言管理</h2>
      <div>
        <el-button @click="handleMarkAllRead" :disabled="!hasUnread">全部标为已读</el-button>
        <el-select
          v-model="filter.is_read"
          placeholder="筛选状态"
          clearable
          @change="loadMessages"
          style="width: 140px; margin-left: 8px">
          <el-option label="未读" :value="0" />
          <el-option label="已读" :value="1" />
        </el-select>
      </div>
    </div>
    <el-table :data="messages" stripe v-loading="loading">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="name" label="姓名" width="100" />
      <el-table-column prop="phone" label="电话" width="140" />
      <el-table-column prop="email" label="邮箱" width="180" show-overflow-tooltip />
      <el-table-column prop="content" label="留言内容" min-width="250" show-overflow-tooltip />
      <el-table-column label="状态" width="80">
        <template #default="{row}">
          <el-tag :type="row.is_read ? 'info' : 'danger'" size="small">
            {{ row.is_read ? "已读" : "未读" }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="时间" width="180" />
      <el-table-column label="操作" width="140" fixed="right">
        <template #default="{row}">
          <el-button v-if="!row.is_read" size="small" @click="handleMarkRead(row.id)">
            标为已读
          </el-button>
          <el-popconfirm title="确定删除该留言？" @confirm="handleDelete(row.id)">
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
        @current-change="loadMessages"
        @size-change="loadMessages" />
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, reactive, onMounted, computed} from "vue";
import {ElMessage} from "element-plus";
import {getMessages, markMessageRead, markAllMessagesRead, deleteMessage} from "../../api";
import type {Message} from "../../types";

const messages = ref<Message[]>([]);
const loading = ref(false);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);

const filter = reactive({
  is_read: undefined as number | undefined,
});

const hasUnread = computed(() => messages.value.some((m) => !m.is_read));

async function loadMessages() {
  loading.value = true;
  try {
    const res = await getMessages({
      is_read: filter.is_read,
      page: currentPage.value,
      pageSize: pageSize.value,
    });
    messages.value = res.data.data.list;
    total.value = res.data.data.total;
  } catch (e) {
    // handled
  } finally {
    loading.value = false;
  }
}

async function handleMarkRead(id: number) {
  try {
    await markMessageRead(id);
    ElMessage.success("已标记为已读");
    loadMessages();
  } catch (e) {
    // handled
  }
}

async function handleMarkAllRead() {
  try {
    await markAllMessagesRead();
    ElMessage.success("全部标记为已读");
    loadMessages();
  } catch (e) {
    // handled
  }
}

async function handleDelete(id: number) {
  try {
    await deleteMessage(id);
    ElMessage.success("删除成功");
    loadMessages();
  } catch (e) {
    // handled
  }
}

onMounted(loadMessages);
</script>

<style scoped>
.messages-page {
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
</style>
