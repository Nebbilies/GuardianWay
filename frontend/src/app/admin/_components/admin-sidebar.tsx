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
import {
    Bus,
    ClipboardList,
    GraduationCap,
    MapPin,
    Navigation,
    Route,
    ScrollText,
    Users,
} from "lucide-react";
import Link from "next/link";
import LogoutButton from "./logout-button";
import { registrationListPath } from "@/modules/transport/registration-review/paths";

const sections = [
    {
        name: "Hồ sơ và nguồn lực",
        items: [
            { href: "/admin/students", label: "Học sinh", icon: GraduationCap },
            { href: "/admin/drivers", label: "Hồ sơ tài xế", icon: Users },
            { href: "/admin/buses", label: "Xe buýt", icon: Bus },
        ],
    },
    {
        name: "Kế hoạch và chuyến",
        items: [
            ...(process.env.NODE_ENV === "development"
                ? [
                      {
                          href: registrationListPath,
                          label: "Đăng ký xe",
                          icon: ClipboardList,
                      },
                  ]
                : []),
            { href: "/admin/stops", label: "Điểm dừng", icon: MapPin },
            { href: "/admin/routes", label: "Phương án tuyến", icon: Route },
            {
                href: "/admin/schedules",
                label: "Lịch định kỳ",
                icon: Navigation,
            },
            { href: "/admin/trips", label: "Chuyến đi", icon: Navigation },
        ],
    },
    {
        name: "Quản trị",
        items: [
            { href: "/admin/users", label: "Người dùng", icon: Users },
            { href: "/admin/policies", label: "Cấu hình vận tải", icon: Route },
            { href: "/admin/audit", label: "Nhật ký", icon: ScrollText },
        ],
    },
] as const;

export default function AdminSidebar() {
    const pathname = usePathname();

    return (
        <Sidebar>
            <SidebarContent className={"pt-4"}>
                {sections.map((section) => (
                    <section key={section.name} className="mb-3 px-2">
                        <h2 className="px-2 pb-1 text-xs font-semibold text-muted-foreground">
                            {section.name}
                        </h2>
                        <SidebarMenu className="gap-1">
                            {section.items.map((item) => {
                                const isActive =
                                    pathname === item.href ||
                                    pathname.startsWith(`${item.href}/`);
                                return (
                                    <SidebarMenuItem key={item.href}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={isActive}
                                        >
                                            <Link
                                                href={item.href}
                                                aria-current={
                                                    isActive
                                                        ? "page"
                                                        : undefined
                                                }
                                            >
                                                <item.icon
                                                    className={"h-5 w-5"}
                                                />
                                                <span className={"font-medium"}>
                                                    {item.label}
                                                </span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </section>
                ))}
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <LogoutButton />
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
