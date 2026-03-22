import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Bell, MapPin, Shield} from "lucide-react";
import {Item, ItemContent, ItemDescription, ItemMedia, ItemTitle} from "@/components/ui/item";

export default function Hero() {
    return (
        <section className={'relative overflow-hidden py-16 sm:py-20 lg:py-24 2xl:py-32'}>
            <div className={'container mx-auto px-4 sm:px-6 lg:px-8'}>
                <div className={'grid lg:grid-cols-2 gap-12 lg:gap-16 items-center'}>
                    <div className={'flex flex-col gap-6'}>
                        <Badge variant={'secondary'} className={'w-fit text-foreground/70'}>
                            Giải pháp quản lý xe buýt thông minh
                        </Badge>
                        <h1 className={'text-foreground text-4xl font-bold sm:text-5xl lg:text-6xl text-balance tracking-tight leading-[1.15] max-w-2xl'}>
                            Hành trình con bạn trên {" "}
                            <span className={'text-primary'}>
                                mọi quãng đường.
                            </span>
                        </h1>
                        <p className={'text-lg sm:text-xl text-muted-foreground max-w-xl leading-relaxed'}>
                            Đảm bảo an toàn và tiện lợi cho con bạn với hệ thống giám sát xe buýt thông minh của chúng tôi.
                            Theo dõi vị trí xe thời gian thực, nhận thông báo liên tục và yên tâm hơn trong mỗi chuyến đi.
                        </p>
                        <div className={'flex flex-col sm:flex-row gap-6 items-center'}>
                            <a href={'/start'} className={'w-full sm:w-auto'}>
                                <Button size={'lg'} className={'text-base px-8 w-full'}>
                                    Bắt Đầu Ngay
                                </Button>
                            </a>
                            <a href={'/'} className={'w-full sm:w-auto'}>
                                <Button variant={'outline'} size={'lg'} className={'text-base px-8 w-full'}>
                                    Xem Demo
                                </Button>
                            </a>
                        </div>
                        <div className={'flex flex-wrap gap-4 items-center text-muted-foreground'}>
                            <div className={'flex gap-2 items-center'}>
                                <Shield className={'w-4 h-4 text-accent'}/>
                                <span>Bảo mật tuyệt đối</span>
                            </div>
                            <div className={'flex gap-2 items-center'}>
                                <MapPin className={'w-4 h-4 text-accent'}/>
                                <span>GPS theo thời gian thực</span>
                            </div>
                            <div className={'flex gap-2 items-center'}>
                                <Bell className={'w-4 h-4 text-accent'}/>
                                <span>Thông báo tức thì</span>
                            </div>
                        </div>
                    </div>
                    <div className={'relative lg:h-125'}>
                        <div className={'card relative border border-border rounded-2xl p-8 shadow-2xl'}>
                            <div className={'interface flex flex-col relative border-border border rounded-xl'}>
                                <div className={'flex items-center justify-between p-4 bg-primary rounded-t-xl'}>
                                    <div className={'flex items-center gap-4'}>
                                        <div className={'w-8 h-8 flex items-center justify-center bg-primary-foreground/20 rounded-full'}>
                                            <MapPin className={'w-4 h-4 text-primary-foreground'}/>
                                        </div>
                                        <div>
                                            <p className={'text-xs text-primary-foreground/80'}>Đang theo dõi</p>
                                            <p className={'text-sm font-semibold text-primary-foreground'}>Xe #51 - Tuyến A</p>
                                        </div>
                                    </div>
                                    <div className={'flex items-center gap-2 rounded-lg bg-accent px-2 py-1'}>
                                        <div className={'w-2 h-2 rounded-full bg-accent-foreground animate-pulse'}/>
                                        <span className={'text-xs font-medium text-accent-foreground'}>LIVE</span>
                                    </div>
                                </div>
                                <div className="h-36 sm:h-48 bg-muted relative">
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="relative">
                                            <div className="h-20 w-20 rounded-full bg-primary/20 animate-ping absolute inset-0" />
                                            <div className="h-20 w-20 rounded-full bg-primary/30 flex items-center justify-center relative">
                                                <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                                                    <MapPin className="h-5 w-5 text-primary-foreground" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 200">
                                        <path
                                            d="M 50 150 Q 150 50 200 100 T 350 80"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="3"
                                            strokeDasharray="8 4"
                                            className="text-primary/40"
                                        />
                                    </svg>
                                </div>
                                <div className={'flex flex-col p-4 gap-4'}>
                                    <Item variant={'outline'}>
                                        <ItemMedia variant={'image'}>
                                            <div className={'w-8 h-8 flex items-center justify-center bg-primary/20 rounded-full'}>
                                                <MapPin className={'w-4 h-4 text-primary'}/>
                                            </div>
                                        </ItemMedia>
                                        <ItemContent>
                                            <ItemTitle>
                                                Đến nơi trong <span className={'font-semibold'}>5 phút</span>
                                            </ItemTitle>
                                            <ItemDescription>
                                                3:10 PM - Trường ABC, Đường XYZ
                                            </ItemDescription>
                                        </ItemContent>
                                    </Item>
                                    <Item variant={'outline'}>
                                        <ItemMedia variant={'image'}>
                                            <div className={'w-8 h-8 flex items-center justify-center bg-accent/20 rounded-full'}>
                                                <Bell className={'w-4 h-4 text-accent'}/>
                                            </div>
                                        </ItemMedia>
                                        <ItemContent>
                                            <ItemTitle>
                                                Mai Phương đã lên xe
                                            </ItemTitle>
                                            <ItemDescription>
                                                2:45 PM - Đã lên xe tại Trạm A
                                            </ItemDescription>
                                        </ItemContent>
                                    </Item>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}