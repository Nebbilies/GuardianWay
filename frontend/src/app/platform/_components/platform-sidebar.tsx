'use client'

import { usePathname } from "next/navigation";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarMenu,
    SidebarHeader,
    SidebarMenuItem,
    SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Building2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import LogoutButton from "@/app/admin/_components/logout-button";

const NAV_ITEMS = [
    { href: '/platform/schools', label: 'Trường học', icon: Building2 },
] as const

export default function PlatformSidebar() {
    const pathname = usePathname()

    return (
        <Sidebar>
            <SidebarHeader className={'flex flex-col items-center py-4'}>
                <Link href={'/platform/schools'} className={'gap-2 flex items-center'}>
                    <div className={'flex h-12 w-12 bg-primary rounded-lg items-center justify-center'}>
                        <ShieldCheck className={'w-7 h-7 text-primary-foreground'} />
                    </div>
                    <div>
                        <span className={'text-lg font-bold text-foreground'}>GuardianWay</span>
                        <h3 className={'text-sm font-medium text-foreground/60'}>
                            Quản trị hệ thống
                        </h3>
                    </div>
                </Link>
            </SidebarHeader>
            <Separator />
            <SidebarContent className={'pt-4'}>
                <SidebarMenu className={'gap-1 px-2'}>
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                        return (
                            <SidebarMenuItem key={item.href}>
                                <SidebarMenuButton asChild isActive={isActive}>
                                    <Link href={item.href}>
                                        <item.icon className={'h-5 w-5'} />
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
                    <LogoutButton />
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}
