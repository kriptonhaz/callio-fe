'use client';

import { motion } from 'motion/react';

import {
  useAnimateIconContext,
  IconWrapper,
  type IconProps,
} from '@/components/animate-ui/icons/icon';

type FileTextProps = IconProps<string>;

function IconComponent({ size, ...props }: FileTextProps) {
  const { controls } = useAnimateIconContext();
  
  const variants = {
    lines: {
      initial: { pathLength: 1, opacity: 1 },
      animate: { 
        pathLength: [0, 1],
        opacity: [0, 1],
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
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <motion.line x1="16" x2="8" y1="13" y2="13" variants={variants.lines} initial="initial" animate={controls} />
      <motion.line x1="16" x2="8" y1="17" y2="17" variants={variants.lines} initial="initial" animate={controls} />
      <motion.line x1="10" x2="8" y1="9" y2="9" variants={variants.lines} initial="initial" animate={controls} />
    </motion.svg>
  );
}

function FileText(props: FileTextProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export { FileText };
