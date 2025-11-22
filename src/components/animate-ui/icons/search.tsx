'use client';

import { motion } from 'motion/react';

import {
  useAnimateIconContext,
  IconWrapper,
  type IconProps,
} from '@/components/animate-ui/icons/icon';

type SearchProps = IconProps<string>;

function IconComponent({ size, ...props }: SearchProps) {
  const { controls } = useAnimateIconContext();
  
  const variants = {
    search: {
      initial: { scale: 1, x: 0, y: 0 },
      animate: { 
        scale: [1, 1.1, 1],
        x: [0, 1, 0],
        y: [0, -1, 0],
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
      <motion.circle cx="11" cy="11" r="8" variants={variants.search} initial="initial" animate={controls} />
      <motion.path d="m21 21-4.3-4.3" variants={variants.search} initial="initial" animate={controls} />
    </motion.svg>
  );
}

function Search(props: SearchProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export { Search };
