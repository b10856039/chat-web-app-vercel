<template>
  <div class="register-page">
    <div class="register-container">
      <div class="return-register">
        <el-icon><Back /></el-icon>
        <a href="/login">返回</a>
      </div>
      <div class="register-header">
        <div>
          <el-icon class="icon-button">
              <Promotion />
          </el-icon>
          <span>聊天作品</span>
        </div>
        <div>
          <h3>註冊</h3>
        </div>
      </div>
      <div class="register-body">
        <div class="step-bar">
          <el-steps style="max-width: 600px" :active="active" finish-status="success">
              <el-step title="Step 1" />
              <el-step title="Step 2" />
              <el-step title="Step 3" />
          </el-steps>
        </div>
        <div class="register-input">
          <div v-if="active == 0" class="input-step">
            <span>
              <label>輸入名稱</label>
              <el-input
                v-model="inputUsername"
                placeholder="輸入使用者名稱"
                required
              />
            </span>
          </div>
          <div v-if="active == 1" class="input-step">
            <span>
              <label>輸入信箱</label>
              <el-input
                v-model="inputEmail"
                placeholder="輸入信箱"
                required
              />
            </span>
            <span>
              <label>輸入手機</label>
              <el-input
                v-model="inputPhone"
                placeholder="輸入手機"
                required
              />
            </span>
          </div>
          <div v-if="active == 2" class="input-step">
            <span>
              <label>輸入密碼</label>
              <el-input
                v-model="inputPassword"
                type="password"
                placeholder="輸入密碼"
                required
                show-password
              />
            </span>
          </div>
          <div v-if="active == 3" class="input-step">
            <span>
              <h4>確定要註冊嗎?</h4>
              <h4>確定後請點擊下一步</h4>
            </span>
          </div>
        </div>
        <div class="register-submit">
          <el-button v-if="active>0" style="margin-top: 12px" @click="preview">上一步</el-button>
          <el-button style="margin-top: 12px" @click="next">下一步</el-button>
        </div>
        <div class="register-message">
          <small>開發測試階段，註冊功能暫不設驗證機制</small>
        </div>
      </div>
    </div>
  </div>


</template>

<script>
  import { ref, onMounted } from "vue";
  import { useRouter } from "vue-router";

  export default {
    name: "register",
    setup() {
      const active = ref(0)
      const inputUsername = ref('');
      const inputEmail = ref('');
      const inputPhone = ref('');
      const inputPassword = ref('');

      const router = useRouter();

      const preview = () => {
        if(active.value-- > 1) active.value -1;
      }
      const next = async () => {

        if(active.value == 0)
        {
          if(inputUsername.value.trim() == ''){
            alert('使用者名稱不可為空')
            return;
          }
        }

        if (active.value == 1)
        {
          let checkStatus = await checkUserAuth();
          if(!checkStatus){
            return;
          }
        }

        if (active.value++ > 2){
          if(inputPassword.value.trim() == '')
          {
            alert('密碼不可為空');
            return;
          }

          active.value = 0
          await UserCreate()
        }
      }


      const checkUserAuth = async () => {
        try {

          if(inputEmail.value.trim() == '' || inputPhone.value.trim() == '')
          {
            alert('手機或信箱不可為空');
            return;
          }
          const baseUrl = "https://chat-web-app-backend-render.onrender.com/api/auth/user";
          // 檢查 email
          let url = new URL(baseUrl);
          url.searchParams.append("query", inputEmail.value);

          let response = await fetch(url, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });
          let data = await response.json();
          if(data.length>0)
          {
            alert('信箱已被使用');
            return false;
          }

          // 檢查 phone（重置 URL）
          data = null;
          url = new URL(baseUrl);
          url.searchParams.append("query", inputPhone.value);

          response = await fetch(url, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });
          data = await response.json();
          if(data.length>0)
          {
            alert('手機已被使用');
            return false;
          }

          return true;

        } catch (error) {
          console.log(error);
        }
      };

      const UserCreate = async () =>{
        try{
          const url = "http://localhost:5266/api/user"
          const response = await fetch(url, {
              method: "POST",
              headers: {
              "Content-Type": "application/json", 
              },
              body:JSON.stringify({
                  "Username": inputUsername.value,
                  "Email": inputEmail.value,
                  "Phone": inputPhone.value,
                  "Password": inputPassword.value
              })
              
          });

        //跳轉至主頁
        router.push("/");

        }catch(error)
        {
            console.log(error)
        }
      }

      // 頁面載入時檢查是否有儲存的 userInputString
      onMounted(() => {

      });

      return {
        inputUsername,
        inputEmail,
        inputPhone,
        inputPassword,
        active,
        next,
        preview,
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

        .input-step span{
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