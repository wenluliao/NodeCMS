<template>
  <div class="message-page">
    <div class="page-banner">
      <h1>在线留言</h1>
      <p>如有法律问题需要咨询，请留言给我们</p>
    </div>
    <div class="message-content">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px" class="message-form">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" placeholder="请输入您的姓名" />
        </el-form-item>
        <el-form-item label="电话" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入您的联系电话" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="form.email" placeholder="请输入您的邮箱（选填）" />
        </el-form-item>
        <el-form-item label="留言内容" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="6"
            placeholder="请输入您要咨询的内容" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">提交留言</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, reactive} from "vue";
import type {FormInstance, FormRules} from "element-plus";
import {ElMessage} from "element-plus";
import {submitMessage} from "../../api";

const formRef = ref<FormInstance>();
const submitting = ref(false);

const form = reactive({
  name: "",
  phone: "",
  email: "",
  content: "",
});

const rules: FormRules = {
  name: [{required: true, message: "请输入姓名", trigger: "blur"}],
  phone: [{required: true, message: "请输入电话", trigger: "blur"}],
  content: [{required: true, message: "请输入留言内容", trigger: "blur"}],
};

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  submitting.value = true;
  try {
    await submitMessage(form);
    ElMessage.success("留言提交成功，我们会尽快与您联系！");
    resetForm();
  } catch (e) {
    // error handled by interceptor
  } finally {
    submitting.value = false;
  }
}

function resetForm() {
  formRef.value?.resetFields();
}
</script>

<style scoped>
.message-page {
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
  margin-bottom: 8px;
}
.page-banner p {
  color: #ccc;
  font-size: 16px;
}
.message-content {
  max-width: 700px;
  margin: 30px auto;
  padding: 0 20px;
}
.message-form {
  background: #fff;
  border-radius: 8px;
  padding: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
</style>
