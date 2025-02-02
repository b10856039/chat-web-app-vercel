<template>
    <img
    v-if="user.photoImg && user.photoImg !== ''"
    :src="user.photoImg"
    @click="toggleDropdown"
    class="user-icon"
    />
    <img
    v-else
    src="../assets/user.png"
    @click="toggleDropdown"
    class="user-icon"
    />
    <DropDown ref="dropdownElement" trigger="manual" :show-icon="false">
        
        <template #content>
            <span class="dropdown-username">{{ user.username }}</span>
            <el-dropdown-menu>
            <el-dropdown-item @click="showEditUser = true" icon="edit">
                編輯個人資料
            </el-dropdown-item>
            <el-dropdown-item @click="logout" icon="SwitchButton">
                登出
            </el-dropdown-item>
            </el-dropdown-menu>
        </template>
    </DropDown>

    <custom-dialog
        v-model="showEditUser"
        title="個人設定"
        dialogType = "none"
        :before-close="resetEditUser"
    >
        <template #content>
            <!-- 大頭貼上傳 -->
            <div class="dialog-photoEdit">
                <div class="photoEdit-header">
                    <h4>大頭貼設定</h4>
                </div>
                <div class="photo-body">
                    <img v-if="editUser.photoImg && editUser.photoImg !== ''" :src="editUser.photoImg" alt="預覽圖片" width="100" height="100" />
                    <img v-else src="../assets/user.png" alt="預覽圖片" width="100" height="100">
                    <el-upload
                        ref="upload"
                        :show-file-list="false"
                        @change="handleFileChange"
                        :before-upload="beforeUpload"
                        action="#"
                    >
                        <el-button>選擇大頭貼</el-button>
                    </el-upload>
                </div>
                <div class="photo-submit">
                    <el-button type="primary" @click="resetEditUser(1)">重置</el-button>
                    <el-button type="primary" @click="handleChangePhoto">修改</el-button>
                </div>
            </div>
            <div class="dialog-inputEdit">
                <div class="dialog-userInfo">
                    <div class="userInfo-header">
                        <h4>使用者設定</h4>
                    </div>
                    <div class="userInfo-body">
                        <span>
                            <label>使用者名稱:</label>
                            <el-input
                            v-model="editUser.username"
                            placeholder="輸入使用者名稱"
                            required
                            />
                        </span>
                        <span>
                            <label>電子信箱:</label>
                            <el-input
                            v-model="editUser.email"
                            placeholder="輸入電子信箱"
                            required
                            />
                        </span>
                        <span>
                            <label>手機:</label>
                            <el-input
                            v-model="editUser.phone"
                            placeholder="輸入手機"
                            required
                            />
                        </span>
                    </div>
                    <div class="userInfo-submit">
                        <el-button type="primary" @click="handleChangeUserSetting">修改</el-button>
                    </div>
                </div>
                <div class="dialog-userPassword">
                    <div class="userPassword-header">
                        <h4>密碼設定</h4>
                    </div>
                    <div class="userPasswrod-body">
                        <span>
                            <label>舊密碼:</label>
                            <el-input
                            v-model="oldPassword"
                            placeholder="輸入手機"
                            required
                            />
                        </span>
                        <span>
                            <label>新密碼:</label>
                            <el-input
                            v-model="newPassword"
                            placeholder="輸入新密碼"
                            required
                            />
                        </span>
                    </div>
                    <div class="userPassword-submit">
                        <el-button type="primary" @click="handleChangePassword">修改</el-button>
                    </div>
                </div>
            </div>
        </template>
    </custom-dialog>

</template>


