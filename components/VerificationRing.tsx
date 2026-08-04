"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface VerificationRingProps {
  /** 0 to totalSteps */
  progress: number;
  totalSteps: number;
  size?: number;
  children?: React.ReactNode;
  className?: string;
}

/**
 * The portal's signature element: a segmented ring, like a hardware-wallet
 * confirmation dial, that fills clockwise as the user clears each stage of
 * verification (member check → role check → wallet link → confirmed).
 */
export default function VerificationRing({
  progress,
  totalSteps,
  size = 220,
  children,
  className,
}: VerificationRingProps) {
  const strokeWidth = 3;
  const radius = size / 2 - strokeWidth * 2;
  const circumference = 2 * Math.PI * radius;
  const gap = 6; // degrees of gap between segments
  const segmentAngle = 360 / totalSteps;

  return (
    <div className={cn("relative flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        {Array.from({ length: totalSteps }).map((_, i) => {
          const isFilled = i < progress;
          const isActive = i === progress;
          const segLen = (segmentAngle - gap) / 360 * circumference;
          const gapLen = circumference - segLen;
          const rotation = i * segmentAngle;

          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={isFilled ? "url(#ringGradient)" : "rgba(179,136,255,0.14)"}
              strokeWidth={isActive ? strokeWidth + 1.5 : strokeWidth}
              strokeDasharray={`${segLen} ${gapLen}`}
              strokeLinecap="round"
              transform={`rotate(${rotation} ${size / 2} ${size / 2})`}
              className={isActive ? "animate-pulseGlow" : ""}
              style={{ transition: "stroke 0.6s ease, stroke-width 0.4s ease" }}
            />
          );
        })}
        <defs>
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#B388FF" />
          </linearGradient>
        </defs>
      </svg>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 flex flex-col items-center justify-center text-center"
      >
        {children}
      </motion.div>
    </div>
  );
}
