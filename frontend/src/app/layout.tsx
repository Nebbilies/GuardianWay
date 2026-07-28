import type { Metadata } from "next";
import {Inter} from 'next/font/google'
import "./globals.css";
import { cn } from "@/lib/utils";
import {Toaster} from "@/components/ui/sonner";
import {ThemeProvider} from "@/components/theme-provider";

const inter = Inter({subsets: ['latin', 'vietnamese'], variable: '--font-sans'});

export const metadata: Metadata = {
    title: "GuardianWay — Quản trị",
    description: "Hệ thống theo dõi xe buýt trường học GuardianWay",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html lang="vi" suppressHydrationWarning className={cn("font-sans", inter.variable)}>
      <body className="antialiased">
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          {children}
          <Toaster position={'bottom-right'} richColors/>
      </ThemeProvider>
      </body>
    </html>
  );
}
