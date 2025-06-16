<template>
    <el-avatar v-if="userStore.user.photoImg && userStore.user.photoImg !== ''" :size="50" :src="userStore.user.photoImg" @click="toggleDropdown"/>
    <el-avatar v-else :src="userPlaceholder" :size="50" @click="toggleDropdown"></el-avatar>
  
    <DropDown ref="dropdownElement" trigger="manual" :show-icon="false">
      <template #content>
        <div class="dropdown-header">
          <div class="dropdown-icon">
            <el-avatar v-if="userStore.user.photoImg && userStore.user.photoImg !== ''" :size="50" :src="userStore.user.photoImg"/>
            <el-avatar v-else :src="userPlaceholder" :size="50"></el-avatar>
          </div>
          <div class="dropdown-name">
            <p class="dropdown-showname">{{ userStore.user.showname }}</p>
            <span class="dropdown-username">{{ userStore.user.username }}</span>
          </div>
        </div>
        <div class="dropdown-body">
          <el-dropdown-menu>
            <el-dropdown-item @click="showEditUser = true" icon="edit">
              編輯個人資料
            </el-dropdown-item>
            <el-dropdown-item @click="logout" icon="SwitchButton">
              登出
            </el-dropdown-item>
          </el-dropdown-menu>
        </div>
      </template>
    </DropDown>
  
    <custom-dialog v-model="showEditUser" 
                title="個人設定" 
                dialogType="none" 
                :before-close="resetEditUser"
    >
      <template #content>
        <!-- 大頭貼上傳 -->
        <AvatarUploader :defaultImgUrl="defaultImgUrl" :apiUrl="avatarUploadUrl" :photoImg="editUser.photoImg" @userUpdate="handleEmitData"></AvatarUploader>
  
        <!-- 使用者資訊 -->
        <el-form :model="editUser" :rules="rules" ref="userForm" label-width="80px">
          <div class="dialog-inputEdit">
            <div class="dialog-userInfo">
              <div class="userInfo-header">
                <h4>使用者設定</h4>
                <el-button type="primary" @click="toggleEditUserInfo">
                  {{ isEditingUserInfo ? '關閉' : '編輯' }}
                </el-button>
              </div>
              <div class="userInfo-body">
                <el-form-item label="使用者名稱:" prop="username">
                  <el-input v-model="editUser.username" :disabled="!isEditingUserInfo" placeholder="輸入使用者名稱" required />
                </el-form-item>
                <el-form-item label="顯示名稱:" prop="showname">
                  <el-input v-model="editUser.showname" :disabled="!isEditingUserInfo" placeholder="輸入顯示名稱" required />
                </el-form-item>
                <el-form-item label="電子信箱:" prop="email">
                  <el-input v-model="editUser.email" :disabled="!isEditingUserInfo" placeholder="輸入電子信箱" required />
                </el-form-item>
                <el-form-item label="手機:" prop="phone">
                  <el-input v-model="editUser.phone" :disabled="!isEditingUserInfo" placeholder="輸入手機" required />
                </el-form-item>
              </div>
              <div class="userInfo-submit" v-if="isEditingUserInfo">
                <el-button type="primary" :disabled="!isEditingUserInfo" @click="handleChangeUserSetting">修改</el-button>
              </div>
            </div>
          </div>
        </el-form>
  
        <!-- 密碼設定 -->
        <el-form :model="editUser" :rules="passwordRules" ref="passForm" label-width="80px">
          <div class="dialog-userPassword">
            <div class="userPassword-header">
              <h4>密碼設定</h4>
              <el-button type="primary" @click="toggleEditPassword">
                {{ isEditingPassword ? '關閉' : '編輯' }}
              </el-button>
            </div>
            <div class="userPassword-body">
              <el-form-item label="舊密碼:" prop="oldPassword">
                <el-input v-model="oldPassword" :disabled="!isEditingPassword" placeholder="輸入舊密碼" required />
              </el-form-item>
              <el-form-item label="新密碼:" prop="newPassword">
                <el-input v-model="newPassword" :disabled="!isEditingPassword" placeholder="輸入新密碼" required />
              </el-form-item>
            </div>
            <div class="userPassword-submit" v-if="isEditingPassword">
              <el-button type="primary" @click="handleChangePassword">修改</el-button>
            </div>
          </div>
        </el-form>
      </template>
    </custom-dialog>
  
  </template>


