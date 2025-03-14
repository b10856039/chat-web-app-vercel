import { createRouter, createWebHistory } from 'vue-router'
import ChatMain from "@/views/ChatMain.vue"
import Login from "@/views/Login.vue"
import Register from '@/views/Register.vue'
import { jwtDecode } from 'jwt-decode';

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

// 檢查 token 是否有效
function isTokenValid(token) {
  if (!token) return false;
  try {
    const decoded = jwtDecode(token);
    return decoded.exp * 1000 > Date.now(); // 檢查 exp 時間是否已過
  } catch (e) {
    return false;
  }
}

// 路由前置處理
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  const isAuthenticated = isTokenValid(token);

  if (to.meta.requiresAuth && !isAuthenticated) {
    localStorage.removeItem('token'); // 清除過期 token
    next({ name: 'login' });
  } else {
    next();
  }
});

export default router
