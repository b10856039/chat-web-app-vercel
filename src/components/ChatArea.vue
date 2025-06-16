<template>
    <div v-if="!roomStore.currentChat" class="no-data">
        <p>開始聊天吧!</p>
    </div>
    <div v-else class="chat-area">
        <div class="chat-header">
            <div class="header-leave" v-on:click="leaveChatroom">
                <el-icon>
                    <Back />
                </el-icon>
            </div>
            <div class="header-roomname">
                <h3>{{ roomStore.currentChat.roomname }}</h3>
            </div>
        </div>
        <div class="chat-message" ref="messageContainer">
            <div
                v-if="messages.length > 0"
                v-for="(message, index) in messages"
                :key="message.Id"
                :class="{'my-message': message.isMine, 'other-message': !message.isMine}"
            >

                <div v-if="shouldShowDate(index, message)" class="message-date">
                    {{ formatDateTime(message.sentAt, 3) }}
                </div>
                <div class="message-data">
                    <div class="message-header">
                        <img v-if="message.senderPhotoImg !== ''" :src="getImageType(message.senderPhotoImg)">
                        <img v-else src="../assets/user.png">
                    </div>
                    <div class="message-container">
                        <div class="message-senderName">
                            <small>{{ message.senderName }}</small>
                        </div>
                        <div class="message-content">
                            <p>{{ message.content }}</p>
                        </div>
                    </div>
                    <div class="message-sentAt">
                        <small>{{ formatDateTime(message.sentAt,1) }}</small>
                    </div>
                </div>
            </div>
            <div v-else class="chat-message-none">
                <div>開始聊天吧!</div>
            </div>
        </div>
        <div class="chat-input">
            <div class="input-wrapper">
                <el-input
                    v-model="newMessage"
                    autosize
                    type="textarea"
                    placeholder="請輸入訊息"
                    resize="none"
                    @keydown.enter="sendMessage"
                    v-loading="loading"
                />
                <button @click="sendMessage">
                    <el-icon>
                        <Search />
                    </el-icon>
                </button>
            </div>
        </div>

    </div>
</template>

<script>
// chatarea.vue

import { ref, watch, onMounted,nextTick } from 'vue'
import formatDateTime from "@/utils/dateFormatter";
import ExceptMessageHandler from "@/utils/fetchExceptHandler";
import { ElMessage } from "element-plus";

import { useUserStore } from '@/stores/userStore';
import { useRoomStore } from '@/stores/roomStore';
import { useSignalRStore } from '@/stores/signalrStore';

