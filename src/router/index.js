import { createRouter, createWebHistory } from 'vue-router'
import ChatMain from "@/views/ChatMain.vue"
import Login from "@/views/Login.vue"
import Register from '@/views/Register.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'ChatMain',
      component: ChatMain,
      meta: { requiresAuth: true }, // 添加 meta 做為路由驗證 
    },
    {
      path: '/login',
      name: 'login',
      component: Login,
    },
    {
      path: '/register',
      name: 'register',
      component: Register
    }
  ],
})

// 路由前處理
router.beforeEach((to, from, next) => {
  const isAuthenticated = !!localStorage.getItem('token'); //檢查是否已登入
  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ name: 'login' });
  } else {
    next();
  }
});

export default router
