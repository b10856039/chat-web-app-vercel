<template>
    <div class="friend-header" @click="showAddFriend = true">
        <span class="add-friend">
            <el-icon><Plus /></el-icon>
            <p>添加朋友</p>
        </span>
    </div>

    <div class="friend-container">
        <div class="friend-search">
            <el-input
                v-model="searchContent"
                placeholder="請輸入朋友"
                clearable
                class="input-with-icon"
            >
                <template #prefix>
                    <el-icon><Search /></el-icon>
                </template>
            </el-input>
        </div>

        <!-- 朋友列表 (已接受的好友) -->
        <div>
            <div class="container-header">
                <h4>朋友列表</h4>
            </div>
            <div class="container-body">
                <div v-if="acceptedFriends.length === 0" class="no-data">無</div>
                <div v-else-if="filteredAcceptedFriends.length === 0" class="no-data">未找到匹配的好友</div>
                <div 
                    v-for="friend in acceptedFriends" 
                    :key="friend.friendId" 
                    v-show="isMatch(friend, searchContent)"
                    class="friend-data"
                >
                    <div class="friend-content">
                        <div class="friend-avatar">
                            <el-avatar v-if="friend.friendPhotoImg" :size="50" :src="friend.friendPhotoImg"/>
                            <el-avatar v-else :src="userPlaceholder" :size="50"></el-avatar>
                        </div>
                        <div class="friend-name">
                            <p class="friend-showname">{{ friend.friendShowname }}</p>
                            <span class="friend-username">{{ friend.friendUsername }}</span>
                        </div>
                    </div>
                    <div class="friend-option">
                        <el-icon class="clickable-icon" v-on:click="showDeleteFriend = true;processUserId = user.id;EditFriend = friend; EditAction = 'reject'"><Delete /></el-icon>
                    </div>
                </div>
            </div>
        </div>


        <!-- 待添加的朋友列表 (好友請求 Pending) -->
        <div>
            <div class="container-header">
                <h4>待確認的好友</h4>
            </div>
            <div class="container-body">
                <div v-if="pendingFriends.length === 0" class="no-data">無</div>
                <div v-else-if="filteredPendingFriends.length === 0" class="no-data">未找到匹配的好友</div>
                <div 
                    v-for="friend in pendingFriends" 
                    :key="friend.friendId" 
                    v-show="isMatch(friend, searchContent)"
                    class="friend-data"
                >
                    <div class="friend-content">
                        <div class="friend-avatar">
                            <el-avatar v-if="friend.friendPhotoImg" :size="50" :src="friend.friendPhotoImg"/>
                            <el-avatar v-else :src="userPlaceholder" :size="50"></el-avatar>
                        </div>
                        <div class="friend-name">
                            <p class="friend-showname">{{ friend.friendShowname }}</p>
                            <span class="friend-username">{{ friend.friendUsername }}</span>
                        </div>
                    </div>
                    <div class="friend-option">
                        <DropDown title="選項">
                            <template #content>
                                <el-dropdown-menu>
                                    <el-dropdown-item  
                                        v-on:click="showAddFriendInvite = true; processUserId = user.id; EditFriend = friend; EditAction = 'accept'" 
                                        icon="edit">添加</el-dropdown-item>
                                    <el-dropdown-item  
                                        v-on:click="showRejectFriendInvite = true; processUserId = user.id; EditFriend = friend; EditAction = 'reject'" 
                                        icon="delete">拒絕</el-dropdown-item>
                                </el-dropdown-menu>
                            </template>
                        </DropDown>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <custom-dialog v-model="showAddFriend" 
                    title="添加好友" 
                    :beforeClose="function(){searchUnFriend = '';addFriendSearchList = [];showAddFriend = false;}">
        <template #content>
            <div class="addFriendSearch">
                <el-input  
                    v-model="searchUnFriend"
                    placeholder="請輸入名稱"
                    clearable
                    @keydown.enter="getUnAddFriendList"
                    class="input-with-icon"
                />
            </div>
            <div class="addFriendSearchList">
                <div v-if="addFriendSearchList.length === 0">未找到匹配的用戶</div>
                <div v-for="user in addFriendSearchList" :key="user.id" class="friend-data">
                    <div class="friend-content">
                        <div class="friend-avatar">
                            {{ user.photoImg }}
                            <el-avatar v-if="user.photoImg" :size="50" :src="user.photoImg"/>
                            <el-avatar v-else :src="userPlaceholder" :size="50"></el-avatar>
                        </div>
                        <div class="friend-name">
                            <p class="friend-showname">{{ user.showUsername }}</p>
                            <span class="friend-username">{{ user.username }}</span>
                        </div>
                    </div>
                    <el-icon class="clickable-icon" v-on:click="sendFriendRequest(user.userId)"><Plus /></el-icon>
                </div>
            </div>
        </template>
        <template #footer>
        </template>
    </custom-dialog>

    <custom-dialog
        v-model="showAddFriendInvite"
        title="接受好友邀請"
    >
        <template #content>
            <h4>確定要接受該用戶的邀請</h4>
        </template>
        <template #footer>
        <el-button @click="showAddFriendInvite = false">取消</el-button>
        <el-button type="primary" @click="sendFriendRespond(processUserId, EditFriend, EditAction)">確定</el-button>
        </template>
    </custom-dialog>

    <custom-dialog
        v-model="showRejectFriendInvite"
        title="拒絕好友邀請"
    >
        <template #content>
            <h4>確定要拒絕該用戶的邀請</h4>
        </template>
        <template #footer>
        <el-button @click="showRejectFriendInvite= false">取消</el-button>
        <el-button type="primary" @click="sendFriendRespond(processUserId, EditFriend, EditAction)">確定</el-button>
        </template>
    </custom-dialog>

    <custom-dialog
        v-model="showDeleteFriend"
        title="是否刪除好友"
    >
        <template #content>
            <h4>確定刪除該好友?</h4>
        </template>
        <template #footer>
        <el-button @click="showDeleteFriend= false">取消</el-button>
        <el-button type="primary" @click="updateFriendStatus(processUserId, EditFriend, EditAction)">確定</el-button>
        </template>
    </custom-dialog>
