import {ForwardRefExoticComponent, RefAttributes} from "react";
import {Bell, LogIn, LucideProps, MapPin, Phone} from "lucide-react";

export default function HowItWorks() {
    const steps:
        {
            title: string,
            number: string,
            description: string,
            icon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>
        }[] = [
        {
            title: 'Cài đặt ứng dụng',
            number: '01',
            description: 'Tải ứng dụng GuardianWar trên hệ điều hành iOS hoặc Android',
            icon: Phone,
        },
        {
            title: 'Đăng nhập vào hệ thống',
            number: '02',
            description: 'Sử dụng tài khoản được cung cấp bởi nhà trường để đăng nhập vào ứng dụng',
            icon: LogIn,
        },
        {
            title: 'Bắt đầu giám sát',
            number: '03',
            description: 'Theo dõi vị trí xe buýt, tuyến đường và nhận ước tính thời gian đến điểm dừng tiếp theo',
            icon: MapPin,
        },
        {
            title: 'Nhận thông báo',
            number: '04',
            description: 'Nhận thông báo tức thì khi con bạn lên xe, khi xe đến gần điểm dừng, hoặc khi có sự cố xảy ra',
            icon: Bell,
        },
    ]

    return (
        <section className={'py-16 sm:py-20 bg-muted'}>
            <div className={'container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center'}>
                <div className={'text-center max-w-3xl auto mb-12'}>
                    <h2 className={'text-3xl sm:text-4xl font-bold text-foreground text-balance text-center'}>
                        Sử dụng ngay hôm nay
                    </h2>
                    <p className={'mt-3 text-lg sm:text-xl text-muted-foreground leading-relaxed text-center'}>
                        Trải nghiệm chỉ qua 4 bước đơn giản
                    </p>
                </div>
                <div className={'grid md:grid-cols-2 lg:grid-cols-4 gap-12 mt-4'}>
                    {steps.map((step, index) => (
                        <div key={index} className={'flex flex-col items-center text-center'}>
                            <div className={'relative'}>
                                <span className={'absolute -top-4 -left-4 top-xs text-primary font-bold'}>
                                    {step.number}
                                </span>
                                <div className={'h-12 w-12 flex items-center justify-center border-primary bg-card border rounded-full'}>
                                    <step.icon className={'w-6 h-6 text-primary'}/>
                                </div>
                            </div>
                            <h3 className={'text-lg font-semibold text-center mt-2'}>
                                {step.title}
                            </h3>
                            <p className={'text-sm text-muted-foreground mt-2'}>
                                {step.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}