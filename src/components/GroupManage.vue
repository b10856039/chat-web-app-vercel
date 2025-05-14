<template>
    <div class="group-header" v-on:click="showAddGroup = true">
        <span class="add-group">
            <el-icon ><Plus /></el-icon>
            <p>建立群組</p>
        </span>
    </div>
    <div class="group-container">
        <div class="group-search">
            <el-input
                v-model="searchContent"
                placeholder="請輸入群組"
                clearable
                class="input-with-icon"
            >
                <template #prefix>
                <el-icon>
                    <Search />
                </el-icon>
                </template>
            </el-input>
        </div>

        <div>
            <div class="container-header">
                <h4>已加入的群組</h4>
            </div>
            <div class="container-body join">
                <div v-if="hasjoinRoomList.length === 0" class="no-data">無</div>
                <div v-else-if="filteredHasjoinRoomList.length === 0" class="no-data">未找到匹配的群組</div>
                <div v-for="(room,index) in hasjoinRoomList" :key="room.id" :class="['group-data', {'room-hidden': !isMatch(room, searchContent)}]">
                    <div class="group-content">
                        <div class="group-avatar">
                            <el-avatar v-if="room.photoImg" :size="50" :src="room.photoImg"/>
                            <el-avatar v-else :src="textPlaceholder" :size="50"></el-avatar>
                        </div>
                        <div class="group-roomname">
                            <span>{{ room.roomname }}</span>
                        </div>
                    </div>
                    <div class="group-option">
                        <DropDown title="選項">
                            <template #content>
                                <el-dropdown-menu >
                                    <el-dropdown-item v-if="checkUserRole(room)" v-on:click="showEditGroup = true;processRoomId = room.id;EditRoomName = room.roomname;EditAvatar = room.photoImg" icon="edit">編輯</el-dropdown-item>
                                    <el-dropdown-item v-if="!checkUserRole(room)" v-on:click="showLeaveGroup = true;processRoomId = room.id" icon="close">退出</el-dropdown-item>
                                    <el-dropdown-item v-if="checkUserRole(room)" v-on:click="showDeleteGroup = true;processRoomId = room.id" icon="delete">刪除</el-dropdown-item>
                                </el-dropdown-menu>
                            </template>
                        </DropDown>
                    </div>
                </div>
            </div>
        </div>
        <div>
            <div class="container-header">
                <h4>可加入的群組</h4>
            </div>
            <div class="container-body unjoin">
                <div v-if="unjoinRoomList.length === 0" class="no-data">無</div>
                <div v-else-if="filteredUnjoinRoomList.length === 0" class="no-data">未找到匹配的群組</div>
                <div v-for="(room,index) in unjoinRoomList" :key="room.Id" :class="['group-data', {'room-hidden': !isMatch(room, searchContent)}]">
                    <div class="group-roomname">
                        <span>{{ room.roomname }}</span>
                    </div>
                    <div class="group-option">
                        <el-icon class="clickable-icon"  v-on:click="showJoinGroup = true;processRoomId = room.id"><Plus /></el-icon>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <custom-dialog
        v-model="showAddGroup"
        title="建立群組"
        :beforeClose="function(){showAddGroup = false;AddRoomName = ''}"
    >
        <template #content>
            <div class="dialog-avatarHeader">
                <AvatarUploader :defaultImgUrl="defaultImgUrl" @AvatarUpdate="handleAvatarAdd"></AvatarUploader>
            </div>
            <div class="dialog-avatarBody">
                <el-form-item label="新群組名稱:" prop="AddRoomName">
                    <el-input v-model="AddRoomName" placeholder="輸入群組名稱"/>
                </el-form-item>
            </div>

        </template>
        <template #footer>
        <el-button @click="showAddGroup = false">取消</el-button>
        <el-button type="primary" @click="handleAddGroupConfirm">建立</el-button>
        </template>
    </custom-dialog>

    <custom-dialog
        v-model="showEditGroup"
        title="編輯群組"
    >
        <template #content>
            <div class="dialog-avatarHeader">
                <AvatarUploader :defaultImgUrl="defaultImgUrl" :photoImg="EditAvatar" @AvatarUpdate="handleAvatarUpdate"></AvatarUploader>
            </div>
            <div class="dialog-avatarBody">
                <el-form-item label="群組名稱:" prop="EditRoomName">
                    <el-input v-model="EditRoomName" placeholder="群組名稱"/>
                </el-form-item>
            </div>


        </template>
        <template #footer>
        <el-button @click="showEditGroup = false">取消</el-button>
        <el-button type="primary" @click="handleEditGroupConfirm">完成</el-button>
        </template>
    </custom-dialog>

    <custom-dialog
        v-model="showDeleteGroup"
        title="刪除群組"
    >
        <template #content>
            <h4>確定要刪除該群組，將無法再查看內容</h4>
        </template>
        <template #footer>
        <el-button @click="showDeleteGroup = false">取消</el-button>
        <el-button type="primary" @click="handleDeleteGroupConfirm">刪除</el-button>
        </template>
    </custom-dialog>

    <custom-dialog
        v-model="showJoinGroup"
        title="加入群組"
    >
        <template #content>
            <h4>是否要加入該群組</h4>
        </template>
        <template #footer>
        <el-button @click="showJoinGroup = false">取消</el-button>
        <el-button type="primary" @click="handleJoinGroupConfirm">確定</el-button>
        </template>
    </custom-dialog>

    <custom-dialog
        v-model="showLeaveGroup"
        title="離開群組"
    >
        <template #content>
            <h4>是否要離開該群組</h4>
        </template>
        <template #footer>
        <el-button @click="showLeaveGroup = false">取消</el-button>
        <el-button type="primary" @click="handleExitGroupConfirm">確定</el-button>
        </template>
    </custom-dialog>
