import {Bell, Clock, LucideProps, MapPin, Users} from "lucide-react";
import {ForwardRefExoticComponent, RefAttributes} from "react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";

export default function Features() {
    const features: { title: string, icon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>, description: string }[] = [
        {
            title: 'Theo dõi GPS thời gian thực',
            icon: MapPin,
            description: 'Giám sát vị trí xe buýt của con bạn ở mọi lúc, với độ chính xác trong bán kính 3m.'
        },
        {
            title: 'Thông báo tức thì',
            icon: Bell,
            description: 'Nhận thông báo ngay khi con bạn lên xe, khi xe đến gần điểm dừng, hoặc khi có sự cố xảy ra.'
        },
        {
            title: 'Ước tính thời gian đến',
            icon: Clock,
            description: 'Dự đoán thời gian xe buýt đến điểm dừng tiếp theo dựa trên tình hình giao thông và lịch trình thực tế.',
        },
        {
            title: 'Điểm danh khi lên xe',
            icon: Users,
            description: 'Nắm bắt chính xác khi nào con bạn lên xe buýt với hệ thống điểm danh tự động',
        },
        {
            title: 'Lịch sử hành trình',
            icon: Clock,
            description: 'Xem lại lịch sử hành trình với thông tin chi tiết về thời gian, địa điểm và các điểm dừng đã qua.',
        }
    ];

    return (
        <section id={'features'} className={'py-20 sm:py-24 border-y'}>
            <div className={'container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center'}>
                <div className={'text-center max-w-3xl auto mb-12'}>
                    <h2 className={'text-3xl sm:text-4xl font-bold text-foreground text-balance text-center'}>
                        Các tính năng nổi bật
                    </h2>
                    <p className={'mt-6 text-lg sm:text-xl text-muted-foreground leading-relaxed text-center'}>
                        Hệ thống cung cấp những tính năng quan trọng với một mục tiêu duy nhất: đảm bảo an toàn và tiện lợi cho con bạn trong mỗi chuyến xe.
                    </p>
                </div>
                <div className={'grid md:grid-cols-2 lg:grid-cols-3 gap-6'}>
                    {features.map((feature, index) => (
                        <Card key={index} className={'border border-border hover:border-primary/50 transition-colors group'}>
                            <CardHeader>
                                <div className={'h-12 w-12 flex items-center justify-center bg-primary/10 rounded-full mb-4 group-hover:bg-primary/20 transition-colors'}>
                                    <feature.icon className={'w-6 h-6 text-primary'}/>
                                </div>
                                <CardTitle className={'text-xl'}>{feature.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CardDescription className={'text-base'}>
                                    {feature.description}
                                </CardDescription>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    )
}