export default {
    setup() {
        const userStore = useUserStore();
        const roomStore = useRoomStore();
        const signalrStore = useSignalRStore();

        const newMessage = ref('');
        const messages = ref([]);
        const errorMessages = ref("");
        const loading = ref(false);
        const isSending = ref(false);
        const messageContainer = ref(null);

        const shouldShowDate = (index, message) => {
            if (index === 0) return true;
            const prevMessage = messages.value[index - 1];
            return formatDateTime(prevMessage.sentAt, 3) !== formatDateTime(message.sentAt, 3);
        };

        const getHistoryMessages = async (newChat) => {
            try {
                const url = new URL(import.meta.env.VITE_API_URL + "message");
                url.searchParams.append('userId', userStore.user.userId);
                url.searchParams.append('chatroomId', newChat.id);
                url.searchParams.append('latestOne', false);

                const response = await fetch(url, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${localStorage.getItem('token')}`
                    }
                });

                const data = await response.json();
                if (data.errors === null) {
                    messages.value = data.data.map((message) => ({
                        ...message,
                        isMine: message.senderId === userStore.user.userId,
                    }));
                } else {
                    ExceptMessageHandler(data.errors);
                }
            } catch (error) {
                console.log(error);
            }
        };

        const sendMessage = async () => {
            // 檢查是否正在發送中，如果是，則不處理
            if (newMessage.value.trim() !== "" && !isSending.value) {
                isSending.value = true;  // 設置為正在發送
                loading.value = true;
                
                try {
                    // 發送訊息
                    await signalrStore.sendMessage(roomStore.currentChat.id, userStore.user.userId, newMessage.value);

                    
                    // 訊息發送後更新狀態
                    await roomStore.handleCurrentChatLatestMsg();
                    newMessage.value = "";  // 清空輸入框
                    
                    loading.value = false;
                } catch (err) {
                    console.error("Error sending message: ", err);
                    errorMessages.value = "無法傳送訊息，請稍後再嘗試";
                    loading.value = false;
                } finally {
                    isSending.value = false;  // 發送完成，重置 flag
                }
            }
        };

        const leaveChatroom = async () => {
            if (roomStore.currentChat) {
                try {
                    messages.value = [];
                    roomStore.currentChat = null;
                } catch (error) {
                    console.error("Error leaving chat room:", error);
                }
            }
        };

        function getImageType(base64) {
            const pngSignature = 'iVBORw0KGgo';
            const jpegSignature = '/9j/';
            const gifSignature = 'R0lGODlh';

            let imagetype = '';

            if (base64.startsWith(pngSignature)) {
                imagetype = 'image/png';
            }
            if (base64.startsWith(jpegSignature)) {
                imagetype = 'image/jpeg';
            }
            if (base64.startsWith(gifSignature)) {
                imagetype = 'image/gif';
            }

            if (imagetype == '') {
                return '';
            } else {
                base64 = 'data:' + imagetype + ';base64,' + base64;
                return base64;
            }
        }

        const scrollToBottom = () => {
            nextTick(() => {
                if (messageContainer.value) {
                    messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
                }
            });
        };

        onMounted(async () => {

            if (roomStore.currentChat && signalrStore.connection) {
                await signalrStore.joinRoom(roomStore.currentChat.id);
            }

            signalrStore.registerMessageHandler(async (message) => {
                if (!roomStore.currentChat || message.chatRoomId !== roomStore.currentChat.id) {
                    return;
                }

                messages.value.push({
                    ...message,
                    isMine: message.senderId === userStore.user.userId,
                });

                await roomStore.handleCurrentChatLatestMsg();
                scrollToBottom();
            });

            signalrStore.connection.on("ReceiveError", (message) => {
                console.error("Error received from server:", message);
                // 顯示錯誤訊息
                errorMessages.value = message;

                // 若聊天室被刪除，導回聊天室清單頁或清除 currentChat
                if (message.includes("deleted") || message.includes("not found")) {
                    ElMessage.warning("該聊天室已被刪除，您將被導出。");
                    roomStore.currentChat = null;
                    messages.value = [];
                }
            });
        });


        watch(() => roomStore.currentChat, async (newChat) => {
            if (newChat !== null && signalrStore.connection) {

                await signalrStore.joinRoom(newChat.id);
                messages.value = [];
                await getHistoryMessages(newChat);
                scrollToBottom();
            }
        });

        // 切換使用者時重新載入聊天
        watch(() => userStore.user, async (newUser) => {
            if (roomStore.currentChat != null) {
                messages.value = [];
                await getHistoryMessages(roomStore.currentChat);
                scrollToBottom();
            }
        });

        return {
            roomStore,
            shouldShowDate,
            formatDateTime,
            newMessage,
            getImageType,
            messages,
            sendMessage,
            errorMessages,
            leaveChatroom,
            loading,
            messageContainer,
        };
    }
}

</script>


<style lang="scss" scoped>
    .chat-area{
        display: flex;
        flex-direction: column;

    }

    .chat-header{
        display: flex;
        align-items: center; /* 垂直居中 */
        background-color: rgb(193, 222, 253);
        height: 60px; /* 可根据需要调整 */

        .header-leave{
            padding: 10px;
        }

        .header-roomname{
            text-align: center;
            flex:1;
            color: #13213b;
            border-bottom: rgb(209, 209, 209) 1px solid;
            box-sizing: border-box;
        }
    }

    .chat-body{
        flex:1;
        display: flex;
        flex-direction: column;
    }

    .chat-message {
        overflow-y: scroll;
        gap: 10px; /* 頭貼與訊息框之間的間距 */
        padding: 20px;

        .message-date {
            text-align: center; // 讓日期文字置中
            width: 100%; // 確保它佔滿整個寬度
            margin: 10px 0; // 增加上下間距
        }


        .my-message, .other-message {
            margin: 10px 0;
            display: flex; /* 確保對齊 */
            align-items: flex-start; /* 垂直方向對齊 */
            .message-header {
                display: flex;
                align-items: center; /* 垂直居中 */
                justify-content: center;
                flex-shrink: 0; /* 防止頭貼縮放 */
                width: 40px; /* 固定頭貼寬度 */
                height: 40px; /* 固定頭貼高度 */
                border-radius: 50%; /* 圓形頭貼 */
                overflow: hidden; /* 隱藏超出範圍的圖片 */
                background-color: #d6d6d6;

                img {
                    width: 100%; /* 圖片適應框架 */
                    height: 100%; /* 圖片適應框架 */
                    object-fit: cover; /* 確保圖片不變形 */
                }
            }

            .message-container {
                display: flex;
                flex-direction: column;
                max-width: 50%;
                word-break: break-all;
                position: relative; /* 為了放置偽元素 */

                .message-content {
                    padding: 0 15px;
                    border-radius: 12px;
                    position: relative; /* 為了放置偽元素 */
                }
            }
        }

        .my-message {
            flex-direction: column;
            .message-data{
                display: flex;
                flex-direction: row-reverse;
                width: 100%;
                .message-header {
                margin-left: 10px; /* 增加間距 */
                }
                .message-container {
                    .message-senderName{
                        text-align: right;
                    }
                    .message-content{
                        background-color: #d1e7dd;

                        &::after {
                            content: '';
                            position: absolute;
                            top: 10px; /* 對齊訊息框垂直位置 */
                            right: -10px; /* 三角形位置，向右偏移 */
                            width: 0;
                            height: 0;
                            border-style: solid;
                            border-width: 8px 0 8px 10px; /* 三角形大小 */
                            border-color: transparent transparent transparent #d1e7dd; /* 三角形顏色 */
                        }
                    }
                }
            }
        }

        .other-message {
            flex-direction: column; /* 頭貼在左邊 */
            .message-data{
                display: flex;
                flex-direction: row;
                width: 100%;
                .message-header {
                    margin-right: 10px; /* 增加間距 */
                }

                .message-container {
                    .message-senderName{
                        text-align: left;
                    }
                    .message-content{
                        background-color: #e4e4e4;
                    }

                    &::before {
                        content: '';
                        position: absolute;
                        top: 35px; /* 對齊訊息框垂直位置 */
                        left: -10px; /* 三角形位置，向左偏移 */
                        width: 0;
                        height: 0;
                        border-style: solid;
                        border-width: 8px 10px 8px 0; /* 三角形大小 */
                        border-color: transparent #e4e4e4 transparent transparent; /* 三角形顏色 */
                    }
                }
            }
        }

        .message-sentAt{
            margin-top: auto;
            padding: 5px;
        }
    }

    .chat-message-none{
        display: flex;
        align-items: center;
        justify-content: center;
        color:#999;
    }

    .chat-input {
        border-top: rgb(209, 209, 209) 1px solid ;
        margin-top: auto;
        padding: 20px; /* 去掉額外的內邊距，改成固定 20px */
        display: flex;
        justify-content: center;

        .input-wrapper {
            position: relative; /* 使內部按鈕相對定位 */
            flex: 1; /* 使寬度撐滿父容器 */
            max-width: 1000px; /* 可選：設定最大寬度，防止過大 */
            
            .el-textarea{
                outline: none;
                box-sizing: border-box; /* 確保寬度計算不超出範圍 */
                border: 1px solid #ccc;
                border-radius: 8px;
                background-color: #f9f9f9;
                transition: all 0.3s ease;
                padding: 12px 50px 12px 20px; /* 右側 50px 空間給按鈕 */
            }


            ::v-deep(.el-textarea__inner) {
                background-color: #f9f9f9;
                overflow-y: auto;
                max-height: 30vh;
                box-shadow: none;
            }

            ::v-deep(.el-textarea__inner:focus){
                box-shadow: none;
            }

            .el-textarea::placeholder {
                color: #999;
                font-style: italic;
            }

            button {
                position: absolute;
                top: 50%;
                right: 15px; /* 靠右邊距 */
                transform: translateY(-50%); /* 垂直置中 */
                border: none;
                background: transparent;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 10px;
                border-radius: 20px;
                background-color: #c2c2c2;
                
                
                el-icon {
                    font-size: 18px;
                    color: #666;
                }

                &:hover{
                    background-color: #868686;
                }
            }
        }
    }

    .no-data{
        font-size: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

</style>