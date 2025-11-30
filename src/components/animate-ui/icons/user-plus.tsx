'use client';

import { motion } from 'motion/react';

import {
  useAnimateIconContext,
  IconWrapper,
  type IconProps,
} from '@/components/animate-ui/icons/icon';

type UserPlusProps = IconProps<string>;

function IconComponent({ size, ...props }: UserPlusProps) {
  const { controls } = useAnimateIconContext();
  
  const variants = {
    user: {
      initial: { scale: 1 },
      animate: { scale: [1, 1.1, 1], transition: { duration: 0.4 } }
    },
    plus: {
      initial: { scale: 1, opacity: 1 },
      animate: { scale: [1, 1.3, 1], opacity: [1, 0.7, 1], transition: { duration: 0.4, delay: 0.1 } }
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
      <motion.line 
        x1="19" x2="19" y1="8" y2="14" 
        variants={variants.plus}
        initial="initial"
        animate={controls}
      />
      <motion.line 
        x1="22" x2="16" y1="11" y2="11" 
        variants={variants.plus}
        initial="initial"
        animate={controls}
      />
    </motion.svg>
  );
}

function UserPlus(props: UserPlusProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export { UserPlus };
