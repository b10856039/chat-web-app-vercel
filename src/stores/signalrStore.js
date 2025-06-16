// signalrStore.js

import { ref } from "vue";
import { defineStore } from "pinia";
import * as signalR from '@microsoft/signalr';

import { useRoomStore } from "./roomStore";

export const useSignalRStore = defineStore('signalR', () => {
    const connection = ref(null);
    const roomStore = useRoomStore();

    // 訊息接收 callback：由 component 註冊
    const messageCallback = ref(null);

    const initConnection = async (userId) => {
        connection.value = new signalR.HubConnectionBuilder()
            .withUrl(import.meta.env.VITE_API_URL + "chatHub")
            .build();

        await connection.value.start();
        console.log('SignalR connection Established');

        await connection.value.invoke("JoinAllChatRoom", userId);

        // 統一處理 ReceiveMessage
        connection.value.on("ReceiveMessage", (message) => {
            // 更新 roomList
            roomStore.roomList.forEach((room, index) => {
                if (room.id === message.chatRoomId) {
                    roomStore.roomList[index].latestMessage = message;
                }
            });

            // 呼叫 component 註冊的 callback
            if (typeof messageCallback.value === 'function') {
                messageCallback.value(message);
            }
        });
    };

    const registerMessageHandler = (callback) => {
        messageCallback.value = callback;
    };

    const sendMessage = async (chatroomId, userId, content) => {
        if (connection.value) {
            await connection.value.invoke('SendMessage', chatroomId, userId, content);
        }
    };

    const joinRoom = async (chatroomId) => {
        if (connection.value) {
            await connection.value.invoke('JoinChatRoom', chatroomId);
        }
    };

    const leaveRoom = async (chatroomId) => {
        if (connection.value) {
            await connection.value.invoke('LeaveChatRoom', chatroomId);
        }
    };

    const stopConnection = async () => {
        if (connection.value) {
            await connection.value.stop();
        }
    };

    const reset = async () => {
        await stopConnection(); // 確保關閉連線
        messageCallback.value = null;
    };


    return {
        connection,
        initConnection,
        sendMessage,
        joinRoom,
        leaveRoom,
        stopConnection,
        registerMessageHandler,
        reset
    };
});
