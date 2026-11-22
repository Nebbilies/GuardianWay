"use client";

import Image from "next/image";
import Link from "next/link";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import ModeToggle from "@/app/admin/_components/mode-toggle";
import { LanguageSwitch } from "@/components/language-switch";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";

export function PortalHeader({
    context,
    home,
}: {
    context: string;
    home: string;
}) {
    const { isMobile, openMobile, open, toggleSidebar } = useSidebar();
    const expanded = isMobile ? openMobile : open;
    const ToggleIcon = expanded ? PanelLeftClose : PanelLeftOpen;

    return (
        <header className="gw-banner">
            <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={toggleSidebar}
                aria-expanded={expanded}
                aria-label={expanded ? "Thu gọn thanh bên" : "Mở thanh bên"}
            >
                <ToggleIcon />
            </Button>
            <Link
                href={home}
                className="flex shrink-0 items-center gap-2 font-bold"
                aria-label="GuardianWay"
            >
                <Image
                    src="/guardianway-symbol.svg"
                    width={30}
                    height={30}
                    alt=""
                    className="rounded bg-white p-1"
                />
                <span className="hidden sm:inline">GuardianWay</span>
            </Link>
            <span
                className="min-w-0 flex-1 truncate border-l border-current/40 pl-3 text-sm font-semibold"
                title={context}
            >
                {context}
            </span>
            <LanguageSwitch />
            <ModeToggle />
        </header>
    );
}
