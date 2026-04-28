'use client'

import {motion, useReducedMotion} from 'framer-motion'
import {ReactNode} from 'react'

interface SectionRevealProps {
    children: ReactNode
    delay?: number
    className?: string
}

export default function SectionReveal({children, delay = 0, className}: SectionRevealProps) {
    const reduceMotion = useReducedMotion()

    if (reduceMotion) {
        return (
            <motion.div
                className={className}
                initial={{opacity: 0}}
                whileInView={{opacity: 1}}
                viewport={{once: true, amount: 0.2}}
                transition={{duration: 0.24, delay}}
            >
                {children}
            </motion.div>
        )
    }

    return (
        <motion.div
            className={className}
            initial={{opacity: 0, y: 36}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true, amount: 0.2}}
            transition={{
                duration: 0.56,
                delay,
                ease: [0.22, 1, 0.36, 1],
            }}
        >
            {children}
        </motion.div>
    )
}