<script>

    import {ref} from 'vue';
    import { useRouter } from 'vue-router'; // 引入 useRouter
    import CustomDialog from "@/components/Dialog.vue";
    import DropDown from "@/components/DropDown.vue";
    import userPlaceholder from '@/assets/user.png';
    import AvatarUploader from './AvatarUploader.vue';

    import { ElMessage } from 'element-plus';
    import ExceptMessageHandler from "@/utils/fetchExceptHandler";

    // 引用store
    import { useUserStore } from '@/stores/userStore'
    import { useRoomStore } from '@/stores/roomStore';
    import { useSignalRStore } from '@/stores/signalrStore';

    export default {
        components:{
            CustomDialog,
            DropDown,
            AvatarUploader
        },
        setup() {

            const userStore = useUserStore();
            const roomStore = useRoomStore();
            const signalRStore = useSignalRStore();

            const showEditUser = ref(false);
            const userForm = ref(null);
            const passForm = ref(null);
            const editUser = ref({ ...userStore.user });
            const oldPassword = ref('');
            const newPassword = ref('');

            const avatarUploadUrl = ref(import.meta.env.VITE_API_URL + "user/" + userStore.user.userId);
            const defaultImgUrl = ref("../assets/user.png");

            const rules = {
                username: [
                    { required: true, message: "請輸入使用者名稱", trigger: "blur" },
                    { 
                    pattern: /^[a-zA-Z0-9_.]+$/, 
                    message: "使用者名稱只能包含英文、數字、底線 (_) 和句號 (.)", 
                    trigger: ["blur", "change"]
                    },
                ],
                showname: [
                    { required: true, message: "請輸入顯示名稱", trigger: "blur" },
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
                
            const passwordRules = {
                oldPassword: [
                    { required: true, message: "請輸入舊密碼", trigger: "blur" },
                ],
                newPassword: [
                    { required: true, message: "請輸入新密碼", trigger: "blur" },
                ],
            };


            

            const isEditingUserInfo = ref(false); // 控制使用者資訊編輯狀態
            const isEditingPassword = ref(false); // 控制密碼設定編輯狀態

            // 讓 "編輯" 按鈕變成 "關閉"
            const toggleEditUserInfo = () => {
                isEditingUserInfo.value = !isEditingUserInfo.value;
            };
            const toggleEditPassword = () => {
                isEditingPassword.value = !isEditingPassword.value;
            };

            
            const handleChangeUserSetting = async () => {
                try {
                    if (!userForm.value) {
                        console.error("表單參考未正確綁定");
                        return;
                    }

                    let userValid = true;
                    // 等待驗證結果
                    await userForm.value.validate((valid) => {
                        if (!valid) {
                            ElMessage.error("請修正錯誤後再繼續");
                            userValid = false;
                            return;
                        }
                    });
                    if(!userValid){
                        return;
                    }

                    // 驗證通過，繼續執行 API 呼叫
                    const editData = {};

                    if (editUser.value.username !== userStore.user.username) {
                        editData.Username = editUser.value.username;
                    }
                    if (editUser.value.showname !== userStore.user.showname) {
                        editData.ShowUsername = editUser.value.showname;
                    }
                    if (editUser.value.email !== userStore.user.email) {
                        editData.Email = editUser.value.email;
                    }
                    if (editUser.value.phone !== userStore.user.phone) {
                        editData.Phone = editUser.value.phone;
                    }

                    const url = new URL(import.meta.env.VITE_API_URL + "user/" + userStore.user.userId);
                    const response = await fetch(url, {
                        method: "PATCH",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify(editData)
                    });

                    const data = await response.json();

                    if(data.errors===null)
                    {
                        ElMessage.success(data.data);
                        isEditingUserInfo.value = false;
                        userStore.refreshUser();
                    }
                    else
                    {
                        ExceptMessageHandler(data.errors);
                    }

                } catch (error) {
                    console.error(error);
                }
            };

            const handleChangePassword = async () => {


                if (!passForm.value) {
                    console.error("表單參考未正確綁定");
                    return;
                }

                let passValid = true;
                // 等待驗證結果
                await passForm.value.validate((valid) => {
                    if (!valid) {
                        ElMessage.error("請修正錯誤後再繼續");
                        passValid = false;
                        return;
                    }
                });
                if(!passValid){
                    return;
                }

                if (!oldPassword.value || !newPassword.value) {
                    alert('請輸入完整的密碼');
                    return;
                }

                const passwordData = {
                    oldPassword: oldPassword.value,
                    newPassword: newPassword.value,
                };

                try {
                    const url = new URL(import.meta.env.VITE_API_URL + "user/" + userStore.user.userId);

                    const response = await fetch(url, {
                        method: "PATCH",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${localStorage.getItem('token')}`,
                        },
                        body: JSON.stringify(passwordData),
                    });
                    
                    const data = await response.json();
                    if(data.errors===null)
                    {
                        ElMessage.success(data.data)
                        // 儲存 token
                        localStorage.setItem("token", data.data.token);
                        await logout();
                    }
                    else
                    {
                        ExceptMessageHandler(data.errors);
                    }

                } catch (error) {
                    console.error(error);
                }
            }

            const handleEmitData = (value) => {
                userStore.refreshUser();
            }

            const dropdownElement = ref(null); 
            const toggleDropdown = () =>{
                if (dropdownElement.value) {
                    dropdownElement.value.handleOpen();
                }
            }

            const resetEditUser = (closeType = null) => {
                if(closeType == 1){
                    oldPassword.value = '';
                    newPassword.value = '';
                }
                else{
                    editUser.value = { ...userStore.user };
                    oldPassword.value = '';
                    newPassword.value = '';
                    showEditUser.value = false;
                    isEditingUserInfo.value = false;
                    isEditingPassword.value = false;
                }

            };

            const router = useRouter(); // 使用 useRouter 獲取路由器對象
            const logout = async () =>{
                // 清除 localStorage 中的 token
                localStorage.removeItem('token');
                
                await signalRStore.reset(); // 確保 SignalR 關閉
                userStore.reset();
                roomStore.reset();

                router.push('/login');
            }


            return {
                userStore,
                userPlaceholder,
                logout,
                dropdownElement,
                toggleDropdown,

                showEditUser,
                avatarUploadUrl,
                defaultImgUrl,
                userForm,
                passForm,
                editUser,
                oldPassword,
                newPassword,
                rules,
                passwordRules,
                handleChangeUserSetting,
                handleChangePassword,
                resetEditUser,
                handleEmitData,

                toggleEditUserInfo,
                toggleEditPassword,
                isEditingUserInfo,
                isEditingPassword,
            }
        }
    }
</script>


<style lang="scss" scoped>
    /* 整體下拉選單樣式 */
    .dropdown-header {
        display: flex;
        justify-content: flex-start; /* Align items to the left */
        align-items: center;
        padding: 10px;
        border-bottom: 1px solid #5e5e5e;
        width: 200px; /* Set a fixed width for the dropdown */
    }

    /* 大頭貼容器 */
    .dropdown-icon {
        margin-right: 10px; /* Add some space between avatar and text */
    }

    /* 使用者名稱區塊 */
    .dropdown-name {
        display: flex;
        flex-direction: column;
        justify-content: center;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }

    /* 顯示名稱 */
    .dropdown-showname {
        font-size: 16px;
        color: #333; /* Darker text color for showname */
        margin: 0;
        padding: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    /* 使用者名稱 */
    .dropdown-username {
        font-size: 12px;
        color: #5e5e5e;
        margin: 0;
        padding: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    /* 下拉選單內容區域 */
    .dropdown-body {
        padding: 5px 10px;
    }

    /* 下拉選單項目 */
    .el-dropdown-item {
        font-size: 14px;
        padding: 10px 15px;
        transition: background-color 0.2s ease; /* Smooth transition effect */
    }

    /* 當鼠標懸停時，改變下拉項目的背景顏色 */
    .el-dropdown-item:hover {
        background-color: #f5f5f5;
    }

    /* 使用者資料編輯區塊 */
    .dialog-userInfo {
        padding: 15px;
        border-top: 1px solid #e8e8e8;
    }

    /* 使用者名稱與顯示名稱編輯區 */
    .userInfo-header {
        display: flex;
        align-items: center;
        margin-bottom: 15px;
    }

    /* 編輯按鈕 */
    .userInfo-header .el-button {
        font-size: 14px;
    }

    /* 表單項目標籤樣式 */
    .el-form-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
    }

    ::v-deep(.el-form-item__label){
        white-space: nowrap;  /* 防止換行 */
    }

    .el-form-item__content {
        flex-grow: 1; /* 讓內容部分自適應 */
    }

    /* 表單的輸入框樣式 */
    .el-input {
        font-size: 14px;
    }

    /* 密碼設定部分 */
    .dialog-userPassword {
        padding: 15px;
        border-top: 1px solid #e8e8e8;
    }

    .userPassword-header {
        display: flex;
        align-items: center;
        margin-bottom: 15px;
    }

    .userPassword-body {
        margin-bottom: 10px;
    }

    /* 密碼框的樣式 */
    .el-input {
        font-size: 14px;
    }

    /* 按鈕樣式 */
    .userPassword-submit {
        display: flex;
        margin-top: 10px;
    }

    /* 增加表單按鈕的邊距 */
    .el-button {
        margin-left: 10px;
    }
</style>