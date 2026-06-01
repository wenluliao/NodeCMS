<template>
  <div class="login-page">
    <div class="login-card">
      <h2>CMS管理系统</h2>
      <p class="subtitle">后台登录</p>
      <el-form :model="form" :rules="rules" ref="formRef" @keyup.enter="handleLogin">
        <el-form-item prop="username">
          <el-input v-model="form.username" prefix-icon="User" placeholder="用户名" size="large" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            prefix-icon="Lock"
            type="password"
            placeholder="密码"
            size="large"
            show-password />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            @click="handleLogin"
            :loading="loading"
            size="large"
            style="width: 100%">
            登 录
          </el-button>
        </el-form-item>
      </el-form>
      <div class="back-link">
        <router-link to="/">&larr; 返回首页</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, reactive} from "vue";
import {useRouter} from "vue-router";
import type {FormInstance, FormRules} from "element-plus";
import {ElMessage} from "element-plus";
import {login} from "../../api";

const router = useRouter();
const formRef = ref<FormInstance>();
const loading = ref(false);

const form = reactive({username: "", password: ""});

const rules: FormRules = {
  username: [{required: true, message: "请输入用户名", trigger: "blur"}],
  password: [{required: true, message: "请输入密码", trigger: "blur"}],
};

async function handleLogin() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  loading.value = true;
  try {
    const res = await login(form);
    localStorage.setItem("cms_token", res.data.data.token);
    localStorage.setItem("cms_username", res.data.data.username);
    ElMessage.success("登录成功");
    router.push("/admin/articles");
  } catch (e) {
    // handled by interceptor
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
}
.login-card {
  width: 400px;
  background: #fff;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}
.login-card h2 {
  text-align: center;
  font-size: 24px;
  margin-bottom: 4px;
  color: #1a1a2e;
}
.subtitle {
  text-align: center;
  color: #999;
  margin-bottom: 30px;
  font-size: 14px;
}
.back-link {
  text-align: center;
  margin-top: 16px;
}
.back-link a {
  color: #999;
  text-decoration: none;
  font-size: 13px;
}
.back-link a:hover {
  color: #0f3460;
}
</style>
