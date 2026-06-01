<template>
  <div class="article-edit-page">
    <div class="page-header">
      <h2>{{ isEdit ? "编辑文章" : "新增文章" }}</h2>
      <el-button @click="$router.back()">返回</el-button>
    </div>
    <el-form :model="form" :rules="rules" ref="formRef" label-width="100px" v-loading="loading">
      <el-form-item label="所属分类" prop="category_id">
        <el-select v-model="form.category_id" placeholder="请选择分类" style="width: 100%">
          <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="文章标题" prop="title">
        <el-input v-model="form.title" placeholder="请输入文章标题" />
      </el-form-item>
      <el-form-item label="文章摘要">
        <el-input
          v-model="form.summary"
          type="textarea"
          :rows="3"
          placeholder="请输入文章摘要（选填）" />
      </el-form-item>
      <el-form-item label="文章内容" prop="content">
        <div class="editor-wrapper">
          <Toolbar
            :editor="editorRef"
            :defaultConfig="toolbarConfig"
            style="border-bottom: 1px solid #ccc" />
          <Editor
            v-model="form.content"
            :defaultConfig="editorConfig"
            style="height: 450px; overflow-y: hidden"
            @onCreated="handleEditorCreated" />
        </div>
      </el-form-item>
      <el-form-item label="封面图片">
        <div v-if="form.cover_image" class="cover-preview">
          <img :src="form.cover_image" alt="封面" />
          <el-button
            class="remove-btn"
            type="danger"
            size="small"
            circle
            @click="form.cover_image = ''">
            ×
          </el-button>
        </div>
        <el-upload :show-file-list="false" :http-request="handleUpload" accept="image/*">
          <el-button size="small" type="primary">上传封面</el-button>
        </el-upload>
        <el-input
          v-model="form.cover_image"
          placeholder="或手动输入图片URL"
          style="margin-top: 8px" />
      </el-form-item>
      <el-form-item label="是否显示">
        <el-switch
          v-model="form.is_visible"
          :active-value="1"
          :inactive-value="0"
          active-text="显示"
          inactive-text="隐藏" />
      </el-form-item>
      <el-form-item label="排序">
        <el-input-number v-model="form.sort_order" :min="0" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">保存</el-button>
        <el-button @click="$router.back()">取消</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import {ref, reactive, onMounted, onBeforeUnmount, computed, shallowRef} from "vue";
import {useRoute, useRouter} from "vue-router";
import type {FormInstance, FormRules} from "element-plus";
import {ElMessage} from "element-plus";
import {getArticle, createArticle, updateArticle, getCategories, uploadFile} from "../../api";
import type {Category} from "../../types";
import {Editor, Toolbar} from "@wangeditor/editor-for-vue";
import type {IDomEditor, IEditorConfig, IToolbarConfig} from "@wangeditor/editor";
import "@wangeditor/editor/dist/css/style.css";

const route = useRoute();
const router = useRouter();
const formRef = ref<FormInstance>();
const loading = ref(false);
const submitting = ref(false);
const categories = ref<Category[]>([]);

// Rich text editor
const editorRef = shallowRef<IDomEditor>();

const toolbarConfig: Partial<IToolbarConfig> = {
  excludeKeys: [
    "group-video", // disable video if not needed
  ],
};

const editorConfig: Partial<IEditorConfig> = {
  placeholder: "请输入文章内容...",
  MENU_CONF: {
    uploadImage: {
      // Custom upload for images in the rich text editor
      async customUpload(file: File, insertFn: (url: string, alt?: string, href?: string) => void) {
        try {
          const res = await uploadFile(file);
          const url = res.data.data.url;
          insertFn(url, file.name, url);
        } catch (e) {
          ElMessage.error("图片上传失败");
        }
      },
    },
    insertImage: {
      onInsertedImage(imageNode: any) {
        // Called after image is inserted
      },
    },
  },
};

function handleEditorCreated(editor: IDomEditor) {
  editorRef.value = editor;
}

const isEdit = computed(() => !!route.params.id);

const form = reactive({
  category_id: undefined as number | undefined,
  title: "",
  summary: "",
  content: "",
  cover_image: "",
  is_visible: 1,
  sort_order: 0,
});

const rules: FormRules = {
  category_id: [{required: true, message: "请选择分类", trigger: "change"}],
  title: [{required: true, message: "请输入标题", trigger: "blur"}],
  content: [{required: true, message: "请输入内容", trigger: "blur"}],
};

async function handleUpload(options: any) {
  try {
    const res = await uploadFile(options.file);
    form.cover_image = res.data.data.url;
    ElMessage.success("上传成功");
  } catch (e) {
    // handled
  }
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  submitting.value = true;
  try {
    if (isEdit.value) {
      await updateArticle(Number(route.params.id), form);
      ElMessage.success("更新成功");
    } else {
      await createArticle(form);
      ElMessage.success("创建成功");
    }
    router.push("/admin/articles");
  } catch (e) {
    // handled
  } finally {
    submitting.value = false;
  }
}

onMounted(async () => {
  const catRes = await getCategories();
  categories.value = catRes.data.data;

  if (isEdit.value) {
    loading.value = true;
    try {
      const res = await getArticle(Number(route.params.id));
      const a = res.data.data;
      form.category_id = a.category_id;
      form.title = a.title;
      form.summary = a.summary;
      form.content = a.content;
      form.cover_image = a.cover_image;
      form.is_visible = a.is_visible;
      form.sort_order = a.sort_order;
    } catch (e) {
      // handled
    } finally {
      loading.value = false;
    }
  }
});

// Destroy editor on component unmount to avoid memory leaks
onBeforeUnmount(() => {
  const editor = editorRef.value;
  if (editor == null) return;
  editor.destroy();
});
</script>

<style scoped>
.article-edit-page {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.page-header h2 {
  font-size: 20px;
  color: #333;
  margin: 0;
}
.editor-wrapper {
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 100%;
  z-index: 100;
}
.cover-preview {
  position: relative;
  display: inline-block;
  margin-bottom: 10px;
}
.cover-preview img {
  max-width: 300px;
  max-height: 200px;
  border-radius: 6px;
  border: 1px solid #eee;
}
.remove-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px !important;
  height: 24px !important;
  padding: 0 !important;
  font-size: 14px;
}
</style>
