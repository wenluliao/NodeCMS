import {createRouter, createWebHashHistory} from "vue-router";

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    // Public routes
    {
      path: "/",
      component: () => import("../views/front/Layout.vue"),
      children: [
        {path: "", name: "Home", component: () => import("../views/front/Home.vue")},
        {
          path: "category/:slug",
          name: "CategoryList",
          component: () => import("../views/front/CategoryList.vue"),
        },
        {
          path: "article/:id",
          name: "ArticleDetail",
          component: () => import("../views/front/ArticleDetail.vue"),
        },
        {path: "message", name: "Message", component: () => import("../views/front/Message.vue")},
      ],
    },
    // Admin routes
    {
      path: "/admin/login",
      name: "AdminLogin",
      component: () => import("../views/admin/Login.vue"),
    },
    {
      path: "/admin",
      component: () => import("../views/admin/Layout.vue"),
      meta: {requiresAuth: true},
      children: [
        {path: "", redirect: "/admin/articles"},
        {
          path: "articles",
          name: "AdminArticles",
          component: () => import("../views/admin/Articles.vue"),
        },
        {
          path: "articles/create",
          name: "AdminArticleCreate",
          component: () => import("../views/admin/ArticleEdit.vue"),
        },
        {
          path: "articles/edit/:id",
          name: "AdminArticleEdit",
          component: () => import("../views/admin/ArticleEdit.vue"),
        },
        {
          path: "categories",
          name: "AdminCategories",
          component: () => import("../views/admin/Categories.vue"),
        },
        {
          path: "messages",
          name: "AdminMessages",
          component: () => import("../views/admin/Messages.vue"),
        },
        {
          path: "chats",
          name: "AdminChats",
          component: () => import("../views/admin/Chats.vue"),
        },
      ],
    },
  ],
});

// Navigation guard
router.beforeEach((to, _from, next) => {
  if (to.matched.some((record) => record.meta.requiresAuth)) {
    const token = localStorage.getItem("cms_token");
    if (!token) {
      next({name: "AdminLogin"});
    } else {
      next();
    }
  } else {
    next();
  }
});

export default router;
