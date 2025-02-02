<template>
    <div class="content-area">
        <div class="content-header">
                <h3 v-if="currentSection === 'all'">全部</h3>
                <h3 v-if="currentSection === 'friends'">朋友</h3>
                <h3 v-if="currentSection === 'groups'">群組</h3>
                <h3 v-if="currentSection === 'manage'">管理功能</h3>
        </div>
        <div class="content-body">
            <div v-if="currentSection !== 'manage'"  class="content-search">
                <el-input
                    v-model="searchContent"
                    :placeholder="placeholderText"
                    clearable
                    class="input-with-icon searchInput"
                >
                    <template #prefix>
                    <el-icon>
                        <Search />
                    </el-icon>
                    </template>
                </el-input>
            </div>
            <div v-if="currentSection === 'all'" class="content-section">
                <div v-for="(room, index) in roomList" :key="room.Id" v-on:click="selectChatRoom(index)" :class="['content-chatroom', { 'selected-room': selectRoom === room , 'room-hidden': !isMatch(room, searchContent) }]">
                    <div class="content-roomname">
                        <span v-if="room.roomname != null" class="roomname-title">{{ room.roomname }}({{ room.participants.length }})</span>
                        <span v-else class="roomname-title">{{ room.latestMessage.senderName }}</span>
                        <small v-if="room.latestMessage" class="roomname-latestTime">{{ formatDateTime(room.latestMessage.sentAt,2) }}</small>
                    </div>
                    <div class="content-latestMessage">
                        <span v-if="room.latestMessage">
                            {{ room.latestMessage.senderName }} : {{ latestMessageCountReplacer(room.latestMessage.content) }}
                        </span>
                    </div>
                </div>
                <div v-if="roomList.length == 0" class="no-data">
                    <span>無資料</span>
                </div>
            </div>
            <div v-if="currentSection === 'friends'" class="content-section">
                <div v-for="(room, index) in roomList" :key="room.Id" v-on:click="selectChatRoom(index)" :class="['content-chatroom', { 'selected-room': selectRoom === room , 'room-hidden': !isMatch(room, searchContent)}]">
                    <div class="content-roomname">
                        <span class="roomname-title">{{ room.latestMessage.senderName }}</span>
                        <small v-if="room.latestMessage" class="roomname-latestTime">{{ formatDateTime(room.latestMessage.sentAt,2) }}</small>
                    </div>
                    <div class="content-latestMessage">
                        <span v-if="room.latestMessage">
                            {{ room.latestMessage.senderName }} : {{ latestMessageCountReplacer(room.latestMessage.content) }}
                        </span>
                    </div>
                </div>
                <div v-if="roomList.length == 0" class="no-data">
                    <span>無資料</span>
                </div>
            </div>
            <div v-if="currentSection === 'groups'" class="content-section">
                <div v-for="(room, index) in roomList" :key="room.Id" v-on:click="selectChatRoom(index)" :class="['content-chatroom', { 'selected-room': selectRoom === room , 'room-hidden': !isMatch(room, searchContent) }]">
                    <div class="content-roomname">
                        <span class="roomname-title">{{ room.roomname }}({{ room.participants.length }})</span>
                        <small v-if="room.latestMessage" class="roomname-latestTime">{{ formatDateTime(room.latestMessage.sentAt,2) }}</small>
                    </div>
                    <div class="content-latestMessage">
                        <span v-if="room.latestMessage">
                            {{ room.latestMessage.senderName }} : {{ latestMessageCountReplacer(room.latestMessage.content) }}
                        </span>
                    </div>
                </div>
                <div v-if="roomList.length == 0" class="no-data">
                    <span>無資料</span>
                </div>
            </div>
            <div v-if="currentSection === 'manage'" class="content-section">
                <div class="content-manage-header">
                    <div v-on:click="selectManageType = true" :class="{ 'active': selectManageType }">朋友</div>
                    <div v-on:click="selectManageType = false" :class="{ 'active': !selectManageType }">群組</div>
                </div>
                <div class="content-manage-body">
                    <GroupManage v-if="!selectManageType && user" :user="user"></GroupManage>
                    <FriendManage v-if="selectManageType && user" :user="user"></FriendManage>
                </div>
            </div>
        </div>

    </div>


