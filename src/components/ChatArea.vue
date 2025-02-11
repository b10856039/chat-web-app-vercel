<template>
    <div v-if="!currentChat" class="no-data">
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
                <h3>{{ currentChat.roomname }}</h3>
            </div>
        </div>
        <div class="chat-message">
            <div
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
    import { ElMessage } from 'element-plus';
    import {ref,onMounted, onUnmounted,watch, inject} from 'vue'
    import * as signalR from '@microsoft/signalr';
    import formatDateTime from "@/utils/dateFormatter";
    import ExceptMessageHandler from "@/utils/fetchExceptHandler";

    export default {
        props:{
            user : Object,
            currentChat : Object,
        },
        emits:['MessageUpdate'],
        setup(props,{emit})
        {
            const newMessage = ref('');
            const messages = ref([]);
            const errorMessages = ref("");
            const connection = inject("connection");
            const loading = ref(false);

            const shouldShowDate = (index, message) => {
                if (index === 0) return true; // 第一則訊息一定顯示日期
                const prevMessage = messages.value[index - 1];
                return formatDateTime(prevMessage.sentAt, 3) !== formatDateTime(message.sentAt, 3);
            };

            const getHistoryMessages = async (newChat) => {
                try{
                const url = new URL( import.meta.env.VITE_API_URL + "message");
                url.searchParams.append('userId', props.user.userId);
                url.searchParams.append('chatroomId', newChat.id);
                url.searchParams.append('latestOne',false)

                const response = await fetch(url, {
                    method: "GET",
                    headers: {
                    "Content-Type": "application/json", 
                    "Authorization": `Bearer ${localStorage.getItem('token')}`
                    }
                });

                const data = await response.json();
                if(data.errors===null)
                {
                    messages.value = data.data.map((message) => ({
                        ...message,
                        isMine: message.senderId === props.user.userId, // 根據 senderId 判斷
                    }));
                }
                else
                {
                    ExceptMessageHandler(data.errors);
                }



                }
                catch(error)
                {
                    console.log(error);
                }
            }

            // 發送訊息的函數
            const sendMessage = async () => {
                if (newMessage.value.trim() !== "") {
                    loading.value = true;
                    try {
                        // 發送訊息到 SignalR Hub
                        await connection.value.invoke('SendMessage', props.currentChat.id, props.user.userId, newMessage.value);
                        loading.value = false;
                        emit('MessageUpdate', true);
                        newMessage.value = "";  // 清空輸入框
                    } catch (err) {
                        console.error("Error sending message: ", err);
                        // 如果有錯誤，顯示錯誤消息
                        errorMessages.value = "無法傳送訊息，請稍後再嘗試";
                        loading.value = false;
                    }
                }
            };

            const leaveChatroom = async () => {
                if (props.currentChat) {
                    try {
                        // 1. 透過 SignalR 退出聊天室
                        await connection.value.invoke("LeaveChatRoom", props.currentChat.id);

                        // 2. 解除 "ReceiveMessage" 事件監聽，避免離開聊天室後仍接收訊息
                        connection.value.off("ReceiveMessage");

                        // 3. 清空 messages 訊息列表
                        messages.value = [];

                        // 4. 清空 currentChat，讓畫面回到「開始聊天吧！」畫面
                        emit("update:currentChat", null);
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

                if(imagetype == '')
                {
                    return '';
                }else{
                    base64 = 'data:' + imagetype + ';base64,' + base64;
                    return base64
                }
            }



            // 監聽 props.currentChat 的變化
            watch(() => props.currentChat, async (newChat, oldChat) => {
                if (newChat !== null) {
                    if (connection.value) {
                        // 離開舊的聊天室
                        if (oldChat) {
                            connection.value.invoke("LeaveChatRoom", oldChat.id)
                                .catch(err => console.error("Error leaving chat room:", err));
                        }

                        // **先解除舊的 "ReceiveMessage" 監聽**
                        connection.value.off("ReceiveMessage");

                        // 加入新的聊天室
                        connection.value.invoke("JoinChatRoom", newChat.id)
                            .catch(err => console.error("Error joining chat room:", err));

                        // **重新綁定 "ReceiveMessage" 事件**
                        connection.value.on("ReceiveMessage", (message) => {
                            messages.value.push({
                                ...message,
                                isMine: message.senderId === props.user.userId, 
                            });
                        });

                        // **清空舊的訊息**
                        messages.value = [];

                        await getHistoryMessages(newChat);
                    }
                }
            });

            watch( ()=> props.user, async (newUser) => {
                if(props.currentChat != null){
                    connection.value.off("ReceiveMessage");

                    connection.value.on("ReceiveMessage", (message) => {
                        messages.value.push({
                            ...message,
                            isMine: message.senderId === newUser.userId, 
                        });
                    });

                    // **清空舊的訊息**
                    messages.value = [];
                    await getHistoryMessages(props.currentChat);
                }
            })

            return {
                shouldShowDate,
                formatDateTime,
                newMessage,
                connection,
                getImageType,
                messages,
                sendMessage,
                errorMessages,
                leaveChatroom,
                loading
            }
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