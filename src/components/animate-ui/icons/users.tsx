'use client';

import { motion } from 'motion/react';

import {
  useAnimateIconContext,
  IconWrapper,
  type IconProps,
} from '@/components/animate-ui/icons/icon';

type UsersProps = IconProps<string>;

function IconComponent({ size, ...props }: UsersProps) {
  const { controls } = useAnimateIconContext();
  
  const variants = {
    user1: {
      initial: { x: 0 },
      animate: { x: [0, -3, 0], transition: { duration: 0.4 } }
    },
    user2: {
      initial: { x: 0 },
      animate: { x: [0, 3, 0], transition: { duration: 0.4, delay: 0.1 } }
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
        d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" 
        variants={variants.user1}
        initial="initial"
        animate={controls}
      />
      <motion.circle 
        cx="9" cy="7" r="4" 
        variants={variants.user1}
        initial="initial"
        animate={controls}
      />
      <motion.path 
        d="M22 21v-2a4 4 0 0 0-3-3.87" 
        variants={variants.user2}
        initial="initial"
        animate={controls}
      />
      <motion.path 
        d="M16 3.13a4 4 0 0 1 0 7.75" 
        variants={variants.user2}
        initial="initial"
        animate={controls}
      />
    </motion.svg>
  );
}

function Users(props: UsersProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export { Users };
