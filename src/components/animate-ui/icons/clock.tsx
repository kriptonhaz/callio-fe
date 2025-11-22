'use client';

import { motion } from 'motion/react';

import {
  useAnimateIconContext,
  IconWrapper,
  type IconProps,
} from '@/components/animate-ui/icons/icon';

type ClockProps = IconProps<string>;

function IconComponent({ size, ...props }: ClockProps) {
  const { controls } = useAnimateIconContext();
  
  const variants = {
    clock: {
      initial: { rotate: 0 },
      animate: { 
        rotate: 360,
        transition: { duration: 2, ease: "linear" as const, repeat: Infinity } 
      }
    }
  };

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
      <circle cx="12" cy="12" r="10" />
      <motion.polyline 
        points="12 6 12 12 16 14" 
        variants={variants.clock}
        initial="initial"
        animate={controls}
        style={{ originX: "50%", originY: "50%" }}
      />
    </motion.svg>
  );
}

function Clock(props: ClockProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export { Clock };
