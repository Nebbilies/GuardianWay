'use client'

import {motion, useReducedMotion, useScroll, useTransform} from 'framer-motion'
import {useRef} from 'react'

export const HERO_ORB_GRAPHIC = 'HERO_ORB_GRAPHIC'
export const STORY_FLOW_GRAPHIC = 'STORY_FLOW_GRAPHIC'
export const PROOF_WAVE_GRAPHIC = 'PROOF_WAVE_GRAPHIC'

interface AbstractMotionGraphicProps {
    id: string
    className?: string
}

export default function AbstractMotionGraphic({id, className}: AbstractMotionGraphicProps) {
    const ref = useRef<HTMLDivElement>(null)
    const reduceMotion = useReducedMotion()
    const {scrollYProgress} = useScroll({
        target: ref,
        offset: ['start end', 'end start'],
    })
    const floatY = useTransform(scrollYProgress, [0, 1], [18, -18])
    const rotate = useTransform(scrollYProgress, [0, 1], [-10, 10])
    const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.95, 1.05, 0.97])

    return (
        <div
            ref={ref}
            data-asset-hook={id}
            className={className}
            aria-hidden="true"
        >
            <motion.div
                style={reduceMotion ? undefined : {y: floatY, rotate, scale}}
                className={'relative h-full w-full'}
            >
                <div className={'absolute inset-0 rounded-[2.5rem] bg-primary/20 blur-2xl'}/>
                <div className={'absolute inset-6 rounded-[2rem] border border-primary/35 bg-background/70'}/>
                <svg viewBox={'0 0 640 480'} className={'absolute inset-0 h-full w-full'}>
                    <path
                        d={'M 20 260 C 160 180, 300 360, 420 240 C 490 180, 570 190, 620 130'}
                        fill={'none'}
                        stroke={'currentColor'}
                        strokeWidth={6}
                        className={'text-primary/60'}
                    />
                    <path
                        d={'M 40 320 C 180 250, 300 410, 460 320 C 540 280, 590 290, 620 250'}
                        fill={'none'}
                        stroke={'currentColor'}
                        strokeWidth={3}
                        className={'text-accent/70'}
                    />
                </svg>
            </motion.div>
        </div>
    )
}