</template>

<script>
    import CustomDialog from "@/components/Dialog.vue";
    import DropDown from "@/components/DropDown.vue";
    import AvatarUploader from './AvatarUploader.vue';
    import { ref, onMounted, watch, computed,inject } from 'vue';
    import { ElMessage } from "element-plus";
    import getImageType from "@/utils/imageHandle";
    import textPlaceholder from "@/assets/textchat.png";
    import ExceptMessageHandler from "@/utils/fetchExceptHandler";
    import { useUserStore } from "@/stores/userStore";
    import { useRoomStore } from "@/stores/roomStore";

    export default{
        components:{
            CustomDialog,
            DropDown,
            AvatarUploader
        },
        setup()
        {

            const userStore = useUserStore();
            const roomStore = useRoomStore();
            
            const searchContent = ref("");

            const showAddGroup = ref(false);
            const showEditGroup = ref(false);
            const showJoinGroup = ref(false);
            const showLeaveGroup = ref(false);
            const showDeleteGroup = ref(false);
            const processRoomId = ref(null);
            
            const hasjoinRoomList = ref([]);
            const unjoinRoomList = ref([]);

            
            const defaultImgUrl = ref("src/assets/textchat.png");

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

            const filteredHasjoinRoomList = computed(() => {
                return hasjoinRoomList.value.filter(room => isMatch(room, searchContent.value));
            });

            const filteredUnjoinRoomList = computed(() => {
                return unjoinRoomList.value.filter(room => isMatch(room, searchContent.value));
            });


            const getRoomList = async (hasjoin) => {
                try
                {
                    const url = new URL( import.meta.env.VITE_API_URL + "chatroom");
                    url.searchParams.append('userId', userStore.user.userId);
                    

                    const roomType = 1;

                    url.searchParams.append('roomtype', roomType);
                    url.searchParams.append('hasjoin', hasjoin);
                    const response = await fetch(url, {
                        method: "GET",
                        headers:{
                            "Authorization": `Bearer ${localStorage.getItem('token')}`
                        }
                    });
                    let data = await response.json();

                    if(data.errors===null)
                    {
                        data = data.data.map( (room) => {
                            if (room.photoImg.length > 0) {
                            const imagetype = getImageType(room.photoImg);
                            room.photoImg = imagetype ? `data:${imagetype};base64,${room.photoImg}` : ""
                                return room;
                                } else {
                                room.photoImg = ""
                                return room;
                            }
                        })

                        if(hasjoin){
                            hasjoinRoomList.value = data;
                        }else{
                            unjoinRoomList.value = data;
                        }
                    }
                    else
                    {
                        ExceptMessageHandler(data.errors);
                    }
                    
                }
                catch(error)
                {
                    console.log(error)
                }
            }

            onMounted(async ()=>{

                await getRoomList(false);
                await getRoomList(true);

            });

            const AddRoomName = ref('');
            const AddRoomAvatar = ref(null);
            const handleAvatarAdd = (value) => {
                AddRoomAvatar.value = value
            }

            const handleAddGroupConfirm = async ()=>{
                try{

                    if(AddRoomName.value == ""){
                        ElMessage.warning('名稱不可為空');
                    }

                    const newData = {
                        "Roomname": AddRoomName.value,
                        "CreatedByUserId":userStore.user.userId,
                        "RoomType":1
                    }

                    if(AddRoomAvatar.value!= null){
                        newData.PhotoImg = AddRoomAvatar.value;
                    }

                    const url = new URL( import.meta.env.VITE_API_URL + "chatroom");
                    const response = await fetch(url, {
                        method: "POST",
                        headers: {
                        "Content-Type": "application/json", 
                        "Authorization": `Bearer ${localStorage.getItem('token')}`
                        },
                        body:JSON.stringify(newData)
                    });
                    const data = await response.json();

                    if(data.errors===null)
                    {
                        ElMessage.success(data.data)
                        showAddGroup.value = false;
                        AddRoomName.value = "";
                        AddRoomAvatar.value = null;

                        await getRoomList(false);
                        await getRoomList(true);

                        if (roomStore.currentChat) {
                            try {
                                roomStore.currentChat = null;
                            } catch (error) {
                                console.error("Error leaving chat room:", error);
                            }
                        }

                    }
                    else
                    {
                        ExceptMessageHandler(data.errors);
                    }

                }catch(error)
                {
                    console.log(error)
                }
            }

            const EditRoomName = ref("");
            const EditRoomAvatar = ref(null);
            const handleAvatarUpdate = (value) => {
                EditRoomAvatar.value = value
            }
            const handleEditGroupConfirm = async ()=>{
                try{

                    if(EditRoomName.value == ""){
                        ElMessage.warning('名稱不可為空');
                        return
                    }
                
                    const newData = {
                        "Roomname": EditRoomName.value,
                        "UserId" : userStore.user.userId
                    }

                    if(EditRoomName.value!= null){
                        newData.PhotoImg = EditRoomAvatar.value;
                    }

                    const url = new URL(import.meta.env.VITE_API_URL + "chatroom/" + processRoomId.value);
                    // const url = "http://localhost:5266/api/chatroom/" + processRoomId.value
                    const response = await fetch(url, {
                        method: "PATCH",
                        headers: {
                        "Content-Type": "application/json", 
                        "Authorization": `Bearer ${localStorage.getItem('token')}`
                        },
                        body:JSON.stringify(newData)
                    });
                    const data = await response.json();
                    
                    if(data.errors===null)
                    {
                        ElMessage.success(data.data)
                        showEditGroup.value = false;
                        EditRoomName.value = "";
                        processRoomId.value = null;

                        await getRoomList(false);
                        await getRoomList(true);
                    }
                    else
                    {
                        console.log(data.errors)
                        ExceptMessageHandler(data.errors);
                    }


                }catch(error)
                {
                    console.log(error)
                }
            }

            const handleDeleteGroupConfirm = async ()=>{
                try{
                    const url = new URL( import.meta.env.VITE_API_URL + "chatroom/" + processRoomId.value);
                    url.searchParams.append('userId',userStore.user.userId);
                    // const url = "http://localhost:5266/api/chatroom/" + processRoomId.value

                    const response = await fetch(url, {
                        method: "DELETE",
                        headers: {
                        "Content-Type": "application/json", 
                        "Authorization": `Bearer ${localStorage.getItem('token')}`
                        }                        
                    });
                    const data = await response.json();

                    if(data.errors===null)
                    {
                        ElMessage.success(data.data)
                        showDeleteGroup.value = false;
                        processRoomId.value = null;

                        await getRoomList(false);
                        await getRoomList(true);

                        if (roomStore.currentChat) {
                            try {
                                roomStore.currentChat = null;
                            } catch (error) {
                                console.error("Error leaving chat room:", error);
                            }
                        }

                    }
                    else
                    {
                        ExceptMessageHandler(data.errors);
                    }




                }catch(error)
                {
                    console.log(error)
                }
            }

            const handleJoinGroupConfirm = async ()=>{
                try{
                    const url = new URL(import.meta.env.VITE_API_URL + "chatroom/" + processRoomId.value + '/join');
                    // const url = "http://localhost:5266/api/chatroom/" + processRoomId.value + '/join'
                    const response = await fetch(url, {
                        method: "POST",
                        headers: {
                        "Content-Type": "application/json", 
                        "Authorization": `Bearer ${localStorage.getItem('token')}`
                        },
                        body:JSON.stringify({
                            "UserId": userStore.user.userId
                        })          
                    });
                    const data = await response.json();

                    if(data.errors===null)
                    {
                        ElMessage.success(data.data)
                        showJoinGroup.value = false;
                        processRoomId.value = null;

                        await getRoomList(false);
                        await getRoomList(true);

                        if (roomStore.currentChat) {
                            try {
                                roomStore.currentChat = null;
                            } catch (error) {
                                console.error("Error leaving chat room:", error);
                            }
                        }
                    }
                    else
                    {
                        ExceptMessageHandler(data.errors);
                    }

                }catch(error)
                {
                    console.log(error)
                }
            }

            const handleExitGroupConfirm = async ()=>{
                try{
                    const url = new URL(import.meta.env.VITE_API_URL + "chatroom/" + processRoomId.value + '/leave');
                    // const url = "http://localhost:5266/api/chatroom/" + processRoomId.value + '/leave'
                    const response = await fetch(url, {
                        method: "DELETE",
                        headers: {
                        "Content-Type": "application/json", 
                        "Authorization": `Bearer ${localStorage.getItem('token')}`
                        },
                        body:JSON.stringify({
                            "UserId": userStore.user.userId
                        })                
                    });
                    const data = await response.json();
                    if(data.errors===null)
                    {
                        ElMessage.success(data.data)
                        showLeaveGroup.value = false;
                        processRoomId.value = null;

                        await getRoomList(false);
                        await getRoomList(true);

                        if (roomStore.currentChat) {
                            try {
                                roomStore.currentChat = null;
                            } catch (error) {
                                console.error("Error leaving chat room:", error);
                            }
                        }

                    }
                    else
                    {
                        ExceptMessageHandler(data.errors);
                    }


                }catch(error)
                {
                    console.log(error)
                }
            }

            const checkUserRole = (room)=>{
                const participants = room.participants;
                const userRole = participants.find( p => p.userId == userStore.user.userId);
                if(userRole.role == 0){
                    return true;
                }else{
                    return false;
                }
            }

            return{
                searchContent,

                hasjoinRoomList,
                unjoinRoomList,
                checkUserRole,
                processRoomId,


                AddRoomName,
                EditRoomName,

                showAddGroup,
                showEditGroup,
                showDeleteGroup,
                showJoinGroup,
                showLeaveGroup,

                handleAddGroupConfirm,
                handleEditGroupConfirm,
                handleDeleteGroupConfirm,
                handleJoinGroupConfirm,
                handleExitGroupConfirm,

                isMatch,
                filteredHasjoinRoomList,
                filteredUnjoinRoomList,
                defaultImgUrl,
                handleAvatarAdd,
                handleAvatarUpdate,
                textPlaceholder
            }
        }
    }
