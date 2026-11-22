import React from "react";
import AdminSidebar from "@/app/admin/_components/admin-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import AdminHeader from "@/app/admin/_components/admin-header";

export default function AdminLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return (
        <SidebarProvider className="gw-shell flex-col">
            <AdminHeader />
            <div className="flex w-full flex-1">
                <AdminSidebar />
                <main className="gw-workspace">{children}</main>
            </div>
        </SidebarProvider>
    );
}
