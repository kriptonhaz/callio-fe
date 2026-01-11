'use client'

import type { Variants } from 'motion/react'
import { motion } from 'motion/react'

import {
  getVariants,
  useAnimateIconContext,
  IconWrapper,
  type IconProps,
} from '@/components/animate-ui/icons/icon'

type MessageCircleMoreProps = IconProps<keyof typeof animations>

const animations = {
  default: {
    dot1: {
      initial: { opacity: 1 },
      animate: {
        opacity: [1, 0, 1],
        transition: { duration: 0.6, times: [0, 0.3, 0.6] },
      },
    },
    dot2: {
      initial: { opacity: 1 },
      animate: {
        opacity: [1, 0, 1],
        transition: { duration: 0.6, times: [0, 0.4, 0.7], delay: 0.1 },
      },
    },
    dot3: {
      initial: { opacity: 1 },
      animate: {
        opacity: [1, 0, 1],
        transition: { duration: 0.6, times: [0, 0.5, 0.8], delay: 0.2 },
      },
    },
  } satisfies Record<string, Variants>,
  'default-loop': {
    dot1: {
      initial: { opacity: 1 },
      animate: {
        opacity: [1, 0, 1, 1],
        transition: { duration: 1.2, repeat: Infinity, repeatDelay: 0.5 },
      },
    },
    dot2: {
      initial: { opacity: 1 },
      animate: {
        opacity: [1, 0, 1, 1],
        transition: {
          duration: 1.2,
          delay: 0.1,
          repeat: Infinity,
          repeatDelay: 0.5,
        },
      },
    },
    dot3: {
      initial: { opacity: 1 },
      animate: {
        opacity: [1, 0, 1, 1],
        transition: {
          duration: 1.2,
          delay: 0.2,
          repeat: Infinity,
          repeatDelay: 0.5,
        },
      },
    },
  } satisfies Record<string, Variants>,
} as const

function IconComponent({ size, ...props }: MessageCircleMoreProps) {
  const { controls } = useAnimateIconContext()
  const variants = getVariants(animations)

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
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
      <motion.path
        d="M8 12h.01"
        variants={variants.dot1}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d="M12 12h.01"
        variants={variants.dot2}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d="M16 12h.01"
        variants={variants.dot3}
        initial="initial"
        animate={controls}
      />
    </motion.svg>
  )
}

function MessageCircleMore(props: MessageCircleMoreProps) {
  return <IconWrapper icon={IconComponent} {...props} />
}

export {
  animations,
  MessageCircleMore,
  MessageCircleMore as MessageCircleMoreIcon,
  type MessageCircleMoreProps,
  type MessageCircleMoreProps as MessageCircleMoreIconProps,
}
