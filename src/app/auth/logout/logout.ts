"use client";  // 这个指令确保该组件在客户端渲染
import { signOut as nextAuthSignOut } from "next-auth/react";

/**
 * 根据不同的认证提供者选择远程退出
 * @param provider - 认证提供者名称 (如 google, facebook, discord 等)
 * @param callbackUrl - 退出后跳转的 URL
 */
export const logout = async (callbackUrl: string = "/auth/login") => {
    try {
        //调试代码
        const provider = "google";


        // 调用服务器端的 API 来发起远程退出请求
        const response = await fetch(`/api/logout?provider=${provider}`);

        const result = await response.json();

        if (response.ok) {
            // 调用 NextAuth 的 signOut 方法进行本地注销
            await nextAuthSignOut({ callbackUrl });
        } else {
            console.error(result.message);
        }
    } catch (error) {

    }
};