</script>


<style lang="scss" scoped>
    .group-header{
        padding: 10px;
        .add-group{
            display: flex;
            align-items: center;
            padding-left: 3em;
        }
        border-bottom: 0.5px solid rgb(180, 180, 180);

        &:hover{
            background-color: #ececec;
        }
    }



    .group-container{
        display: flex;
        flex: 1;
        flex-direction: column;
        .group-search{
            padding: 10px;
        }
    }

    .container-header{
        padding: 10px;
    }

    .container-body {
        display: flex;
        flex-direction: column;

        .join{
            max-height: 50%;
            overflow-y: scroll;
        }

        .unjoin{
            max-height: 50%;
            overflow-y: scroll;
        }

        .group-data {
            padding: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;

            .group-content{
                display: flex;
                align-items: center;
                justify-content: center;

                .group-roomname{
                    font-size: 18px;
                }
            }



            .group-option {
                display: flex;
                justify-content: center;
                align-items: center;
            }

            &:hover{
                background-color: #ececec;
            }
        }
    }

    .room-hidden {
         display: none !important;
    }

    .clickable-icon {
        cursor: pointer;
    }

    .dialog-avatarHeader{
        padding-bottom: 10px;
        border-bottom: 1px solid #e8e8e8;
    }

    .dialog-avatarBody{
        padding-top: 20px;
    }

    .no-data{
        display: flex;
        justify-content: center;
        align-items: center;
    }

</style> 