import Link from 'next/link'
import {Button} from '@/components/ui/button'
import SectionReveal from '../motion/section-reveal'

export default function FinalCtaSection() {
    return (
        <section id={'contact'} className={'py-16 sm:py-20'}>
            <div className={'container mx-auto px-4 sm:px-6 lg:px-8'}>
                <SectionReveal
                    className={'rounded-3xl border border-primary/25 bg-primary/10 px-6 py-9 sm:px-10 sm:py-12'}>
                    <p className={'text-xs uppercase tracking-[0.12em] text-primary'}>Điểm bắt đầu</p>
                    <h2 className={'mt-3 max-w-[18ch] text-balance text-3xl font-bold leading-tight text-foreground sm:text-4xl'}>
                        Sẵn sàng giảm lo lắng mỗi ngày?
                    </h2>
                    <p className={'mt-4 max-w-[65ch] text-sm leading-relaxed text-muted-foreground sm:text-base'}>
                        Placeholder cho đến khi hoàn thành
                    </p>
                    <div className={'mt-7 flex flex-col gap-3 sm:flex-row'}>
                        <Button asChild size={'lg'} className={'h-11 px-7 text-base font-semibold'}>
                            <Link href={'/start'}>Đăng ký bản dùng thử</Link>
                        </Button>
                        <Button asChild variant={'outline'} size={'lg'} className={'h-11 px-7 text-base'}>
                            <Link href={'/start'}>Trao đổi với đội triển khai</Link>
                        </Button>
                    </div>
                </SectionReveal>
            </div>
        </section>
    )
}