<script>

    import {ref} from 'vue';
    import { useRouter } from 'vue-router'; // 引入 useRouter
    import CustomDialog from "@/components/Dialog.vue";
    import DropDown from "@/components/DropDown.vue";

    export default {
        components:{
            CustomDialog,
            DropDown
        },
        props:{
            user : Object
        },
        emits: ['userUpdate'],
        setup(props,{emit}) {

            const showEditUser = ref(false);
            const editUser = ref({ ...props.user });

            const userPhoto = ref(null);  // 用來儲存圖片文件

            const beforeUpload = (file) => {
                const fileType = file.type.split('/')[1]; // 取得檔案類型
                if (['jpeg', 'jpg', 'png'].includes(fileType)) {
                    return true;
                    // if (file.size <= 5 * 1024 * 1024) {  // 最大 5MB
                    //     return true;
                    // } else {
                    //     alert('圖片大小不能超過 5MB');
                    //     return false;
                    // }
                } else {
                    alert('僅支持 JPG 或 PNG 格式的圖片');
                    return false;
                }
            };

            const handleFileChange = (file, fileList) => {
                // 用 FileReader 預覽圖片
                const reader = new FileReader();
                reader.onload = (e) => {
                    let base64String = e.target.result;
                    const base64Data = base64String.split(',')[1];  // 拿到單獨的 Base64 部分
                    const mimeType = file.type;  // 獲取圖片類型（例如 image/png 或 image/jpeg）
                    editUser.value.photoImg = `data:${mimeType};base64,${base64Data}`;
                };
                reader.readAsDataURL(file.raw);
                userPhoto.value = file.raw;
            };

            const handleChangePhoto = async () => {
                try {
                    const editData = {};

                    if (userPhoto.value) {
                        const imageUrl = await resizeAndConvertImage(userPhoto.value);
                        editData.PhotoImg = imageUrl;
                    }

                    const url = new URL("https://chat-web-app-backend-render.onrender.com/api/user/" + props.user.userId);
                    // const url = new URL("http://localhost:5266/api/user/" + props.user.userId);
                    const response = await fetch(url, {
                        method: "PATCH",
                        headers: {
                            "Content-Type": "application/json", 
                            "Authorization": `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify(editData)
                    });

                    const data = await response.json();
                    if (data.token) {
                        // 儲存 token
                        localStorage.setItem("token", data.token);
                    }
                    emit("userUpdate",true);
                } catch (error) {
                    console.log(error);
                }
            }

            const oldPassword = ref('');
            const newPassword = ref('');
            const handleChangePassword = async () => {
                if (!oldPassword.value || !newPassword.value) {
                    alert('請輸入完整的密碼');
                    return;
                }

                const passwordData = {
                    oldPassword: oldPassword.value,
                    newPassword: newPassword.value,
                };

                try {
                    const url = new URL("https://chat-web-app-backend-render.onrender.com/api/user/" + props.user.userId);
                    // const url = new URL("http://localhost:5266/api/user/"  + props.user.userId);
                    const response = await fetch(url, {
                        method: "PATCH",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${localStorage.getItem('token')}`,
                        },
                        body: JSON.stringify(passwordData),
                    });
                    
                    const data = await response.json();
                    console.log(data)
                    if (data.token) {
                        // 儲存 token
                        localStorage.setItem("token", data.token);
                        await logout();
                    }
                } catch (error) {
                    console.error(error);
                }
            }

            const handleChangeUserSetting = async () => {
                try {
                    const editData = {};
                    if (editUser.value.username !== props.user.username) {
                        editData.Username = editUser.value.username;
                    }

                    if (editUser.value.email !== props.user.email) {
                        editData.Email = editUser.value.email;
                    }

                    if (editUser.value.phone !== props.user.phone) {
                        editData.Phone = editUser.value.phone;
                    }
                    const url = new URL("https://chat-web-app-backend-render.onrender.com/api/user/" + props.user.userId);
                    // const url = new URL("http://localhost:5266/api/user/" + props.user.userId);
                    const response = await fetch(url, {
                        method: "PATCH",
                        headers: {
                            "Content-Type": "application/json", 
                            "Authorization": `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify(editData)
                    });

                    const data = await response.json();

                    if (data.token) {
                        // 儲存 token
                        localStorage.setItem("token", data.token);
                    }

                    emit("userUpdate",true);
                } catch (error) {
                    console.log(error);
                }
            };

            // 調整圖片大小至 128x128
            const resizeAndConvertImage = (file) => {
                return new Promise((resolve, reject) => {
                    const img = new Image();
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        img.src = e.target.result;
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(file);

                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        canvas.width = 128;
                        canvas.height = 128;
                        ctx.drawImage(img, 0, 0, 128, 128);
                        const resizedImage = canvas.toDataURL(file.type);
                        resolve(resizedImage);
                    };
                });
            };

            const dropdownElement = ref(null); 
            const toggleDropdown = () =>{
                if (dropdownElement.value) {
                    dropdownElement.value.handleOpen();
                }
            }

            const resetEditUser = (closeType = null) => {
                if(closeType == 1){
                    editUser.value = { ...props.user };
                }
                else if(closeType == 2){
                    oldPassword.value = '';
                    newPassword.value = '';
                }
                else{
                    editUser.value = { ...props.user };
                    oldPassword.value = '';
                    newPassword.value = '';
                    showEditUser.value = false;
                }

            };

            const router = useRouter(); // 使用 useRouter 獲取路由器對象
            const logout = async () =>{
                // 清除 localStorage 中的 token
                localStorage.removeItem('token');
                props.user.value = null;
                router.push('/login');
            }


            return {
                logout,
                dropdownElement,
                toggleDropdown,

                showEditUser,
                editUser,
                userPhoto,
                beforeUpload,
                handleFileChange,
                handleChangePhoto,
                handleChangeUserSetting,
                oldPassword,
                newPassword,
                handleChangePassword,
                resetEditUser,
            }
        }
    }
</script>


<style lang="scss" scoped>
    .user-icon {
        width: 100%; /* 填滿父容器 */
        height: 100%; /* 自適應 */
        object-fit: cover; /*使圖片不變形 */
        display: block; 
        margin: 0; 
        padding: 0; 
    }

    .dropdown-username{
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 16px;
    }

</style>