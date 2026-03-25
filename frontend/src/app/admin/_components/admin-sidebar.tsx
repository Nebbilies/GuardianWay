import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarMenu,
    SidebarHeader, SidebarMenuSub, SidebarMenuSubItem, SidebarMenuItem, SidebarMenuButton,
    SidebarMenuSubButton
} from "@/components/ui/sidebar";
import {Bus, ChevronDown, LogOut, MapPin} from "lucide-react";
import Link from "next/link";
import {Separator} from "@/components/ui/separator";
import {Collapsible, CollapsibleContent, CollapsibleTrigger} from "@/components/ui/collapsible";

export default function AdminSidebar() {
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
                <SidebarMenu>
                    <Collapsible defaultOpen className="group/collapsible">
                        <SidebarMenuItem>
                            <CollapsibleTrigger asChild>
                                <SidebarMenuButton>
                                    <MapPin className={'h-8 w-8'}/>
                                    <span className={'font-semibold'}>Quản lý điểm dừng</span>
                                    <ChevronDown className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                                </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <SidebarMenuSub>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton href={'/admin/stops'}>
                                            Danh sách điểm dừng
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton href={'/admin/stops/add'}>
                                            Thêm điểm dừng
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                </SidebarMenuSub>
                            </CollapsibleContent>
                        </SidebarMenuItem>
                    </Collapsible>
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuButton>
                        <LogOut className={'w-8 h-8'}/>
                        <span className={'text-destructive'}>
                            Đăng xuất
                        </span>
                    </SidebarMenuButton>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>

    )
}