'use client';

import { motion } from 'motion/react';

import {
  useAnimateIconContext,
  IconWrapper,
  type IconProps,
} from '@/components/animate-ui/icons/icon';

type PieChartProps = IconProps<string>;

function IconComponent({ size, ...props }: PieChartProps) {
  const { controls } = useAnimateIconContext();
  
  const variants = {
    slice1: {
      initial: { scale: 1, originX: 0.5, originY: 0.5 },
      animate: { 
        scale: [1, 1.1, 1],
        transition: { duration: 0.4 } 
      }
    },
    slice2: {
      initial: { scale: 1, originX: 0.5, originY: 0.5 },
      animate: { 
        scale: [1, 0.9, 1],
        transition: { duration: 0.4 } 
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
        d="M21.21 15.89A10 10 0 1 1 8 2.83" 
        variants={variants.slice1}
        initial="initial"
        animate={controls}
      />
      <motion.path 
        d="M22 12A10 10 0 0 0 12 2v10z" 
        variants={variants.slice2}
        initial="initial"
        animate={controls}
      />
    </motion.svg>
  );
}

function PieChart(props: PieChartProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export { PieChart };
