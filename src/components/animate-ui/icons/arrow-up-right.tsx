'use client';

import { motion } from 'motion/react';

import {
  useAnimateIconContext,
  IconWrapper,
  type IconProps,
} from '@/components/animate-ui/icons/icon';

type ArrowUpRightProps = IconProps<string>;

function IconComponent({ size, ...props }: ArrowUpRightProps) {
  const { controls } = useAnimateIconContext();
  
  const variants = {
    arrow: {
      initial: { x: 0, y: 0 },
      animate: { 
        x: [0, 2, 0],
        y: [0, -2, 0],
        transition: { duration: 0.5 } 
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
      <motion.path 
        d="M7 17 17 7" 
        variants={variants.arrow}
        initial="initial"
        animate={controls}
      />
      <motion.path 
        d="M7 7h10v10" 
        variants={variants.arrow}
        initial="initial"
        animate={controls}
      />
    </motion.svg>
  );
}

function ArrowUpRight(props: ArrowUpRightProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export { ArrowUpRight };
