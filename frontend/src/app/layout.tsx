import type { Metadata } from "next";
import { Noto_Sans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { I18nProvider } from "@/components/i18n-provider";

const noto = Noto_Sans({
  subsets: ["latin", "vietnamese"],
  variable: "--font-interface",
});

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
    <html
      lang="vi"
      suppressHydrationWarning
      className={cn("font-sans", noto.variable)}
    >
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <I18nProvider>
            {children}
            <Toaster position={"bottom-right"} richColors />
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
