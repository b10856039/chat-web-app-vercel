<template>
   
    <div class="chat-main" :class="chatClass">
      <SideBar v-if="userReady" :user="user" @select="setCurrentSection" @userUpdate="refreshUser"  class="Sidebar"></SideBar>
      <ContentArea v-if="userReady" @select="setCurrentChatRoom" :user="user" :currentSection="currentSection" :roomList="roomList" class="ContentArea"></ContentArea>

      <ChatArea v-if="userReady" :user="user" v-model:currentChat="currentChat" class="ChatArea"></ChatArea>
    </div>
</template>


<script>
  import {ref,onMounted,onUnmounted,provide,computed} from 'vue';
  import ChatArea from '@/components/ChatArea.vue';
  import ContentArea from '@/components/ContentArea.vue';
  import SideBar from '@/components/SideBar.vue';
  import * as signalR from '@microsoft/signalr';

  export default {
    name:'ChatMain',
    components:{
      SideBar,
      ContentArea,
      ChatArea
    },
    setup(){
      const user = ref(null);
      const userReady = ref(false);
      const roomList = ref([]);

      const currentSection = ref('all');
      const currentChat = ref(null);

      const windowWidth = ref(window.innerWidth);

      
      const setCurrentSection = async (section) => {
        currentSection.value = section
        await getRoomList();
        if (roomList.value.length > 0) {
          await getLatestMessages();
        }
      }

      const setCurrentChatRoom = (chatroom) => {
        currentChat.value = chatroom
      }

      function getImageType(base64) {
        const pngSignature = 'iVBORw0KGgo';
        const jpegSignature = '/9j/';
        const gifSignature = 'R0lGODlh';
        
        if (base64.startsWith(pngSignature)) {
          return 'image/png';
        }
        if (base64.startsWith(jpegSignature)) {
          return 'image/jpeg';
        }
        if (base64.startsWith(gifSignature)) {
          return 'image/gif';
        }

        return '';
      }

      const getUserPhotoImage = async () =>{
          try
          {
            const url = new URL("http://localhost:5266/api/user" + '/' + user.value.userId);
            const response = await fetch(url, {
                method: "GET",
                headers:{
                    "Authorization": `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();

            if(data.photoImg.length > 0){
              const imagetype = getImageType(data.photoImg);

              if(imagetype == '')
              {
                user.value.photoImg = "";
              }else{
                user.value.photoImg = 'data:' + imagetype + ';base64,' + data.photoImg;
              }
            }else{
              user.value.photoImg = "";
            }
            userReady.value = true;

          }catch(error)
          {
            console.log(error);
          }
      }

      const getRoomList = async () => {
          try
          {
            roomList.value = [];
            const url = new URL("http://localhost:5266/api/chatroom");
            url.searchParams.append('userId', user.value.userId);

            if(currentSection.value === 'all')
            {
                const response = await fetch(url, {
                    method: "GET",
                    headers:{
                        "Authorization": `Bearer ${localStorage.getItem('token')}`
                    }
                });
                const data = await response.json();
                roomList.value = data;
            }
            else
            {
                let roomType;
                if(currentSection.value == 'friends')
                {
                    roomType = 0;
                }
                else
                {
                    roomType = 1;
                }
                url.searchParams.append('roomtype', roomType);
                const response = await fetch(url, {
                    method: "GET",
                    headers:{
                        "Authorization": `Bearer ${localStorage.getItem('token')}`
                    }
                });
                const data = await response.json();
                roomList.value = data;
            }
          }
          catch(error)
          {
              console.log(error)
          }
      }

      const getLatestMessages = async () => {
        try{
            for(const index in roomList.value)
            {
                const url = new URL("http://localhost:5266/api/message");
                url.searchParams.append('userId', user.value.userId);
                url.searchParams.append('chatroomId', roomList.value[index].id);
                url.searchParams.append('latestOne',true)

                const response = await fetch(url, {
                    method: "GET",
                    headers: {
                    "Content-Type": "application/json", 
                    "Authorization": `Bearer ${localStorage.getItem('token')}`
                    }
                });

                const data = await response.json();
                roomList.value[index].latestMessage = data[0];
            }
        }
        catch(error)
        {
          console.log(error);
        }
      }

      const refreshUser = async () =>{
        console.log('22')
        const token = localStorage.getItem('token');
        const payload = await JSON.parse(atob(token.split('.')[1]));
        user.value = {
            userId : parseInt(payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']),
            username : payload['sub'],
            email : payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'],
            phone : payload['Phone'],
            role : payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'],
            state : payload['State'],
        }
        await getUserPhotoImage();
        await getRoomList();
        if (roomList.value.length > 0) {
          await getLatestMessages();
        }
      }

      const connection = ref(null);
      onMounted(async () => {

        const token = localStorage.getItem('token');
        const payload = await JSON.parse(atob(token.split('.')[1]));
        user.value = {
            userId : parseInt(payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']),
            username : payload['sub'],
            email : payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'],
            phone : payload['Phone'],
            role : payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'],
            state : payload['State'],
        }

        await getUserPhotoImage();
        await getRoomList();
        if (roomList.value.length > 0) {
          await getLatestMessages();
        }

        window.addEventListener('resize', updateWindowWidth);

        // 初始化 SignalR 连接
        connection.value = new signalR.HubConnectionBuilder()
          .withUrl("http://localhost:5266/chatHub")
          .build();

        connection.value.start()
          .then(() => {
            console.log("SignalR connection established");
            // 加入所有聊天室
            connection.value.invoke("JoinAllChatRoom",user.value.userId).catch(err => {
              console.error("Error joining all rooms:", err);
            });
          })
          .catch(err => {
            console.error("Error establishing SignalR connection:", err);
          });

        connection.value.on("ReceiveMessage", (message) => {
            roomList.value.forEach((room, index) => {
              if(room.id === message.chatRoomId){
                roomList.value[index].latestMessage = message;
              }
            });
        });
      });

      onUnmounted( async () => {
        if (connection.value) {
            await connection.value.stop();
            console.log("SignalR connection stopped");
        }
        window.removeEventListener('resize', updateWindowWidth);
      });


      provide('connection', connection);

      // 計算 chatClass，根據視窗大小與 currentChat 動態變更
      const chatClass = computed(() => {
        if (windowWidth.value < 768) {
          return currentChat.value ? 'in-chat' : 'no-chat';
        }
        return '';
      });

      // 更新 windowWidth 的函數
      const updateWindowWidth = () => {
        windowWidth.value = window.innerWidth;
      };


      return {
        user,
        userReady,
        roomList,
        currentSection,
        currentChat,
        setCurrentSection,
        setCurrentChatRoom,
        refreshUser,
        chatClass
      }
    }
  }
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