import {Bell, MapPin, Route, ShieldCheck} from 'lucide-react'
import SectionReveal from '../motion/section-reveal'

const features = [
    {
        icon: MapPin,
        title: 'Định vị theo thời gian thực',
        body: 'Tọa độ chuyến đi được cập nhật liên tục để phụ huynh biết xe đang ở đâu ngay lúc xem.',
    },
    {
        icon: Bell,
        title: 'Cảnh báo theo ngữ cảnh',
        body: 'Thông báo theo từng sự kiện quan trọng, như rời trạm, sắp đến điểm đón, hoặc con bạn đã điểm danh.',
    },
    {
        icon: Route,
        title: 'Lịch sử hành trình rõ ràng',
        body: 'Xem lại lịch sử di chuyển và thời điểm đón trả để đối chiếu nhanh khi cần.',
    },
    {
        icon: ShieldCheck,
        title: 'Kiểm soát thông tin an toàn',
        body: 'Dữ liệu phục vụ giám sát phụ huynh được thu gọn theo mục đích sử dụng, giảm nhiễu không cần thiết.',
    },
]

export default function FeaturesSection() {
    return (
        <section id={'features'} className={'py-16 sm:py-20'}>
            <div className={'container mx-auto px-4 sm:px-6 lg:px-8'}>
                <SectionReveal className={'mb-10 max-w-3xl'}>
                    <p className={'text-xs uppercase tracking-[0.12em] text-primary'}>Tính năng cốt lõi</p>
                    <h2 className={'mt-3 text-balance text-3xl font-bold leading-tight text-foreground sm:text-4xl'}>
                        Đảm bảo an toàn và tiện lợi cho con bạn trong mỗi chuyến xe.
                    </h2>
                </SectionReveal>

                <div className={'grid gap-5 md:grid-cols-2'}>
                    {features.map((feature, index) => (
                        <SectionReveal key={feature.title} delay={index * 0.06}
                                       className={'rounded-2xl border border-border bg-card p-6'}>
                            <feature.icon className={'h-6 w-6 text-primary'}/>
                            <h3 className={'mt-4 text-xl font-semibold text-card-foreground'}>{feature.title}</h3>
                            <p className={'mt-3 max-w-[65ch] text-sm leading-relaxed text-muted-foreground sm:text-base'}>{feature.body}</p>
                        </SectionReveal>
                    ))}
                </div>
            </div>
        </section>
    )
}
