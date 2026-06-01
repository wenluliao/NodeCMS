<template>
  <div class="categories-page">
    <div class="page-header">
      <h2>分类管理</h2>
      <el-button type="primary" @click="showAddDialog">新增分类</el-button>
    </div>
    <el-table :data="categories" stripe v-loading="loading">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="name" label="分类名称" width="200" />
      <el-table-column prop="slug" label="标识(slug)" width="180" />
      <el-table-column prop="sort_order" label="排序" width="80" />
      <el-table-column prop="created_at" label="创建时间" width="180" />
      <el-table-column label="操作" width="160">
        <template #default="{row}">
          <el-button size="small" @click="showEditDialog(row)">编辑</el-button>
          <el-popconfirm
            title="删除分类会同时删除其下所有文章，确定删除？"
            @confirm="handleDelete(row.id)">
            <template #reference>
              <el-button size="small" type="danger">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="isEditing ? '编辑分类' : '新增分类'" width="450px">
      <el-form :model="dialogForm" :rules="dialogRules" ref="dialogFormRef" label-width="90px">
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="dialogForm.name" placeholder="如：关于我们" />
        </el-form-item>
        <el-form-item label="标识(slug)" prop="slug">
          <el-input v-model="dialogForm.slug" placeholder="如：about（英文，用于URL）" />
        </el-form-item>
        <el-form-item label="排序" prop="sort_order">
          <el-input-number v-model="dialogForm.sort_order" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleDialogSubmit" :loading="dialogSubmitting">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import {ref, reactive, onMounted} from "vue";
import type {FormInstance, FormRules} from "element-plus";
import {ElMessage} from "element-plus";
import {getCategories, createCategory, updateCategory, deleteCategory} from "../../api";
import type {Category} from "../../types";

const categories = ref<Category[]>([]);
const loading = ref(false);
const dialogVisible = ref(false);
const isEditing = ref(false);
const editingId = ref<number | null>(null);
const dialogSubmitting = ref(false);
const dialogFormRef = ref<FormInstance>();

const dialogForm = reactive({name: "", slug: "", sort_order: 0});

const dialogRules: FormRules = {
  name: [{required: true, message: "请输入分类名称", trigger: "blur"}],
  slug: [
    {required: true, message: "请输入标识", trigger: "blur"},
    {pattern: /^[a-zA-Z0-9_-]+$/, message: "标识只能包含字母、数字、下划线和横线", trigger: "blur"},
  ],
};

async function loadCategories() {
  loading.value = true;
  try {
    const res = await getCategories();
    categories.value = res.data.data;
  } catch (e) {
    // handled
  } finally {
    loading.value = false;
  }
}

function showAddDialog() {
  isEditing.value = false;
  editingId.value = null;
  dialogForm.name = "";
  dialogForm.slug = "";
  dialogForm.sort_order = 0;
  dialogVisible.value = true;
}

function showEditDialog(cat: Category) {
  isEditing.value = true;
  editingId.value = cat.id;
  dialogForm.name = cat.name;
  dialogForm.slug = cat.slug;
  dialogForm.sort_order = cat.sort_order;
  dialogVisible.value = true;
}

async function handleDialogSubmit() {
  const valid = await dialogFormRef.value?.validate().catch(() => false);
  if (!valid) return;

  dialogSubmitting.value = true;
  try {
    if (isEditing.value && editingId.value) {
      await updateCategory(editingId.value, dialogForm);
      ElMessage.success("更新成功");
    } else {
      await createCategory(dialogForm);
      ElMessage.success("创建成功");
    }
    dialogVisible.value = false;
    loadCategories();
  } catch (e) {
    // handled
  } finally {
    dialogSubmitting.value = false;
  }
}

async function handleDelete(id: number) {
  try {
    await deleteCategory(id);
    ElMessage.success("删除成功");
    loadCategories();
  } catch (e) {
    // handled
  }
}

onMounted(loadCategories);
</script>

<style scoped>
.categories-page {
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
</style>
