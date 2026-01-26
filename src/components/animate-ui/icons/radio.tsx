'use client'

import { motion } from 'motion/react'
import type { Variants } from 'motion/react'
import {
  useAnimateIconContext,
  IconWrapper,
  type IconProps,
} from '@/components/animate-ui/icons/icon'

type RadioProps = IconProps<string>

function IconComponent({ size, ...props }: RadioProps) {
  const { controls } = useAnimateIconContext()

  const variants: Variants = {
    initial: {
      opacity: 1,
    },
    animate: (i: number) => ({
      opacity: [1, 0, 1],
      transition: {
        duration: 0.8,
        ease: 'easeInOut',
        delay: i * 0.2,
        times: [0, 0.5, 1],
      },
    }),
  }

  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <motion.path
        custom={1}
        d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"
        initial="initial"
        animate={controls}
        variants={variants}
      />
      <motion.path
        custom={0}
        d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"
        initial="initial"
        animate={controls}
        variants={variants}
      />
      <circle cx="12" cy="12" r="2" />
      <motion.path
        custom={0}
        d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"
        initial="initial"
        animate={controls}
        variants={variants}
      />
      <motion.path
        custom={1}
        d="M19.1 4.9C23 8.8 23 15.1 19.1 19"
        initial="initial"
        animate={controls}
        variants={variants}
      />
    </motion.svg>
  )
}

function Radio(props: RadioProps) {
  return <IconWrapper icon={IconComponent} {...props} />
}

export { Radio }
