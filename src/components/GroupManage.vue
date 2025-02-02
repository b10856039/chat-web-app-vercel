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
                <div v-for="(room,index) in hasjoinRoomList" :key="room.id" :class="['group-data', {'room-hidden': !isMatch(room, searchContent)}]">
                    <div class="group-roomname">
                        <span>{{ room.roomname }}</span>
                    </div>
                    <div class="group-option">
                        <DropDown title="選項">
                            <template #content>
                                <el-dropdown-menu >
                                    <el-dropdown-item v-if="checkUserRole(room)" v-on:click="showEditGroup = true;processRoomId = room.id" icon="edit">編輯</el-dropdown-item>
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
                <div v-for="(room,index) in unjoinRoomList" :key="room.Id" :class="['group-data', {'room-hidden': !isMatch(room, searchContent)}]">
                    <div class="group-roomname">
                        <span>{{ room.roomname }}</span>
                    </div>
                    <div class="group-option">
                        <el-icon v-on:click="showJoinGroup = true;processRoomId = room.id"><Plus /></el-icon>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <custom-dialog
        v-model="showAddGroup"
        title="建立群組"
    >
        <template #content>
            <input type="text" placeholder="輸入群組名稱" v-model="AddRoomName">
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
            <input type="text" placeholder="群組名稱" v-model="EditRoomName">
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
    import { ref, onMounted, watch, computed,inject } from 'vue';

    export default{
        components:{
            CustomDialog,
            DropDown
        },
        props:{
            user : Object
        },
        setup(props)
        {
            
            const searchContent = ref("");

            const showAddGroup = ref(false);
            const showEditGroup = ref(false);
            const showJoinGroup = ref(false);
            const showLeaveGroup = ref(false);
            const showDeleteGroup = ref(false);
            const processRoomId = ref(null);

            const token = localStorage.getItem('token');
            const payload = JSON.parse(atob(token.split('.')[1]));

            
            const hasjoinRoomList = ref([]);
            const unjoinRoomList = ref([]);

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


            const getRoomList = async (hasjoin) => {
                try
                {
                    const url = new URL("https://chat-web-app-backend-render.onrender.com/api/chatroom");
                    // const url = new URL("http://localhost:5266/api/chatroom");
                    url.searchParams.append('userId', props.user.userId);
                    

                    const roomType = 1;

                    url.searchParams.append('roomtype', roomType);
                    url.searchParams.append('hasjoin', hasjoin);
                    const response = await fetch(url, {
                        method: "GET",
                        headers:{
                            "Authorization": `Bearer ${localStorage.getItem('token')}`
                        }
                    });
                    const data = await response.json();

                    if(hasjoin){
                        hasjoinRoomList.value = data;
                    }else{
                        unjoinRoomList.value = data;
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
            const handleAddGroupConfirm = async ()=>{
                try{
                    const url = new URL("https://chat-web-app-backend-render.onrender.com/api/chatroom");
                    // const url = "http://localhost:5266/api/chatroom"
                    const response = await fetch(url, {
                        method: "POST",
                        headers: {
                        "Content-Type": "application/json", 
                        "Authorization": `Bearer ${localStorage.getItem('token')}`
                        },
                        body:JSON.stringify({
                            "Roomname": AddRoomName.value,
                            "CreatedByUserId":props.user.userId,
                            "RoomType":1
                        })
                    });
                    const data = await response.json();

                    showAddGroup.value = false;
                    AddRoomName.value = "";

                    await getRoomList(false);
                    await getRoomList(true);

                }catch(error)
                {
                    console.log(error)
                }
            }

            const EditRoomName = ref("");
            const handleEditGroupConfirm = async ()=>{
                try{
                    const url = new URL("https://chat-web-app-backend-render.onrender.com/api/chatroom/" + processRoomId.value);
                    // const url = "http://localhost:5266/api/chatroom/" + processRoomId.value
                    const response = await fetch(url, {
                        method: "PATCH",
                        headers: {
                        "Content-Type": "application/json", 
                        "Authorization": `Bearer ${localStorage.getItem('token')}`
                        },
                        body:JSON.stringify({
                            "Roomname": EditRoomName.value,
                        })
                    });
                    const data = await response.json();

                    
                    showEditGroup.value = false;
                    EditRoomName.value = "";
                    processRoomId.value = null;

                    await getRoomList(false);
                    await getRoomList(true);

                }catch(error)
                {
                    console.log(error)
                }
            }

            const handleDeleteGroupConfirm = async ()=>{
                try{
                    const url = new URL("https://chat-web-app-backend-render.onrender.com/api/chatroom/" + processRoomId.value);
                    // const url = "http://localhost:5266/api/chatroom/" + processRoomId.value

                    const response = await fetch(url, {
                        method: "DELETE",
                        headers: {
                        "Content-Type": "application/json", 
                        "Authorization": `Bearer ${localStorage.getItem('token')}`
                        }                        
                    });
                    const data = await response.json();


                    showDeleteGroup.value = false;
                    processRoomId.value = null;

                    await getRoomList(false);
                    await getRoomList(true);

                }catch(error)
                {
                    console.log(error)
                }
            }

            const handleJoinGroupConfirm = async ()=>{
                try{
                    const url = new URL("https://chat-web-app-backend-render.onrender.com/api/chatroom/" + processRoomId.value + '/join');
                    // const url = "http://localhost:5266/api/chatroom/" + processRoomId.value + '/join'
                    const response = await fetch(url, {
                        method: "POST",
                        headers: {
                        "Content-Type": "application/json", 
                        "Authorization": `Bearer ${localStorage.getItem('token')}`
                        },
                        body:JSON.stringify({
                            "UserId": props.user.userId
                        })          
                    });
                    const data = await response.json();

                    showJoinGroup.value = false;
                    processRoomId.value = null;

                    await getRoomList(false);
                    await getRoomList(true);
                }catch(error)
                {
                    console.log(error)
                }
            }

            const handleExitGroupConfirm = async ()=>{
                try{
                    const url = new URL("https://chat-web-app-backend-render.onrender.com/api/chatroom/" + processRoomId.value + '/leave');
                    // const url = "http://localhost:5266/api/chatroom/" + processRoomId.value + '/leave'
                    const response = await fetch(url, {
                        method: "DELETE",
                        headers: {
                        "Content-Type": "application/json", 
                        "Authorization": `Bearer ${localStorage.getItem('token')}`
                        },
                        body:JSON.stringify({
                            "UserId": props.user.userId
                        })                
                    });
                    const data = await response.json();
                    console.log(data)

                    showLeaveGroup.value = false;
                    processRoomId.value = null;

                    await getRoomList(false);
                    await getRoomList(true);

                }catch(error)
                {
                    console.log(error)
                }
            }

            const checkUserRole = (room)=>{
                const participants = room.participants;
                const userRole = participants.find( p => p.userId == props.user.userId);
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

                isMatch
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
            padding: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;

            .group-roomname{
                font-size: 18px;
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

</style> 