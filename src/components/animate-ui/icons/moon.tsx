'use client';

import { motion } from 'motion/react';

import {
  useAnimateIconContext,
  IconWrapper,
  type IconProps,
} from '@/components/animate-ui/icons/icon';

type MoonProps = IconProps<string>;

function IconComponent({ size, ...props }: MoonProps) {
  const { controls } = useAnimateIconContext();
  
  const variants = {
    moon: {
      initial: { rotate: 0 },
      animate: { 
        rotate: [0, -15, 15, 0],
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
      <motion.path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" variants={variants.moon} initial="initial" animate={controls} />
    </motion.svg>
  );
}

function Moon(props: MoonProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export { Moon };
