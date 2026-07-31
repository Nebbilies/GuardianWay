'use client'

import {usePathname} from "next/navigation";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarMenu,
    SidebarHeader,
    SidebarMenuItem,
    SidebarMenuButton,
} from "@/components/ui/sidebar";
import {Bus, GraduationCap, MapPin, Navigation, Route, ScrollText, Users} from "lucide-react";
import Link from "next/link";
import {Separator} from "@/components/ui/separator";
import LogoutButton from "./logout-button";

const NAV_ITEMS = [
    {href: '/admin/stops', label: 'Điểm dừng', icon: MapPin},
    {href: '/admin/routes', label: 'Tuyến đường', icon: Route},
    {href: '/admin/buses', label: 'Xe buýt', icon: Bus},
    {href: '/admin/trips', label: 'Chuyến đi', icon: Navigation},
    {href: '/admin/students', label: 'Học sinh', icon: GraduationCap},
    {href: '/admin/users', label: 'Người dùng', icon: Users},
    {href: '/admin/audit', label: 'Nhật ký', icon: ScrollText},
] as const

export default function AdminSidebar() {
    const pathname = usePathname()

    return (
        <Sidebar>
            <SidebarHeader className={'flex flex-col items-center py-4'}>
                <Link href={'/'} className={'gap-2 flex items-center'}>
                    <div className={'flex h-12 w-12 bg-primary rounded-lg items-center justify-center'}>
                        <Bus className={'w-7 h-7 text-primary-foreground'}/>
                    </div>
                    <div>
                        <span className={'text-lg font-bold text-foreground'}>GuardianWay</span>
                        <h3 className={'text-sm font-medium text-foreground/60'}>
                            Admin Dashboard
                        </h3>
                    </div>
                </Link>
            </SidebarHeader>
            <Separator/>
            <SidebarContent className={'pt-4'}>
                <SidebarMenu className={'gap-1 px-2'}>
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                        return (
                            <SidebarMenuItem key={item.href}>
                                <SidebarMenuButton asChild isActive={isActive}>
                                    <Link href={item.href}>
                                        <item.icon className={'h-5 w-5'}/>
                                        <span className={'font-medium'}>{item.label}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        )
                    })}
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <LogoutButton/>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}
