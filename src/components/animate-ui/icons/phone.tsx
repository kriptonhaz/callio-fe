'use client';

import { motion } from 'motion/react';

import {
  useAnimateIconContext,
  IconWrapper,
  type IconProps,
} from '@/components/animate-ui/icons/icon';

type PhoneProps = IconProps<string>;

function IconComponent({ size, ...props }: PhoneProps) {
  const { controls } = useAnimateIconContext();
  
  const variants = {
    phone: {
      initial: { rotate: 0 },
      animate: { 
        rotate: [0, -10, 10, -10, 10, 0],
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
        d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" 
        variants={variants.phone}
        initial="initial"
        animate={controls}
      />
    </motion.svg>
  );
}

function Phone(props: PhoneProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export { Phone };
