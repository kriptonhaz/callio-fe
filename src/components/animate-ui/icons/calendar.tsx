'use client';

import { motion } from 'motion/react';

import {
  useAnimateIconContext,
  IconWrapper,
  type IconProps,
} from '@/components/animate-ui/icons/icon';

type CalendarProps = IconProps<string>;

function IconComponent({ size, ...props }: CalendarProps) {
  const { controls } = useAnimateIconContext();
  
  const variants = {
    calendar: {
      initial: { y: 0 },
      animate: { 
        y: [0, -4, 0],
        transition: { duration: 0.4 } 
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
      <motion.g variants={variants.calendar} initial="initial" animate={controls}>
        <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
        <line x1="16" x2="16" y1="2" y2="6" />
        <line x1="8" x2="8" y1="2" y2="6" />
        <line x1="3" x2="21" y1="10" y2="10" />
      </motion.g>
    </motion.svg>
  );
}

function Calendar(props: CalendarProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export { Calendar };
