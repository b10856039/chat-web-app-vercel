<template>
   
    <div class="chat-main" :class="chatClass">
      <SideBar v-if="userStore.userReady"  class="Sidebar"></SideBar>
      <ContentArea v-if="userStore.userReady" class="ContentArea"></ContentArea>
      <ChatArea v-if="userStore.userReady && signalrStore.connection" class="ChatArea"></ChatArea>
    </div>
</template>


<script>
  // 引入 Vue 3 相關 API
  import { ref, onMounted, onUnmounted, provide, computed } from 'vue';
  import { ElLoading } from 'element-plus'; // 引入 Element Plus 的 Loading 服務

  // 引入子元件
  import ChatArea from '@/components/ChatArea.vue';
  import ContentArea from '@/components/ContentArea.vue';
  import SideBar from '@/components/SideBar.vue';

  // 引用store
  import { useUserStore } from '@/stores/userStore'
  import { useRoomStore } from '@/stores/roomStore';
  import { useSignalRStore } from '@/stores/signalrStore';

  export default {
    name: 'ChatMain',
    components: {
      SideBar,
      ContentArea,
      ChatArea
    },
    setup() {
      // 使用者資訊與狀態
      const userStore = useUserStore();

      // 聊天室相關狀態
      const roomStore = useRoomStore();

      // SignalR相關狀態

      const signalrStore = useSignalRStore();

      // 記錄視窗寬度
      const windowWidth = ref(window.innerWidth);

      // 全畫面 Loading 實例
      let loadingInstance = null;

      onMounted(async () => {
        try {
          // 顯示 Loading
          loadingInstance = ElLoading.service({
            lock: true,
            text: '讀取中...',
            background: 'rgba(0, 0, 0, 0.7)'
          });

          await userStore.refreshUser();
          await roomStore.getRoomList();
          await signalrStore.initConnection(userStore.user.userId);

          if (roomStore.roomList.length > 0) {
            await roomStore.getLatestMessages();
            userStore.userReady = true;
          }else{
            userStore.userReady = true;
          }

          // 監聽視窗大小變化
          window.addEventListener('resize', updateWindowWidth);

          //讀取畫面關閉
          loadingInstance.close();


          console.log(userStore.user);
          console.log(roomStore.roomList);
          console.log(signalrStore.connection)
        } catch (error) {
          console.error(error);
          if (loadingInstance) loadingInstance.close();
        }
      });

      onUnmounted(async () => {
        signalrStore.stopConnection();
        window.removeEventListener('resize', updateWindowWidth);
      }); 

      const chatClass = computed(() => windowWidth.value < 768 ? (roomStore.currentChat ? 'in-chat' : 'no-chat') : '');

      const updateWindowWidth = () => { windowWidth.value = window.innerWidth; };

      return { 
        userStore,
        roomStore,
        signalrStore,
        chatClass,
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