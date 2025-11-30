'use client';

import { motion } from 'motion/react';

import {
  useAnimateIconContext,
  IconWrapper,
  type IconProps,
} from '@/components/animate-ui/icons/icon';

type UserMinusProps = IconProps<string>;

function IconComponent({ size, ...props }: UserMinusProps) {
  const { controls } = useAnimateIconContext();
  
  const variants = {
    user: {
      initial: { scale: 1 },
      animate: { scale: [1, 0.95, 1], transition: { duration: 0.4 } }
    },
    minus: {
      initial: { scaleX: 1, opacity: 1 },
      animate: { scaleX: [1, 1.3, 1], opacity: [1, 0.7, 1], transition: { duration: 0.4, delay: 0.1 } }
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
        x1="22" x2="16" y1="11" y2="11" 
        variants={variants.minus}
        initial="initial"
        animate={controls}
      />
    </motion.svg>
  );
}

function UserMinus(props: UserMinusProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export { UserMinus };
