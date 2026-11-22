"use client";

import { LogOut } from "lucide-react";
import { navigateAfterSessionChange } from "@/lib/session-navigation";
import { useState } from "react";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { logoutWeb } from "@/modules/system/auth/contracts";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/i18n";

export default function LogoutButton() {
    const [loading, setLoading] = useState(false);

    async function handleLogout() {
        if (loading) return;
        setLoading(true);
        try {
            await logoutWeb();
            navigateAfterSessionChange("/login");
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    }

    return (
        <SidebarMenuButton onClick={handleLogout} disabled={loading}>
            <LogOut className={"w-8 h-8 text-destructive"} />
            <span className={"text-destructive"}>Đăng xuất</span>
        </SidebarMenuButton>
    );
}
