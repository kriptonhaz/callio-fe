'use client';

import { motion } from 'motion/react';

import {
  useAnimateIconContext,
  IconWrapper,
  type IconProps,
} from '@/components/animate-ui/icons/icon';

type UserCheckProps = IconProps<string>;

function IconComponent({ size, ...props }: UserCheckProps) {
  const { controls } = useAnimateIconContext();
  
  const variants = {
    user: {
      initial: { scale: 1 },
      animate: { scale: [1, 1.05, 1], transition: { duration: 0.4 } }
    },
    check: {
      initial: { pathLength: 0, opacity: 0 },
      animate: { pathLength: 1, opacity: 1, transition: { duration: 0.4, delay: 0.1 } }
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
        variants={variants.user}
        initial="initial"
        animate={controls}
      />
      <motion.circle 
        cx="9" cy="7" r="4" 
        variants={variants.user}
        initial="initial"
        animate={controls}
      />
      <motion.path 
        d="m16 11 2 2 4-4" 
        variants={variants.check}
        initial="initial"
        animate={controls}
      />
    </motion.svg>
  );
}

function UserCheck(props: UserCheckProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export { UserCheck };
