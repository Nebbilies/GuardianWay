'use client'

import {motion, useReducedMotion, useScroll, useTransform} from 'framer-motion'
import {useRef} from 'react'
import SectionReveal from '../motion/section-reveal'
import AbstractMotionGraphic, {STORY_FLOW_GRAPHIC} from '../graphics/abstract-motion-graphic'

const chapters = [
    {
        title: 'Trước giờ đón',
        body: 'Phụ huynh thấy xe đã xuất phát, còn bao lâu tới điểm đón, không cần gọi điện liên tục.',
    },
    {
        title: 'Trong hành trình',
        body: 'Thông báo sự kiện quan trọng đến ngay trên điện thoại, trạng thái tuyến rõ ràng theo từng chặng.',
    },
    {
        title: 'Khi xe đến nơi',
        body: 'Gia đình nắm thời điểm đến gần thực tế, giảm bỏ lỡ và giảm thời gian chờ ngoài cổng trường.',
    },
]

export default function StorySection() {
    const ref = useRef<HTMLElement>(null)
    const reduceMotion = useReducedMotion()
    const {scrollYProgress} = useScroll({
        target: ref,
        offset: ['start 80%', 'end 20%'],
    })

    const xDrift = useTransform(scrollYProgress, [0, 1], [reduceMotion ? 0 : -40, reduceMotion ? 0 : 40])

    return (
        <section ref={ref} className={'relative overflow-hidden py-16 sm:py-22'}>
            <div className={'container mx-auto px-4 sm:px-6 lg:px-8'}>
                <SectionReveal className={'mb-10 max-w-2xl'}>
                    <p className={'text-xs uppercase tracking-[0.12em] text-primary'}>Hành trình cảm xúc phụ huynh</p>
                    <h2 className={'mt-3 text-balance text-3xl font-bold leading-tight text-foreground sm:text-4xl'}>
                        Từ lo lắng đến chủ động, mỗi đoạn đường đều có tín hiệu rõ ràng.
                    </h2>
                </SectionReveal>

                <div className={'grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]'}>
                    <div className={'space-y-5'}>
                        {chapters.map((chapter, index) => (
                            <SectionReveal key={chapter.title} delay={index * 0.08}
                                           className={'rounded-2xl border border-border bg-card p-5 sm:p-6'}>
                                <p className={'text-sm uppercase tracking-[0.1em] text-primary'}>{`0${index + 1}`}</p>
                                <h3 className={'mt-2 text-xl font-semibold text-card-foreground'}>{chapter.title}</h3>
                                <p className={'mt-3 max-w-[65ch] text-sm leading-relaxed text-muted-foreground sm:text-base'}>{chapter.body}</p>
                            </SectionReveal>
                        ))}
                    </div>

                    <motion.div style={{x: xDrift}}
                                className={'relative min-h-[260px] rounded-[2rem] border border-primary/25 bg-primary/7 p-4 sm:min-h-[340px]'}>
                        <AbstractMotionGraphic id={STORY_FLOW_GRAPHIC} className={'h-full w-full'}/>
                    </motion.div>
                </div>
            </div>
        </section>
    )
}
