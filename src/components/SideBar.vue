<template>
    <div class="sidebar-wrapper">
        <div class="sidebar-header">
            <el-icon class="icon-button">
                <Promotion />
            </el-icon>
            <h4>聊天作品</h4>
        </div>
        <ul class="sidebar-links">
            <li @click="select('all')" :class="{'selected': selectedSection === 'all'}">
                <el-icon class="icon-button">
                    <House />
                </el-icon>
                <h4>全部</h4>
            </li>
            <li @click="select('friends')" :class="{'selected': selectedSection === 'friends'}" >
                <el-icon class="icon-button">
                    <User />
                </el-icon>
                <h4>朋友</h4>
            </li>
            <li @click="select('groups')" :class="{'selected': selectedSection === 'groups'}">
                <el-icon class="icon-button">
                    <User />
                    <User />
                </el-icon>
                <h4>群組</h4>
            </li>
            <li @click="select('manage')" :class="{'selected': selectedSection === 'manage'}">
                <el-icon class="icon-button">
                    <Management />
                </el-icon>
                <h4>管理</h4>
            </li>
        </ul>

        <div class="user-account">
            <UserSetting :user="user" @userUpdate="handleEmitData"></UserSetting>
        </div>
    </div>
</template>

<script>

    import {ref} from 'vue';
    import * as ElementPlusIconsVue from '@element-plus/icons-vue'
    import UserSetting from '@/components/UserSetting.vue';

    export default {
        components:{
            ElementPlusIconsVue,
            UserSetting,
        },
        props:{
            user : Object
        },
        emits: ['select','userUpdate'],
        setup(props,{emit}) {

            const selectedSection = ref('all'); // 初始化選中的區塊
            const select = (section) => {
                selectedSection.value = section; // 設定選中的區塊
                emit("select", section);
            }

            const handleEmitData = (data) => {
                console.log(data)
                emit('userUpdate',data)
            }

            return {
                select,
                selectedSection,
                handleEmitData
            }
        }
    }
</script>

<style lang="scss" scoped>
    .sidebar-wrapper{
        display: flex;
        flex-direction: column;
        background: #13213b;
        align-items: center;
        width: 100%;
        min-height: 100vh;
    }


    .sidebar-wrapper .sidebar-header {
        display: flex;
        align-items: center;
        flex-direction: column;
        padding: 10px;
        justify-content: center;
        color: #fff;
        h4{
            padding: 0;
            margin: 0;
            font-size: 16px;
        }
        .icon-button{
            padding: 0;
            align-items: center;
            justify-self: center;
            display: flex;
            gap:0;
            font-size:24px;
            color: #fff;
        }
    }


    .sidebar-links {
        list-style: none;
        margin-top: 10px;
        padding: 0;
        width: 100%;
        li {
            padding: 20px;
            cursor: pointer;
            transition: color 0.3s, border-color 0.3s, box-shadow 0.3s;
            .icon-button{
                padding: 0;
                align-items: center;
                justify-self: center;
                display: flex;
                gap:0;
                font-size:24px;
                color: #fff;
            }


            h4 {
                align-items: center;
                justify-self: center;
                margin: 0;
                padding: 0;
                color: #fff;
                font-size: 14px;
                font-weight: 500;
                white-space: nowrap;
                text-decoration: none;
                transition: 0.2s ease;
            }
        }
    }

    /* 動態樣式 選中的區塊變色 */
    .sidebar-links li.selected {
        background-color: rgba(91, 125, 161, 0.8); /* 你可以改變這個顏色 */
        h4{
            color: #000000;
        }
        .icon-button{
            color: #000000;
        }
    }

    .sidebar-links li:hover {
        background-color: rgba(91, 125, 161, 0.8);
        h4{
            color: #000000;
        }
        .icon-button{
            color: #000000;
        }
    }


    .user-account {
        margin-top: auto;
        width: 50px;
        height: 50px;
        display: flex;
        margin-bottom: 10px;
        align-items: center; /* 垂直居中 */
        justify-content: center; /* 水平居中 */
        overflow: hidden; 
        border-radius: 50%;
        background-color: #d6d6d6;
    }


    @media (max-width: 768px) {
        .sidebar-header h4{
            font-size: 12px !important;
        }
    }

</style>