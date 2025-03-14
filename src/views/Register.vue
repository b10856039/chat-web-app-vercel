<template>
  <div class="register-page">
    <div class="register-container">
      <div class="return-register">
        <el-icon><Back /></el-icon>
        <a href="/login">返回</a>
      </div>
      <div class="register-header">
        <div>
          <el-icon class="icon-button"><Promotion /></el-icon>
          <span>聊天作品</span>
        </div>
        <div>
          <h3>註冊</h3>
        </div>
      </div>

      <div class="register-body" v-loading="loading" element-loading-text="註冊中，請稍候...">
        <div class="step-bar">
          <el-steps style="max-width: 600px" :active="active" finish-status="success">
            <el-step title="Step 1" />
            <el-step title="Step 2" />
            <el-step title="Step 3" />
          </el-steps>
        </div>

        <el-form ref="registerForm" :model="formData" :rules="rules" label-width="100px" class="register-input">
          <div v-if="active == 0" class="input-step">
            <el-form-item label="使用者名稱" prop="username">
              <el-input v-model="formData.username" placeholder="輸入使用者名稱" />
            </el-form-item>
          </div>

          <div v-if="active == 1" class="input-step">
            <el-form-item label="信箱" prop="email">
              <el-input v-model="formData.email" placeholder="輸入信箱" />
            </el-form-item>
            <el-form-item label="手機" prop="phone">
              <el-input v-model="formData.phone" placeholder="輸入手機" />
            </el-form-item>
          </div>

          <div v-if="active == 2" class="input-step">
            <el-form-item label="密碼" prop="password">
              <el-input v-model="formData.password" type="password" placeholder="輸入密碼" show-password />
            </el-form-item>
          </div>

          <div v-if="active == 3" class="input-step">
            <h4>確定要註冊嗎?</h4>
            <h4>確定後請點擊下一步</h4>
          </div>
        </el-form>

        <div class="register-submit">
          <el-button v-if="active > 0" style="margin-top: 12px" @click="preview">上一步</el-button>
          <el-button style="margin-top: 12px" @click="next">下一步</el-button>
        </div>

        <div class="register-message">
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import ExceptMessageHandler from "@/utils/fetchExceptHandler";

export default {
  name: "register",
  setup() {
    const active = ref(0);
    const loading = ref(false);
    const registerForm = ref(null);

    const formData = ref({
      username: "",
      email: "",
      phone: "",
      password: "",
    });

    // 驗證規則
    const rules = {
      username: [
        { required: true, message: "請輸入使用者名稱", trigger: "blur" },
        { 
          pattern: /^[a-zA-Z0-9_.]+$/, 
          message: "使用者名稱只能包含英文、數字、底線 (_) 和句號 (.)", 
          trigger: ["blur", "change"]
        },
      ],
      email: [
        { required: true, message: "請輸入信箱", trigger: "blur" },
        { type: "email", message: "請輸入正確的信箱格式", trigger: ["blur"] },
      ],
      phone: [
        { required: true, message: "請輸入手機", trigger: "blur" },
        { pattern: /^[0-9]{10}$/, message: "手機號碼須為 10 位數字", trigger: "blur" },
      ],
      password: [
        { required: true, message: "請輸入密碼", trigger: "blur" },
        { min: 3, message: "密碼長度至少 3 個字元", trigger: "blur" },
      ],
    };

    const router = useRouter();

    const preview = () => {
      if (active.value > 0) active.value--;
    };

    const next = async () => {
      if (active.value < 3) {
        registerForm.value.validate((valid) => {
          if (valid) {
            active.value++;
          } else {
            ElMessage.error("請修正錯誤後再繼續");
          }
        });
      } else {
        await registerUser();
      }
    };

    const registerUser = async () => {
      try {
        loading.value = true;
        const url = import.meta.env.VITE_API_URL + "auth/register";
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(        {
            Username: formData.value.username,
            ShowUsername: formData.value.username,
            Email: formData.value.email,
            Phone: formData.value.phone,
            Password: formData.value.password,
          }),
        });

        let data = await response.json();
        if(data.errors===null)
        {
          ElMessage.success(data.data);
          router.push('/login');
        }
        else
        {
            ExceptMessageHandler(data.errors);
            active.value = 0;
        }
        
      } catch (error) {
        ElMessage.error(error);
        console.error(error);
      } finally {
        loading.value = false;
      }
    };

    return {
      registerForm,
      formData,
      rules,
      active,
      next,
      preview,
      loading,
    };
  },
};
</script>


<style lang="scss" scoped>



  .register-page {
    height: 100%;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .register-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.5);
    border-radius: 8px;
    background: #fff;
    max-width: 400px; /* 預設最大寬度 */
    width: 100%;


    .return-register{
      display: flex;
      align-self: start;
      color: #007bff;
      justify-content: center;
      align-items: center;
      a{
        text-decoration: none;
        font-weight: bold;
      }

      cursor: pointer;
    }

    .register-header {
      display: flex;
      align-items: center;
      flex-direction: column;
      padding: 10px;

      div{
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

    .register-body {
      width: 100%;

      .step-bar{
        padding: 10px;
        margin-bottom: 20px;
      }

      .register-input {
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 15px;

        .input-step{
          padding: 10px;
        }
      }
      
    }
  }

  /* ============================
     媒體查詢適配 
     ============================ */
  @media (max-width: 768px) {
    .register-container {
      max-width: 90%; /* 減小容器寬度 */
      padding: 15px;

      .register-header {
        span {
          font-size: 24px; /* 縮小標題字體大小 */
        }

        h3 {
          font-size: 18px; /* 縮小副標題字體大小 */
        }
      }
    }
  }

  @media (max-width: 375px) {
    .register-container {
      max-width: 100%; /* 撐滿螢幕寬度 */
      padding: 10px;
    }
  }
</style>