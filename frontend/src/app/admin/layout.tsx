import React from "react";
import AdminSidebar from "@/app/admin/_components/admin-sidebar";
import {SidebarProvider} from "@/components/ui/sidebar";
import AdminHeader from "@/app/admin/_components/admin-header";

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <SidebarProvider>
            <div className={'min-h-screen w-full bg-white flex'}>
                <AdminSidebar/>
                <div className={'flex-1 flex flex-col'}>
                    <AdminHeader />
                    <main className={'flex-1 p-4'}>
                        {children}
                    </main>
                </div>
            </div>
        </SidebarProvider>
    )
}