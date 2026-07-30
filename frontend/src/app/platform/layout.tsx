import React from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import PlatformSidebar from "@/app/platform/_components/platform-sidebar";
import PlatformHeader from "@/app/platform/_components/platform-header";

export default function PlatformLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <SidebarProvider>
            <div className={'min-h-screen w-full bg-background flex'}>
                <PlatformSidebar />
                <div className={'flex-1 flex flex-col'}>
                    <PlatformHeader />
                    <main className={'flex-1 p-4'}>
                        {children}
                    </main>
                </div>
            </div>
        </SidebarProvider>
    )
}
