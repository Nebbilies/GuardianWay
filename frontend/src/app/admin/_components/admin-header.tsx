'use client';

import {useSidebar} from "@/components/ui/sidebar";
import {SidebarCloseIcon, SidebarOpenIcon} from "lucide-react";

export default function AdminHeader() {
    const { toggleSidebar, open } = useSidebar();
    return (
        <header className={'w-full h-20 bg-white border-b border-border flex items-center justify-between px-4'}>
            {open ? (
                <SidebarCloseIcon className={'w-6 h-6 text-foreground cursor-pointer'} onClick={toggleSidebar} />
            ) : (
                <SidebarOpenIcon className={'w-6 h-6 text-foreground cursor-pointer'} onClick={toggleSidebar} />
            )}
        </header>
    )
}