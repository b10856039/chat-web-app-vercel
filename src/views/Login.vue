<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-header">
        <div>
          <el-icon class="icon-button">
            <Promotion />
          </el-icon>
          <span>聊天作品</span>
        </div>
        <div>
          <h3>登入</h3>
        </div>
      </div>

      <div class="login-body">
        <!-- el-form -->
        <el-form ref="loginForm" :model="formData" 
            :rules="rules" 
            class="login-input" 
            v-loading="loading" 
            element-loading-text="登入中...">
          <!-- 手機/信箱 -->
          <el-form-item label="手機/信箱" prop="inputString">
            <el-input v-model="formData.inputString" placeholder="輸入手機或信箱" />
          </el-form-item>

          <!-- 密碼 -->
          <el-form-item label="密碼" prop="password">
            <el-input v-model="formData.password" type="password" placeholder="輸入密碼" show-password />
          </el-form-item>

          <!-- 記住我 & 註冊 -->
          <div class="login-option">
            <span>
              <el-checkbox v-model="rememberIsActive">記住我</el-checkbox>
            </span>
            <span>
              <label>想加入?</label>
              <a href="/register">註冊</a>
            </span>
          </div>

          <!-- 登入按鈕 -->
          <div class="login-submit">
            <el-button type="primary" @click="handleLogin">登入</el-button>
          </div>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";

export default {
  name: "login",
  setup() {
    const router = useRouter();
    const loginForm = ref(null);
    const loading = ref(false);

    // 表單數據
    const formData = ref({
      inputString: "",
      password: "",
    });

    // 記住我
    const rememberIsActive = ref(false);

    // 驗證規則
    const rules = {
      inputString: [
        { required: true, message: "請輸入手機或信箱", trigger: "blur" },
        { min: 5, message: "輸入長度至少 5 個字元", trigger: "blur" },
      ],
      password: [
        { required: true, message: "請輸入密碼", trigger: "blur" },
        { min: 4, message: "密碼長度至少 4 個字元", trigger: "blur" },
      ],
    };

    // 登入函式
    const handleLogin = () => {
      loginForm.value.validate(async (valid) => {
        if (!valid) return; // 驗證不通過則中斷

        loading.value = true;

        try {
          const url = new URL(import.meta.env.VITE_API_URL + "auth/login");

          const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              InputString: formData.value.inputString,
              Password: formData.value.password,
            }),
          });

          const data = await response.json();

          if (data.token) {
            localStorage.setItem("token", data.token);

            if (rememberIsActive.value) {
              localStorage.setItem("userInputString", formData.value.inputString);
            } else {
              localStorage.removeItem("userInputString");
            }

            router.push("/");
          } else {
            alert("登入失敗: Token 無效");
          }

          loading.value = false;
        } catch (error) {
          console.error(error);
          alert("登入失敗!");
          loading.value = false;
        }
      });
    };

    // 頁面載入時檢查記住的帳號
    onMounted(() => {
      const savedInput = localStorage.getItem("userInputString");
      if (savedInput) {
        formData.value.inputString = savedInput;
        rememberIsActive.value = true;
      }
    });

    return {
      formData,
      rules,
      loginForm,
      handleLogin,
      rememberIsActive,
      loading
    };
  },
};
</script>


<style lang="scss" scoped>
  .login-page {
    height: 100%;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .login-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.5);
    border-radius: 8px;
    background: #fff;
    max-width: 400px;
    width: 100%;

    .login-header {
      display: flex;
      align-items: center;
      flex-direction: column;
      padding: 10px;

      div {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
      }

      .icon-button {
        font-size: 40px;
      }

      span {
        font-size: 28px;
      }

      h3 {
        font-size: 20px;
      }
    }

    .login-body {
      width: 100%;

      /* el-form-item 樣式 */
      .login-input {
        display: flex;
        flex-direction: column;
        gap: 15px;

        /* 讓 label 保持靠右對齊 */
        ::v-deep(.el-form-item__label) {
          font-size: 14px;
          color: #333;
          width: 100px; /* 確保 label 固定寬度 */
          text-align: right;
          align-items: center;
        }
        

        /* 調整 el-input 樣式 */
        ::v-deep(.el-input__wrapper) {
          height: 38px;
          padding: 5px 10px;
          border-radius: 4px;
        }
      }

      .login-option {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        align-items: center;
        margin-top: 15px;

        span {
          padding: 10px;

          a {
            color: #007bff;
            text-decoration: none;
            font-weight: bold;
            cursor: pointer;
          }

          a:hover {
            text-decoration: underline;
          }
        }
      }

      .login-submit {
        margin-top: 20px;
        display: flex;
        align-items: center;
        justify-content: center;

        .el-button {
          padding: 10px 20px;
          background-color: #007bff;
          color: #fff;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
        }

        .el-button:hover {
          background-color: #0056b3;
        }
      }
    }
  }

  /* ==========================
     響應式設計
     ========================== */
  @media (max-width: 768px) {
    .login-container {
      max-width: 90%;
      padding: 15px;

      .login-header {
        span {
          font-size: 24px;
        }

        h3 {
          font-size: 18px;
        }
      }

      .login-body {
        .login-input {
          ::v-deep(.el-form-item__label) {
            font-size: 12px;
            width: 80px;
          }
        }

        .login-submit {
          .el-button {
            padding: 8px 16px;
            font-size: 14px;
          }
        }
      }
    }
  }

  @media (max-width: 375px) {
    .login-container {
      max-width: 100%;
      padding: 10px;

      .login-body {
        .login-input {
          /* 讓 label 跟輸入框垂直排列 */
          ::v-deep(.el-form-item) {
            flex-direction: column;
            align-items: flex-start;
            width: 100%;
          }

          ::v-deep(.el-form-item__label) {
            width: auto;
            text-align: left;
            margin-bottom: 5px;
          }

          ::v-deep(.el-form-item__content) {
            width: 100%;
          }
        }

        .login-submit {
          .el-button {
            width: 100%;
          }
        }
      }
    }
  }
</style>