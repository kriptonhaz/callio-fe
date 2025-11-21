import { motion, Variants } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnimatedIconProps {
  icon: LucideIcon;
  className?: string;
  size?: number;
}

const iconVariants: Variants = {
  rest: {
    scale: 1,
    rotate: 0,
  },
  hover: {
    scale: 1.1,
    rotate: [0, -10, 10, -5, 5, 0],
    transition: {
      duration: 0.5,
      ease: "easeInOut",
      times: [0, 0.2, 0.4, 0.6, 0.8, 1]
    }
  },
  tap: {
    scale: 0.9,
  }
};

export function AnimatedIcon({ icon: Icon, className, size = 24 }: AnimatedIconProps) {
  return (
    <motion.div
      initial="rest"
      whileHover="hover"
      whileTap="tap"
      variants={iconVariants}
      className={cn("flex items-center justify-center", className)}
    >
      <Icon size={size} />
    </motion.div>
  );
}
