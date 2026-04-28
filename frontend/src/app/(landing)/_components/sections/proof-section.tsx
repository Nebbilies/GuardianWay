import type {LandingProofResponse} from '@gw/shared'
import {Badge} from '@/components/ui/badge'
import SectionReveal from '../motion/section-reveal'
import AbstractMotionGraphic, {PROOF_WAVE_GRAPHIC} from '../graphics/abstract-motion-graphic'

interface ProofSectionProps {
    proof: LandingProofResponse
    isFallback: boolean
}

const formatNumber = (value: number) => new Intl.NumberFormat('vi-VN').format(value)

const formatTimestamp = (value: string | null) => {
    if (!value) {
        return 'Chưa có dữ liệu theo thời gian thực'
    }

    return new Intl.DateTimeFormat('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
    }).format(new Date(value))
}

export default function ProofSection({proof, isFallback}: ProofSectionProps) {
    const metrics = [
        {
            value: formatNumber(proof.metrics.activeRoutes),
            label: 'Tuyến đang hoạt động',
            detail: 'Đang phục vụ phụ huynh trong hệ thống',
        },
        {
            value: formatNumber(proof.metrics.activeBuses),
            label: 'Xe đang vận hành',
            detail: 'Xe có trạng thái hoạt động',
        },
        {
            value: formatNumber(proof.metrics.schoolStops),
            label: 'Điểm trường được theo dõi',
            detail: 'Điểm dừng trường học đã cấu hình',
        },
        {
            value: formatNumber(proof.metrics.completedTripsLast30Days),
            label: 'Chuyến hoàn tất trong 30 ngày',
            detail: 'Tổng số chuyến có trạng thái hoàn thành',
        },
    ]

    return (
        <section
            className={'relative overflow-hidden border-y border-border/80 bg-foreground py-14 text-background sm:py-18'}>
            <div className={'container relative mx-auto px-4 sm:px-6 lg:px-8'}>
                <SectionReveal className={'mb-10 flex flex-wrap items-center justify-between gap-4'}>
                    <div className={'space-y-3'}>
                        <p className={'text-xs uppercase tracking-[0.12em] text-background/70'}>Bằng chứng vận hành</p>
                        <h2 className={'max-w-[22ch] text-balance text-3xl font-bold leading-tight sm:text-4xl'}>
                            Dữ liệu thật từ hệ thống giám sát, cập nhật liên tục mỗi ngày.
                        </h2>
                    </div>
                    <Badge variant={'secondary'}
                           className={'border border-background/20 bg-background/10 text-background'}>
                        {isFallback ? 'Nguồn: Ước tính dự phòng' : 'Nguồn: Dữ liệu hệ thống'}
                    </Badge>
                </SectionReveal>

                <div className={'grid gap-5 sm:grid-cols-2 xl:grid-cols-4'}>
                    {metrics.map((metric, index) => (
                        <SectionReveal key={metric.label} delay={index * 0.08}
                                       className={'rounded-2xl border border-background/15 bg-background/5 p-5'}>
                            <p className={'text-4xl font-bold leading-none text-primary'}>{metric.value}</p>
                            <p className={'mt-3 text-sm font-medium text-background'}>{metric.label}</p>
                            <p className={'mt-2 text-sm leading-relaxed text-background/75'}>{metric.detail}</p>
                        </SectionReveal>
                    ))}
                </div>

                <SectionReveal delay={0.2}
                               className={'mt-8 flex items-center justify-between gap-3 rounded-2xl border border-background/15 bg-background/5 p-4'}>
                    <div>
                        <p className={'text-sm text-background/75'}>Điểm theo dõi gần nhất</p>
                        <p className={'text-base font-semibold'}>{formatTimestamp(proof.metrics.latestTrackingAt)}</p>
                    </div>
                    <div className={'relative h-16 w-28'}>
                        <AbstractMotionGraphic id={PROOF_WAVE_GRAPHIC} className={'h-16 w-28'}/>
                    </div>
                </SectionReveal>
            </div>
        </section>
    )
}
