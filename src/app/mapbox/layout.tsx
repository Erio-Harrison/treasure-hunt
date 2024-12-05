"use client";  // 这个指令确保该组件在客户端渲染

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/ui/app-sidebar";
import { useSession } from "next-auth/react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession(); // 获取用户会话

  if (!session || !session.user) {
    throw new Error("Session is null or user is not authenticated.");
  }
  const { name, email, image } = session.user;

  return (
    <SidebarProvider>
      <AppSidebar userName={name || "shadcn"} email={email || "m@example.com"} userImage={image || undefined} />

      <main>
        <SidebarTrigger />
        {children}
      </main>
    </SidebarProvider>
  );
}