</template>


<script>

    import { ref, onMounted, watch, computed,inject } from 'vue';
    import GroupManage from './GroupManage.vue';
    import FriendManage from './FriendManage.vue';
    import formatDateTime from "@/utils/dateFormatter";


    export default {
        components: {
            GroupManage,
            FriendManage
        },
        emits: ['select'],
        props:{
            user : Object,
            currentSection : String,
            roomList : Array
        },
        setup(props,{emit})
        {
            const searchContent = ref('');
            const selectManageType = ref(false);

            const isMatch = (room, search) => {
                if (!search) return true;
                const lowerSearch = search.toLowerCase();
                if(room.roomType == 0)
                {
                    return room.createdByUsername.toLowerCase().includes(lowerSearch);
                }
                else
                {
                    return room.roomname.toLowerCase().includes(lowerSearch);
                }
            };

            const placeholderText = computed(() => {
                if(props.currentSection === "all")
                {
                    return "輸入群組或好友名稱";
                }
                else if (props.currentSection === "groups") {
                    return "輸入群組名稱";
                } else if (props.currentSection === "friends") {
                    return "輸入好友名稱";
                }
                return "輸入內容";
            });

            const latestMessageCountReplacer = ((message) => {
                const limit = 25;
                if(message.length > limit)
                {
                    message = message.slice(0,limit+1);
                    message += '...';
                }

                return message
            });

            const selectRoom = ref(null);
            const selectChatRoom = (index) =>{
                let select = props.roomList[index];
                emit("select", select);
                selectRoom.value = select;
            }

            return{
                formatDateTime,
                selectChatRoom,
                selectRoom,
                searchContent,
                isMatch,
                placeholderText,
                selectManageType,
                latestMessageCountReplacer
            }
        }
    }
</script>


<style lang="scss" scoped>
    .content-area{
        display: flex;
        flex-direction: column;
        padding: 0;
        border-right: rgb(209, 209, 209) 1px solid;
        box-sizing: border-box;
    }

    .content-header{
        display: flex;
        align-items: center; /* 垂直居中 */
        justify-content: center; /* 水平居中 */
        background-color: #f0f0f0;
        height: 60px; /* 可根据需要调整 */
        line-height: 60px; /* 水平居中对齐 */
        color: #13213b;
        border-bottom: rgb(209, 209, 209) 1px solid;
        box-sizing: border-box;
    }

    .content-body{
        flex:1;
        display: flex;
        flex-direction: column;
    }

    
    .content-search {
        padding: 10px 20px; /* 減少左右內距 */
    }

    .content-section{
        width: 100%;
        flex: 1;
        display: flex; /* 使內容區域使用 flex 布局 */
        flex-direction: column; /* 讓內容垂直排列 */
        justify-content: flex-start; /* 默認是從頂部開始排列 */
        height: 100%; /* 確保 section 占滿整個容器 */
    }

    .content-chatroom{
        padding: 20px;
        overflow-y: auto;
        .content-roomname{
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;

            .roomname-title{
                font-weight: bold;
            }

            .roomname-latestTime{
                color:#8b8b8b;
            }
        }
    }

    .content-latestMessage{
        word-break: break-all;
    }
    .content-manage-header{
        display: flex;
        align-items: center;
        justify-content: space-around;
        
        div:first-of-type{
            border-right: 0.5px solid rgb(180, 180, 180);
        }

        div{
            width:100%;
            text-align: center;
            padding: 20px;
            border-bottom: 0.5px solid rgb(180, 180, 180);
        }

        div:hover {
            background-color: #ececec;
        }

        div.active{
            background-color: #ececec;
        }
    }

    .content-manage-body{
        flex:1;
    }

    .no-data {
        display: flex;
        justify-content: center;
        align-items: center;
        flex: 1; /* 讓 no-data 占滿剩餘空間，並使其居中 */
        pointer-events: none; /* 阻止 no-data 區域觸發鼠標事件 */
    }

    .no-data span {
        font-size: 16px;
        color: #888; /* 可選：設置無資料提示的顏色 */
    }

    .content-chatroom:hover {
        background-color: #ececec;
    }

    .selected-room {
        background-color: #ececec;
    }

    .room-hidden {
        display: none;
    }

</style>