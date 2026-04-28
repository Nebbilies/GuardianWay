import SectionReveal from '../motion/section-reveal'

const steps = [
    {
        title: 'Cài đặt ứng dụng',
        detail: 'Tải ứng dụng GuardianWay trên hệ điều hành iOS hoặc Android',
    },
    {
        title: 'Đăng nhập vào hệ thống',
        detail: 'Sử dụng tài khoản được cung cấp bởi nhà trường để đăng nhập vào ứng dụng.',
    },
    {
        title: 'Bắt đầu giám sát',
        detail: 'Theo dõi vị trí xe buýt, tuyến đường và nhận ước tính thời gian đến điểm dừng tiếp theo.',
    },
    {
        title: 'Nhận thông báo',
        detail: 'Nhận thông báo tức thì khi con bạn lên xe, khi xe đến gần điểm dừng, hoặc khi có sự cố xảy ra.',
    },
]

export default function HowItWorksSection() {
    return (
        <section id={'how-to-use'} className={'py-16 sm:py-20'}>
            <div className={'container mx-auto px-4 sm:px-6 lg:px-8'}>
                <SectionReveal className={'mb-10 max-w-3xl'}>
                    <p className={'text-xs uppercase tracking-[0.12em] text-primary'}>Quy trình triển khai</p>
                    <h2 className={'mt-3 text-balance text-3xl font-bold leading-tight text-foreground sm:text-4xl'}>
                        Bắt đầu nhanh, theo dõi rõ, đồng bộ cùng GuardianWay.
                    </h2>
                </SectionReveal>

                <div className={'grid gap-4 lg:grid-cols-2'}>
                    {steps.map((step, index) => (
                        <SectionReveal key={step.title} delay={index * 0.06}
                                       className={'rounded-2xl border border-border/90 bg-background px-5 py-5 sm:px-6'}>
                            <p className={'text-sm font-semibold text-primary'}>{`Bước ${index + 1}`}</p>
                            <h3 className={'mt-2 text-xl font-semibold text-foreground'}>{step.title}</h3>
                            <p className={'mt-2 max-w-[65ch] text-sm leading-relaxed text-muted-foreground sm:text-base'}>{step.detail}</p>
                        </SectionReveal>
                    ))}
                </div>
            </div>
        </section>
    )
}
