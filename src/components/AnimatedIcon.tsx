import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnimatedIconProps {
  icon: LucideIcon;
  className?: string;
  size?: number;
}

export function AnimatedIcon({ icon: Icon, className, size = 24 }: AnimatedIconProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.1, rotate: 5 }}
      whileTap={{ scale: 0.9 }}
      className={cn("flex items-center justify-center", className)}
    >
      <Icon size={size} />
    </motion.div>
  );
}