</template>

<script>
    import { ref, computed, onMounted } from "vue";
    import CustomDialog from '@/components/Dialog.vue';
    import DropDown from "./DropDown.vue";
    import { ElMessage } from "element-plus";
    import getImageType from "@/utils/imageHandle";
    import userPlaceholder from "@/assets/user.png";
    import ExceptMessageHandler from "@/utils/fetchExceptHandler";

export default {
    components: {
        CustomDialog,
        DropDown
    },
    props: {
        user: Object
    },
    setup(props) {
        const searchContent = ref('');
        const showAddFriend = ref(false);
        const searchUnFriend = ref('');
        const friendList = ref([]);  // 存放好友列表
        const addFriendSearchList = ref([]); // 存放未添加好友

        const showDeleteFriend = ref(false);
        const showAddFriendInvite = ref(false);
        const showRejectFriendInvite = ref(false);

        // 獲取好友列表
        const getFriendshipsList = async () => {
            try {
                const url = new URL(import.meta.env.VITE_API_URL + "friendships/" + props.user.userId);
                const response = await fetch(url, {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${localStorage.getItem('token')}`
                    }
                });
                const data = await response.json();

                if(data.errors===null)
                {
                    friendList.value = data.data;
                    friendList.value = friendList.value.map( (friend) => {
                        if (friend.friendPhotoImg.length > 0) {
                            const imagetype = getImageType(friend.friendPhotoImg);
                            friend.friendPhotoImg = imagetype ? `data:${imagetype};base64,${friend.friendPhotoImg}` : ""
                            return friend;
                        } else {
                            friend.friendPhotoImg = ""
                            return friend;
                        }
                    })
                }
                else
                {
                    ExceptMessageHandler(data.errors);
                }

            } catch (error) {
                console.log("獲取好友列表失敗", error);
            }
        };

        // 計算已接受的好友列表 (status === 1)
        const acceptedFriends = computed(() => {
            return friendList.value.filter(friend => friend.status === 1);
        });

        // 計算待確認的好友列表 (status === 0)
        const pendingFriends = computed(() => {
            return friendList.value.filter(friend => friend.status === 0);
        });

        // 獲取未添加的好友
        const getUnAddFriendList = async () => {
            try {
                const url = new URL(import.meta.env.VITE_API_URL + `friendships/non-friends/${props.user.userId}`);
                if (searchUnFriend.value) {
                    url.searchParams.append("search", searchUnFriend.value);
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
                    addFriendSearchList.value = data.data;
                }
                else
                {
                    ExceptMessageHandler(data.errors);
                }

            } catch (error) {
                console.log("獲取未添加好友列表失敗", error);
            }
        };

        // 發送好友請求
        const sendFriendRequest = async (receiverId) => {
            try {
                const url = import.meta.env.VITE_API_URL + "friendships/request";
                const response = await fetch(url, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({
                        requesterId: props.user.userId,
                        receiverId
                    })
                });

                const data = await response.json();

                if(data.errors===null)
                {
                    addFriendSearchList.value = addFriendSearchList.value.filter(u => u.id !== receiverId);
                    ElMessage.success(data.data);
                    // 重新獲取好友列表
                    getFriendshipsList();
                    getUnAddFriendList();
                }
                else
                {
                    ExceptMessageHandler(data.errors);
                }

            } catch (error) {
                console.log("發送好友請求失敗", error);
            }
        };

        const sendFriendRespond = async (userId,friend,action) =>{
            try {
                const url = import.meta.env.VITE_API_URL + "friendships/respond";
                const response = await fetch(url, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({
                        FriendShipId: friend.friendShipId,
                        Action:action
                    })
                });

                const data = await response.json();

                if(data.errors===null)
                {
                    ElMessage.success(data.data);
                    // 重新獲取好友列表
                    getFriendshipsList();
                }
                else
                {
                    ExceptMessageHandler(data.errors);
                }

                showAddFriendInvite.value = false;
                showRejectFriendInvite.value = false
            } catch (error) {
                console.log("發送好友請求失敗", error);
            }
        }

        const updateFriendStatus = async (userId,friend,action) =>{
            try {
                const url = import.meta.env.VITE_API_URL + "friendships";
                const response = await fetch(url, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({
                        FriendShipId: friend.friendShipId,
                        Action:action
                    })
                });

                const data = await response.json();
                if(data.errors===null)
                {
                    ElMessage.success(data.data);
                    // 重新獲取好友列表
                    getFriendshipsList();
                }
                else
                {
                    ExceptMessageHandler(data.errors);
                }
                showDeleteFriend.value = false

            } catch (error) {
                console.log("發送好友設定失敗", error);
            }
        }

        const isMatch = (friend, search) => {
            if (!search) return true;
            const lowerSearch = search.toLowerCase();
            return friend.friendUsername.toLowerCase().includes(lowerSearch);
        };
        const filteredAcceptedFriends = computed(() => {
            return acceptedFriends.value.filter(friend => isMatch(friend, searchContent.value));
        });

        const filteredPendingFriends = computed(() => {
            return pendingFriends.value.filter(friend => isMatch(friend, searchContent.value));
        });


        onMounted(getFriendshipsList);

        return {
            searchContent,
            showDeleteFriend,
            showAddFriend,
            searchUnFriend,
            addFriendSearchList,
            getUnAddFriendList,
            sendFriendRequest,
            acceptedFriends,
            pendingFriends,
            sendFriendRespond,
            showAddFriendInvite,
            showRejectFriendInvite,
            updateFriendStatus,
            userPlaceholder,
            isMatch,
            filteredAcceptedFriends,
            filteredPendingFriends
        };
    }
};
</script>


<style lang="scss" scoped>
    .friend-header{
        padding: 10px;
        .add-friend{
            display: flex;
            align-items: center;
            padding-left: 3em;
        }
        border-bottom: 0.5px solid rgb(180, 180, 180);

        &:hover{
            background-color: #ececec;
        }
    }

    .friend-container{
        display: flex;
        flex: 1;
        flex-direction: column;
        .friend-search{
            padding: 10px;
        }
    }

    .container-header{
        padding-left: 10px;
    }

    
    .container-body {
        display: flex;
        flex-direction: column;
        overflow-y: auto;
        min-height: 25vh;
    }

    .friend-data{
        display: flex;
        align-items: center;
        padding: 10px;
        justify-content: space-between;

        &:hover{
            background-color: #ececec;
        }
    }

    .friend-content{
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 10px;
    }

    /* 大頭貼容器 */
    .friend-avatar {
        margin-right: 10px; /* Add some space between avatar and text */
    }

    /* 使用者名稱區塊 */
    .friend-name {
        display: flex;
        flex-direction: column;
        justify-content: center;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }

    /* 顯示名稱 */
    .friend-showname {
        font-size: 16px;
        color: #333; /* Darker text color for showname */
        margin: 0;
        padding: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    /* 使用者名稱 */
    .friend-username {
        font-size: 12px;
        color: #5e5e5e;
        margin: 0;
        padding: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .friend-option{
        text-align: center;
    }

    .friend-hidden {
         display: none !important;
    }

    .clickable-icon {
        cursor: pointer;
    }

    .no-data{
        display: flex;
        justify-content: center;
        align-items: center;
    }
</style>