"use client";

import {LogOut} from "lucide-react";
import {useRouter} from "next/navigation";
import {useState} from "react";
import {SidebarMenuButton} from "@/components/ui/sidebar";
import {apiRequest} from "@/lib/api-client";

export default function LogoutButton() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    async function handleLogout() {
        if (loading) return;
        setLoading(true);
        try {
            await apiRequest("/auth/logout", {method: "POST"});
        } catch {

        } finally {
            router.push("/login");
            router.refresh();
        }
    }

    return (
        <SidebarMenuButton onClick={handleLogout} disabled={loading}>
            <LogOut className={'w-8 h-8 text-destructive'}/>
            <span className={'text-destructive'}>
                Đăng xuất
            </span>
        </SidebarMenuButton>
    );
}
