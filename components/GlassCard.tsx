import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

export default function GlassCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("glass-card p-6", className)} {...props} />;
}
