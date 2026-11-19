import React from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import PlatformSidebar from "@/app/platform/_components/platform-sidebar";
import PlatformHeader from "@/app/platform/_components/platform-header";

export default function PlatformLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <SidebarProvider className="gw-shell flex-col">
      <PlatformHeader />
      <div className="flex w-full flex-1">
        <PlatformSidebar />
        <main className="gw-workspace">{children}</main>
      </div>
    </SidebarProvider>
  );
}
