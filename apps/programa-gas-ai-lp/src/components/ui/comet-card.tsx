import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import type { MouseEvent, ReactNode } from "react";
import { useRef } from "react";

import { cn } from "~/lib/utils";

interface CometCardProps {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
}

export function CometCard({
  children,
  className,
  maxTilt = 8,
}: CometCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const xSpring = useSpring(x, { damping: 30, stiffness: 300 });
  const ySpring = useSpring(y, { damping: 30, stiffness: 300 });

  const rotateX = useTransform(
    ySpring,
    [-0.5, 0.5],
    [`${maxTilt}deg`, `-${maxTilt}deg`]
  );
  const rotateY = useTransform(
    xSpring,
    [-0.5, 0.5],
    [`-${maxTilt}deg`, `${maxTilt}deg`]
  );

  const glareX = useTransform(xSpring, [-0.5, 0.5], ["0%", "100%"]);
  const glareY = useTransform(ySpring, [-0.5, 0.5], ["0%", "100%"]);
  const glare = useMotionTemplate`radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.12) 0%, transparent 65%)`;

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!ref.current) {
      return;
    }
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div
      style={{ perspective: "1200px" }}
      className={cn("relative", className)}
    >
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className="relative w-full"
      >
        <motion.div
          className="pointer-events-none absolute inset-0 z-10 rounded-[inherit]"
          style={{ background: glare }}
        />
        {children}
      </motion.div>
    </div>
  );
}
