// userStore.js（新寫法）

import { ref } from "vue";
import { defineStore } from "pinia";

import ExceptMessageHandler from "@/utils/fetchExceptHandler";
import getImageType from "@/utils/imageHandle";

export const useUserStore = defineStore('user', () => {
    const user = ref(null);
    const userReady = ref(false);

    const getUser = async (userId) => {
        try {
            const url = new URL(import.meta.env.VITE_API_URL + "user" + "/" + userId);
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem('token')}`
                }
            });

            const data = await response.json();

            if (data.errors === null) {
                const u = {
                    userId: data.data.id,
                    username: data.data.username,
                    showname: data.data.showUsername,
                    photoImg: data.data.photoImg,
                    email: data.data.email,
                    phone: data.data.phone,
                    role: data.data.role,
                    state: data.data.state,
                };

                if (u.photoImg.length > 0) {
                    const imagetype = getImageType(u.photoImg);
                    u.photoImg = imagetype ? `data:${imagetype};base64,${u.photoImg}` : "";
                } else {
                    u.photoImg = "";
                }

                user.value = u;
            } else {
                ExceptMessageHandler(data.errors);
            }

        } catch (err) {
            console.log(err);
        }
    };

    const refreshUser = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(c => `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`)
                .join('')
        );

        const payload = JSON.parse(jsonPayload);
        await getUser(parseInt(payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']));
    };

    const reset = () => {
        user.value = null;
        user.userReady = false;
    }

    return {
        user,
        userReady,
        getUser,
        refreshUser,
        reset
    };
});
