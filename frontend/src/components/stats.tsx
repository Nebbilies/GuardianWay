export default function Stats() {
    const stats: { value: string, label: string, description: string }[] = [
        {
            value: '99.9%',
            label: 'Uptime',
            description: 'Đảm bảo hoạt động liên tục',
        },
        {
            value: '500+',
            label: 'Người dùng',
            description: 'Hơn 500 phụ huynh tin dùng',
        },
        {
            value: '< 3 giây',
            label: 'Mỗi lần cập nhật vị trí',
            description: 'Theo thời gian thực',
        },
        {
            value: '100%',
            label: 'Bảo mật',
            description: 'Dữ liệu được mã hóa và bảo vệ tuyệt đối',
        }
    ]

    return (
        <section className={'py-12 sm:py-16 bg-foreground'}>
            <div className={'container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center'}>
                <div className={'text-center max-w-3xl auto mb-12'}>
                    <h2 className={'text-3xl sm:text-4xl font-bold text-background text-balance text-center'}>
                        Được tin dùng bởi hàng trăm phụ huynh và nhà trường trên toàn quốc
                    </h2>
                    <p className={'mt-6 text-lg sm:text-xl text-background/70 leading-relaxed text-center'}>
                        Cùng hàng trăm phụ huynh và nhà trường trải nghiệm sự an tâm và tiện lợi mà hệ thống của chúng tôi mang lại.
                    </p>
                </div>
            </div>
            <div className={'grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 items-center justify-center'}>
                {stats.map((stat, index) => (
                    <div key={index} className={'flex flex-col items-center text-center'}>
                        <p className={'text-4xl lg:text-5xl font-bold text-primary mb-3'}>{stat.value}</p>
                        <p className={'text-lg font-semibold text-background/80 mb-2'}>{stat.label}</p>
                        <p className={'text-xs text-background/60'}>{stat.description}</p>
                    </div>
                ))}
            </div>
        </section>
    )
}