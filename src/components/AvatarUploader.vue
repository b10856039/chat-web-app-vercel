<template>
    <div class="dialog-photoEdit">
        <div class="photoEdit-header">
        <h4>大頭貼設定</h4>
        </div>
        <div class="photo-body">
        <img v-if="propPhotoImg" :src="propPhotoImg" alt="預覽圖片" width="100" height="100" />
        <img v-else :src="defaultImgUrl" alt="預覽圖片" width="100" height="100">
        <el-upload ref="upload" :show-file-list="false" @change="handleFileChange" :before-upload="beforeUpload" action="#">
            <el-button v-if="userPhoto == null">選擇大頭貼</el-button>
        </el-upload>
        </div>
        <div class="photo-submit" v-if="userPhoto!=null">
        <el-button type="primary" @click="resetEditAvatar">重置</el-button>
        <el-button type="primary" v-if="apiUrl!=null" @click="handleChangePhoto">修改</el-button>
        </div>
    </div>
</template>

<script>
import ExceptMessageHandler from "@/utils/fetchExceptHandler";
import { ElMessage } from "element-plus";
import {ref,watch} from "vue";

    export default {
        props:{
            defaultImgUrl : String,
            photoImg : String,
            apiUrl : String
        },
        emits:['userUpdate','AvatarUpdate'],
        setup(props,{emit}){


            const userPhoto = ref(null);  // 用來儲存圖片文件
            const propPhotoImg = ref(props.photoImg);
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

            const handleFileChange = async (file, fileList) => {
                // 用 FileReader 預覽圖片
                const reader = new FileReader();
                reader.onload = (e) => {
                    let base64String = e.target.result;
                    const base64Data = base64String.split(',')[1];  // 拿到單獨的 Base64 部分
                    const mimeType = file.type;  // 獲取圖片類型（例如 image/png 或 image/jpeg）
                    propPhotoImg.value = `data:${mimeType};base64,${base64Data}`;
                };
                userPhoto.value = file.raw;
                reader.readAsDataURL(file.raw);

                if(!props.apiUrl){
                    emit("AvatarUpdate", await resizeAndConvertImage(userPhoto.value));
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

            const handleChangePhoto = async () => {
                try {
                    const editData = {};

                    if (userPhoto.value== null) {
                        return;
                    }
                    const imageUrl = await resizeAndConvertImage(userPhoto.value);
                    editData.PhotoImg = imageUrl;

                    const url = new URL(props.apiUrl);
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
                        editData.value = null;
                        userPhoto.value = null;
                        emit("userUpdate",true);
                    }
                    else
                    {
                        ExceptMessageHandler(data.errors);
                    }
                } catch (error) {
                    console.log(error);
                }
            }

            const resetEditAvatar = () =>{
                userPhoto.value = null;
                propPhotoImg.value = props.photoImg;

                if(!props.apiUrl){
                    emit("AvatarUpdate", userPhoto.value);
                }
            }

            watch(() => props.photoImg, (newVal) => {
                propPhotoImg.value = newVal || ''; // 確保 null 也會觸發變更
            });


            return{
                userPhoto,
                propPhotoImg,
                beforeUpload,
                handleFileChange,
                handleChangePhoto,
                resetEditAvatar
            }
        }
    }

</script>


<style lang="scss" scoped>
    /* 修改大頭貼部分的樣式 */
    .dialog-photoEdit {
        .photo-body {
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .photo-body img {
            border-radius: 50%;
            object-fit: cover;
        }

        .photo-body .el-upload .el-button {
            display: block;
            margin: 10px auto;  // 上下 10px，左右自動置中
        }

        .photo-submit {
            display: flex;
            justify-content: center;
            padding: 0 20px;
        }

        .photo-submit .el-button {
            margin: 10px 5px;
        }
    }
</style>