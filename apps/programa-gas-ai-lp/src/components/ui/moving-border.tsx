import {
  motion,
  useAnimationFrame,
  useMotionTemplate,
  useMotionValue,
  useTransform,
} from "motion/react";
import React, { useRef, useState } from "react";

import { cn } from "~/lib/utils";

interface ButtonProps {
  borderRadius?: string;
  children: React.ReactNode;
  as?: React.ElementType;
  containerClassName?: string;
  borderClassName?: string;
  duration?: number;
  hoverDuration?: number;
  className?: string;
  [key: string]: unknown;
}

export function Button({
  borderRadius = "1.75rem",
  children,
  as: Component = "button",
  containerClassName,
  borderClassName,
  duration = 8000,
  hoverDuration = 3500,
  className,
  ...otherProps
}: ButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const activeDuration = isHovered ? hoverDuration : duration;

  return (
    <Component
      className={cn(
        "relative h-16 w-40 overflow-hidden bg-transparent p-[2px] text-xl",
        containerClassName
      )}
      style={{
        borderRadius: borderRadius,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...otherProps}
    >
      {/* Animated glow dot */}
      <div
        className="absolute inset-0"
        style={{ borderRadius: `calc(${borderRadius} * 0.96)` }}
      >
        <MovingBorder duration={activeDuration} rx="30%" ry="30%">
          <div
            className={cn(
              "h-20 w-20 opacity-[0.8] bg-[radial-gradient(#0F2B3C_40%,transparent_60%)]",
              borderClassName
            )}
          />
        </MovingBorder>
      </div>

      {/* Inner button surface */}
      <div
        className={cn(
          "relative flex h-full w-full items-center justify-center text-sm text-white antialiased",
          className
        )}
        style={{
          borderRadius: `calc(${borderRadius} * 0.96)`,
        }}
      >
        {children}
      </div>
    </Component>
  );
}

interface MovingBorderProps {
  children: React.ReactNode;
  duration?: number;
  rx?: string;
  ry?: string;
  [key: string]: unknown;
}

export function MovingBorder({
  children,
  duration = 2000,
  rx,
  ry,
  ...otherProps
}: MovingBorderProps) {
  const pathRef = useRef<SVGRectElement | null>(null);
  const progress = useMotionValue<number>(0);
  // Use a ref so useAnimationFrame always reads the latest duration without re-subscribing
  const durationRef = useRef(duration);
  durationRef.current = duration;
  // Accumulate position via delta to avoid jumps when duration changes
  const progressRef = useRef(0);

  useAnimationFrame((_time, delta) => {
    const length = pathRef.current?.getTotalLength();
    if (length) {
      const pxPerMillisecond = length / durationRef.current;
      progressRef.current =
        (progressRef.current + delta * pxPerMillisecond) % length;
      progress.set(progressRef.current);
    }
  });

  const x = useTransform(
    progress,
    (val) => pathRef.current?.getPointAtLength(val).x ?? 0
  );
  const y = useTransform(
    progress,
    (val) => pathRef.current?.getPointAtLength(val).y ?? 0
  );

  const transform = useMotionTemplate`translateX(${x}px) translateY(${y}px) translateX(-50%) translateY(-50%)`;

  return (
    <>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="absolute h-full w-full"
        width="100%"
        height="100%"
        {...otherProps}
      >
        <rect
          fill="none"
          width="100%"
          height="100%"
          rx={rx}
          ry={ry}
          ref={pathRef}
        />
      </svg>
      <motion.div
        style={{
          display: "inline-block",
          left: 0,
          position: "absolute",
          top: 0,
          transform,
        }}
      >
        {children}
      </motion.div>
    </>
  );
}
