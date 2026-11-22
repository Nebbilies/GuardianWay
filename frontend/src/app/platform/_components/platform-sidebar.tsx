"use client";

import { usePathname } from "next/navigation";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Building2, ScrollText } from "lucide-react";
import Link from "next/link";
import LogoutButton from "@/app/admin/_components/logout-button";

const NAV_ITEMS = [
    { href: "/platform/schools", label: "Trường học", icon: Building2 },
    { href: "/platform/audit", label: "Nhật ký", icon: ScrollText },
] as const;

export default function PlatformSidebar() {
    const pathname = usePathname();

    return (
        <Sidebar>
            <SidebarContent className={"pt-4"}>
                <SidebarMenu className={"gap-1 px-2"}>
                    {NAV_ITEMS.map((item) => {
                        const isActive =
                            pathname === item.href ||
                            pathname.startsWith(`${item.href}/`);
                        return (
                            <SidebarMenuItem key={item.href}>
                                <SidebarMenuButton asChild isActive={isActive}>
                                    <Link
                                        href={item.href}
                                        aria-current={
                                            isActive ? "page" : undefined
                                        }
                                    >
                                        <item.icon className={"h-5 w-5"} />
                                        <span className={"font-medium"}>
                                            {item.label}
                                        </span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        );
                    })}
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <LogoutButton />
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
