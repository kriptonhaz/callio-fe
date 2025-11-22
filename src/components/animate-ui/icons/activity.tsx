'use client';

import { motion } from 'motion/react';

import {
  useAnimateIconContext,
  IconWrapper,
  type IconProps,
} from '@/components/animate-ui/icons/icon';

type ActivityProps = IconProps<string>;

function IconComponent({ size, ...props }: ActivityProps) {
  const { controls } = useAnimateIconContext();
  
  const variants = {
    activity: {
      initial: { pathLength: 1, opacity: 1 },
      animate: { 
        pathLength: [0, 1],
        opacity: [0.5, 1],
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
        d="M22 12h-4l-3 9L9 3l-3 9H2" 
        variants={variants.activity}
        initial="initial"
        animate={controls}
      />
    </motion.svg>
  );
}

function Activity(props: ActivityProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export { Activity };
