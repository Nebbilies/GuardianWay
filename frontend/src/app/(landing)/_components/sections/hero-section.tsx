'use client'

import Link from 'next/link'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {Bell, Shield, Sparkles} from 'lucide-react'
import {motion, useReducedMotion, useScroll, useTransform} from 'framer-motion'
import {useRef} from 'react'
import AbstractMotionGraphic, {HERO_ORB_GRAPHIC} from '../graphics/abstract-motion-graphic'

export default function HeroSection() {
    const ref = useRef<HTMLElement>(null)
    const reduceMotion = useReducedMotion()
    const {scrollYProgress} = useScroll({
        target: ref,
        offset: ['start start', 'end start'],
    })

    const textY = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : -36])
    const visualY = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : 42])

    return (
        <section
            ref={ref}
            className={'relative overflow-hidden py-18 sm:py-24 lg:py-28'}
        >
            <div
                className={'absolute inset-0 bg-[radial-gradient(120%_80%_at_20%_0%,color-mix(in_oklch,var(--primary)_18%,transparent),transparent)]'}/>
            <div className={'container relative mx-auto grid gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8'}>
                <motion.div style={{y: textY}} className={'flex flex-col gap-7'}>
                    <Badge variant={'secondary'}
                           className={'w-fit border border-primary/25 bg-primary/10 text-foreground'}>
                        Theo dõi hành trình xe buýt theo thời gian thực
                    </Badge>

                    <h1 className={'max-w-[18ch] text-balance text-4xl font-bold leading-[1.04] tracking-tight text-foreground sm:text-5xl lg:text-6xl'}>
                        Biết chính xác con bạn đang ở đâu, với từng chuyến xe.
                    </h1>

                    <p className={'max-w-[65ch] text-base leading-relaxed text-muted-foreground sm:text-lg'}>
                        GuardianWay gửi cập nhật tuyến đường liên tục, cảnh báo tức thì khi xe đến gần, và lịch sử hành
                        trình rõ ràng để phụ huynh bớt lo lắng trong hành trình của con.
                    </p>

                    <div className={'flex flex-col gap-4 sm:flex-row'}>
                        <Button asChild size={'lg'} className={'h-11 px-7 text-base font-semibold'}>
                            <Link href={'/start'}>Bắt đầu với GuardianWay</Link>
                        </Button>
                        <Button asChild variant={'outline'} size={'lg'} className={'h-11 px-7 text-base'}>
                            <Link href={'#contact'}>Xem bản demo</Link>
                        </Button>
                    </div>

                    {/*<div className={'flex gap-2 text-sm text-muted-foreground text-wrap'}>
            <div className={'flex items-center gap-2'}>
              <Shield className={'h-4 w-4 text-primary'} />
              <span>Dữ liệu định vị mã hóa</span>
            </div>
            <div className={'flex items-center gap-2'}>
              <Bell className={'h-4 w-4 text-primary'} />
              <span>Cảnh báo theo từng điểm dừng</span>
            </div>
            <div className={'flex items-center gap-2'}>
              <Sparkles className={'h-4 w-4 text-primary'} />
              <span>Trải nghiệm mượt trên di động</span>
            </div>
          </div>*/}
                </motion.div>

                <motion.div style={{y: visualY}} className={'relative min-h-[320px] sm:min-h-[380px] lg:min-h-[440px]'}>
                    <AbstractMotionGraphic
                        id={HERO_ORB_GRAPHIC}
                        className={'absolute inset-0'}
                    />
                    <div
                        className={'absolute bottom-5 left-4 right-4 rounded-2xl border border-primary/25 bg-background/90 p-4 shadow-xl backdrop-blur-sm sm:left-auto sm:right-6 sm:w-72'}>
                        <p className={'text-xs uppercase tracking-[0.08em] text-muted-foreground'}>Chuyến đang theo
                            dõi</p>
                        <p className={'mt-1 text-lg font-semibold text-foreground'}>Tuyến A, Xe 51</p>
                        <p className={'mt-2 text-sm text-muted-foreground'}>Cập nhật gần nhất: hệ thống tự làm mới liên
                            tục trong phiên theo dõi.</p>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}
