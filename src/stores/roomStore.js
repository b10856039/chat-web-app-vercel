// roomStore.js

import { ref } from "vue";
import { defineStore } from "pinia";

import { useUserStore } from "@/stores/userStore";
import getImageType from "@/utils/imageHandle";
import ExceptMessageHandler from "@/utils/fetchExceptHandler";

export const useRoomStore = defineStore('room', () => {
    const roomList = ref([]);
    const currentSection = ref('all');
    const currentChat = ref(null);

    const setCurrentSection = async (section) => {
        currentSection.value = section;
        await getRoomList();
        if (roomList.value.length > 0) {
            await getLatestMessages();
        }
    };

    const getRoomList = async () => {
        try {
            roomList.value = [];
            const userStore = useUserStore();
            const url = new URL(import.meta.env.VITE_API_URL + "chatroom");

            url.searchParams.append('userId', userStore.user.userId);

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

            if (data.errors === null) {
                roomList.value = data.data.map((room) => {
                    if (room.photoImg.length > 0) {
                        const imagetype = getImageType(room.photoImg);
                        room.photoImg = imagetype ? `data:${imagetype};base64,${room.photoImg}` : "";
                    } else {
                        room.photoImg = "";
                    }
                    return room;
                });
            } else {
                ExceptMessageHandler(data.errors);
            }


        } catch (error) {
            console.error("Error fetching chat rooms:", error);
        }
    };

    const handleCurrentChatLatestMsg = async () => {
        const userStore = useUserStore();
        await getRoomList();
        if (roomList.value.length > 0) {
            await getLatestMessages();
            userStore.userReady = true;
        } else {
            userStore.userReady = true;
        }
    };

    const getLatestMessages = async () => {
        try {
            const userStore = useUserStore();
            const updateMessages = roomList.value.map(async (room) => {
                const url = new URL(import.meta.env.VITE_API_URL + "message");
                url.searchParams.append('userId', userStore.user.userId);
                url.searchParams.append('chatroomId', room.id);
                url.searchParams.append('latestOne', true);

                const response = await fetch(url, {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${localStorage.getItem('token')}`
                    }
                });
                const data = await response.json();

                if (data.errors === null) {
                    const latestMessage = data.data[0];
                    if (latestMessage) {
                        const roomToUpdate = roomList.value.find(r => r.id === room.id);
                        if (roomToUpdate) {
                            roomToUpdate.latestMessage = latestMessage;
                        }
                    }
                } else {
                    ExceptMessageHandler(data.errors);
                }
            });

            await Promise.all(updateMessages);

            roomList.value.sort((a, b) => {
                if (!a.latestMessage) return 1;
                if (!b.latestMessage) return -1;
                return new Date(b.latestMessage.sentAt) - new Date(a.latestMessage.sentAt);
            });

        } catch (error) {
            console.error("Error fetching latest messages:", error);
        }
    };

    const reset = () => {
        roomList.value = [];
        currentSection.value = 'all';
        currentChat.value = null;
    }
    
    return {
        roomList,
        currentSection,
        currentChat,
        setCurrentSection,
        getRoomList,
        handleCurrentChatLatestMsg,
        getLatestMessages,
        reset
    };
});
