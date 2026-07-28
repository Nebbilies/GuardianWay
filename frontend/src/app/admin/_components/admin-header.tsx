'use client';

import {usePathname} from "next/navigation";
import {useSidebar} from "@/components/ui/sidebar";
import {SidebarCloseIcon, SidebarOpenIcon} from "lucide-react";
import {Button} from "@/components/ui/button";
import ModeToggle from "./mode-toggle";

const PAGE_TITLES: Record<string, string> = {
    '/admin/stops': 'Điểm dừng',
    '/admin/routes': 'Tuyến đường',
    '/admin/buses': 'Xe buýt',
    '/admin/trips': 'Chuyến đi',
    '/admin/students': 'Học sinh',
    '/admin/users': 'Người dùng',
};

export default function AdminHeader() {
    const {toggleSidebar, open} = useSidebar();
    const pathname = usePathname();
    const title = PAGE_TITLES[pathname] ?? 'Quản trị';

    return (
        <header className={'w-full h-16 bg-background border-b border-border flex items-center justify-between px-4'}>
            <div className={'flex items-center gap-3'}>
                <Button variant="ghost" size="icon" onClick={toggleSidebar}
                        aria-label={open ? 'Thu gọn thanh bên' : 'Mở thanh bên'}>
                    {open ? <SidebarCloseIcon className={'h-5 w-5'}/> : <SidebarOpenIcon className={'h-5 w-5'}/>}
                </Button>
                <h2 className={'text-base font-semibold text-foreground'}>{title}</h2>
            </div>
            <ModeToggle/>
        </header>
    )
}
