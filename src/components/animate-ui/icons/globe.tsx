'use client';

import { motion } from 'motion/react';

import {
  useAnimateIconContext,
  IconWrapper,
  type IconProps,
} from '@/components/animate-ui/icons/icon';

type GlobeProps = IconProps<string>;

function IconComponent({ size, ...props }: GlobeProps) {
  const { controls } = useAnimateIconContext();
  
  const variants = {
    globe: {
      initial: { rotate: 0 },
      animate: { 
        rotate: 360,
        transition: { duration: 2, ease: "linear" as const, repeat: Infinity } 
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
      <motion.circle cx="12" cy="12" r="10" variants={variants.globe} initial="initial" animate={controls} />
      <motion.path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" variants={variants.globe} initial="initial" animate={controls} />
      <motion.path d="M2 12h20" variants={variants.globe} initial="initial" animate={controls} />
    </motion.svg>
  );
}

function Globe(props: GlobeProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export { Globe };
