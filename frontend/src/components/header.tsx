"use client"
import Link from "next/link";

import {useState} from "react";
import {Bus, Menu, X} from "lucide-react";
import {Button} from "@/components/ui/button";

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <header className={'sticky top-0 z-50 bg-background border-b border-border backdrop-blur w-full'}>
            <div className={'container mx-auto flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8'}>
                <Link href={'/'} className={'gap-2 flex items-center'}>
                    <div className={'flex h-9 w-9 bg-primary rounded-lg items-center justify-center'}>
                        <Bus className={'w-5 h-5 text-primary-foreground'}/>
                    </div>
                    <span className={'text-lg font-bold text-foreground'}>GuardianWay</span>
                </Link>

                <nav className={'hidden md:flex items-center justify-between gap-8'}>
                    <Link href={'#features'}>
                        <span className={'text-sm font-medium text-foreground/80 hover:text-foreground transition-colors'}>Tính năng</span>
                    </Link>
                    <Link href={'#how-to-use'}>
                        <span className={'text-sm font-medium text-foreground/80 hover:text-foreground transition-colors'}>Hướng dẫn sử dụng</span>
                    </Link>
                    <Link href={'#contact'}>
                        <span className={'text-sm font-medium text-foreground/80 hover:text-foreground transition-colors'}>Liên hệ</span>
                    </Link>
                </nav>

                <div className={'hidden md:flex items-center gap-3'}>
                    <Button asChild size={'sm'} variant={'default'} className={'font-bold'}>
                        <Link href={'/start'}>
                            Bắt đầu ngay
                        </Link>
                    </Button>
                </div>

                <div className={'md:hidden p-2'}>
                    <Button size={'icon'} variant={'ghost'} onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label={'Toggle menu'}>
                        {isMenuOpen ? (
                            <X className="h-6 w-6 text-foreground" />
                        ) : (
                            <Menu className="h-6 w-6 text-foreground" />
                        )}
                    </Button>
                </div>
            </div>
            {isMenuOpen && (
                <div className={'flex flex-col justify-center px-4 md:hidden'}>
                    <nav className={'md:hidden bg-background border-t border-border gap-4'}>
                        <Link href={'#features'} className={'block py-2 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors'}>
                            Tính năng
                        </Link>
                        <Link href={'#how-to-use'} className={'block py-2 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors'}>
                            Hướng dẫn sử dụng
                        </Link>
                        <Link href={'#contact'} className={'block py-2 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors'}>
                            Liên hệ
                        </Link>
                    </nav>
                    <div className="flex flex-col gap-2 pt-4 border-t border-border">
                        <Button asChild size="sm">
                            <Link href={'/start'}>
                                Bắt đầu ngay
                            </Link>
                        </Button>
                    </div>
                </div>
            )}
        </header>
    )
}