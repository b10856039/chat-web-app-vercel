<template>
   
    <div class="chat-main" :class="chatClass">
      <SideBar v-if="userReady" :user="user" @select="setCurrentSection" @userUpdate="refreshUser"  class="Sidebar"></SideBar>
      <ContentArea v-if="userReady" @select="setCurrentChatRoom" :user="user" :currentSection="currentSection" :roomList="roomList" class="ContentArea"></ContentArea>

      <ChatArea v-if="userReady" :user="user" v-model:currentChat="currentChat" class="ChatArea" @MessageUpdate="handleCurrentChatLatestMsg"></ChatArea>
    </div>
</template>


<script>
  // 引入 Vue 3 相關 API
  import { ref, onMounted, onUnmounted, provide, computed } from 'vue';
  import { useRouter } from 'vue-router';
  import { ElLoading } from 'element-plus'; // 引入 Element Plus 的 Loading 服務
  import * as signalR from '@microsoft/signalr'; // 引入 SignalR 進行即時通訊
  import getImageType from "@/utils/imageHandle";

  // 引入子元件
  import ChatArea from '@/components/ChatArea.vue';
  import ContentArea from '@/components/ContentArea.vue';
  import SideBar from '@/components/SideBar.vue';
  import ExceptMessageHandler from "@/utils/fetchExceptHandler";

  export default {
    name: 'ChatMain',
    components: {
      SideBar,
      ContentArea,
      ChatArea
    },
    setup() {
      // 使用者資訊與狀態
      const user = ref(null); // 使用者資訊
      const userReady = ref(false); // 使用者是否準備好

      // 聊天室相關狀態
      const roomList = ref([]); // 聊天室列表
      const currentSection = ref('all'); // 目前選擇的聊天室類型（全部、好友、群組）
      const currentChat = ref(null); // 目前選中的聊天室

      // 記錄視窗寬度
      const windowWidth = ref(window.innerWidth);

      // 全畫面 Loading 實例
      let loadingInstance = null;

      /**
       * 設定當前聊天室類型
       * @param {string} section - 聊天室類型（all, friends, groups）
       */
      const setCurrentSection = async (section) => {
        currentSection.value = section;
        await getRoomList(); // 取得聊天室列表
        if (roomList.value.length > 0) {
          await getLatestMessages(); // 取得最新訊息
        }
      };

      /**
       * 設定目前選中的聊天室
       * @param {Object} chatroom - 聊天室物件
       */
      const setCurrentChatRoom = (chatroom) => {
        currentChat.value = chatroom;
      };



      const handleCurrentChatLatestMsg = async () => {
        await getRoomList();
        if (roomList.value.length > 0) {
          await getLatestMessages();
          userReady.value = true;
        }else{
          userReady.value = true;
        }
      };

      /**
       * 取得聊天室列表
       */
      const getRoomList = async () => {
        try {
          roomList.value = [];
          const url = new URL(import.meta.env.VITE_API_URL + "chatroom");
          url.searchParams.append('userId', user.value.userId);

          if (currentSection.value !== 'all') {
            const roomType = currentSection.value === 'friends' ? 0 : 1;
            url.searchParams.append('roomtype', roomType);
          }

          const response = await fetch(url, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${localStorage.getItem('token')}`
            }
          });

          const data = await response.json();

          if(data.errors===null)
          {
            roomList.value = data.data;
            roomList.value = roomList.value.map( (room) => {
              if (room.photoImg.length > 0) {
                const imagetype = getImageType(room.photoImg);
                room.photoImg = imagetype ? `data:${imagetype};base64,${room.photoImg}` : ""
                return room;
              } else {
                room.photoImg = ""
                return room;
              }
            })
          }
          else
          {
              ExceptMessageHandler(data.errors);
          }




        } catch (error) {
          console.error("Error fetching chat rooms:", error);
        }
      };

      /**
       * 取得最新的聊天室訊息
       */
       const getLatestMessages = async () => {
          try {
              console.log('------')
              console.log(roomList.value)
              console.log('------')
              for (const index in roomList.value) {
                  const url = new URL(import.meta.env.VITE_API_URL + "message");
                  url.searchParams.append('userId', user.value.userId);
                  url.searchParams.append('chatroomId', roomList.value[index].id);
                  url.searchParams.append('latestOne', true);

                  const response = await fetch(url, {
                      method: "GET",
                      headers: {
                          "Authorization": `Bearer ${localStorage.getItem('token')}`
                      }
                  });

                  const data = await response.json();
                  console.log(data)

                  if(data.errors===null)
                  {
                    roomList.value[index].latestMessage = await data.data[0]; // 存儲最新訊息
                  }
                  else
                  {
                      ExceptMessageHandler(data.errors);
                  }
              }
              console.log('*****')
              console.log(roomList.value)
              console.log('*****')
              // 排序聊天室列表，將有最新訊息的排前面
              // roomList.value.sort((a, b) => {
              //     if (!a.latestMessage) return 1; // 沒有訊息的排後面
              //     if (!b.latestMessage) return -1;
              //     return new Date(b.latestMessage.sentAt) - new Date(a.latestMessage.sentAt); // 根據最新訊息時間排序
              // });
              console.log(roomList.value)
              console.log("!!!!")
          } catch (error) {
              console.error("Error fetching latest messages:", error);
          }
      };


      const getUser = async (userId) =>{
        try{
          const url = new URL(import.meta.env.VITE_API_URL + "user" + "/" + userId);
          const response = await fetch(url, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${localStorage.getItem('token')}`
            }
          });

          const data = await response.json();

          if(data.errors===null)
          {

            user.value = {
              userId: data.data.id,
              username: data.data.username,
              showname: data.data.showUsername,
              photoImg: data.data.photoImg,
              email: data.data.email,
              phone: data.data.phone,
              role: data.data.role,
              state: data.data.state,
            }

            if (user.value.photoImg.length > 0) {
              const imagetype = getImageType(user.value.photoImg);
              user.value.photoImg = imagetype ? `data:${imagetype};base64,${user.value.photoImg}` : "";
            } else {
              user.value.photoImg = "";
            }
          }
          else
          {
            console.log(data)
            ExceptMessageHandler(data.errors);
          }

        }catch(err){
          console.log(err)
        }
      }

      /**
       * 解析 JWT Token，獲取使用者資訊
       */
      const refreshUser = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        const base64Url = token.split('.')[1]; // 取出 JWT 的 payload 部分
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/'); // 修正 base64 的格式
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(c => `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`)
                .join('')
        );

        const payload = await JSON.parse(jsonPayload);
        await getUser(parseInt(payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']))
        await getRoomList();
        if (roomList.value.length > 0) {
          await getLatestMessages();
          userReady.value = true;
        }else{
          userReady.value = true;
        }
      };

      // SignalR 連線
      const connection = ref(null);

      onMounted(async () => {
        try {
          // 顯示 Loading
          loadingInstance = ElLoading.service({
            lock: true,
            text: '讀取中...',
            background: 'rgba(0, 0, 0, 0.7)'
          });

          await refreshUser(); // 取得使用者資訊與聊天室

          // 監聽視窗大小變化
          window.addEventListener('resize', updateWindowWidth);

          // 初始化 SignalR 連接
          connection.value = new signalR.HubConnectionBuilder()
            .withUrl(import.meta.env.VITE_API_URL + "chatHub")
            .build();

          await connection.value.start();
          console.log("SignalR connection established");

          // 加入聊天室
          connection.value.invoke("JoinAllChatRoom", user.value.userId).catch(err => {
            console.error("Error joining all rooms:", err);
          });

          connection.value.on("ReceiveMessage", (message) => {
            roomList.value.forEach((room, index) => {
              if (room.id === message.chatRoomId) {
                roomList.value[index].latestMessage = message;
              }
            });
          });

          loadingInstance.close();
        } catch (error) {
          console.error(error);
          if (loadingInstance) loadingInstance.close();
        }
      });

      onUnmounted(async () => {
        if (connection.value) await connection.value.stop();
        window.removeEventListener('resize', updateWindowWidth);
      });

      provide('connection', connection);

      const chatClass = computed(() => windowWidth.value < 768 ? (currentChat.value ? 'in-chat' : 'no-chat') : '');

      const updateWindowWidth = () => { windowWidth.value = window.innerWidth; };

      return { 
        user, 
        userReady, 
        roomList, 
        currentSection, 
        currentChat, 
        setCurrentSection, 
        setCurrentChatRoom, 
        refreshUser, 
        chatClass,
        handleCurrentChatLatestMsg
      };
    }
  };
</script>



<style lang="scss" scoped>
  .chat-main {
    display: flex;
    justify-content: start;
    align-items: stretch;
    height: 100vh;
    transition: all 0.3s ease;

    .Sidebar {
      flex: 0 0 100px;
      transition: all 0.3s ease;
    }

    .ContentArea {
      flex: 0 0 30%;
      transition: all 0.3s ease;
    }

    .ChatArea {
      flex: 1;
      transition: all 0.3s ease;
    }

    /* 當螢幕寬度小於 768px 時 */
    @media (max-width: 768px) {
      &.no-chat {
        .Sidebar {
          flex: 0 0 80px; // 可以縮小 Sidebar 以適應小螢幕
        }
        .ContentArea {
          flex: 1; // 讓 ContentArea 填滿剩餘空間
        }
        .ChatArea {
          display: none; // 隱藏 ChatArea
        }
      }

      &.in-chat {
        .Sidebar,
        .ContentArea {
          display: none; // 隱藏 Sidebar 和 ContentArea
        }
        .ChatArea {
          flex: 1; // 讓 ChatArea 佔滿整個畫面
          display: flex;
        }
      }
    }
  }
</style>