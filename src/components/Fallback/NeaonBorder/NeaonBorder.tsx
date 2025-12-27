"use client";

import { cn } from "@/lib/utils";

const NeonBorder = ({
  children,
  className,
  onClick
}: {
  children: React.ReactNode;
  className?: string;
  onClick?:() => void
}) => {
  return (
    <div className={cn("flex justify-center cursor-pointer", className)} onClick={onClick}>
      <div className="relative group">
        <div className="absolute -inset-1 bg-secondary-orange rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 group-hover:animate-pulse-glow"></div>
        <div className="absolute -inset-0.5 bg-secondary-orange rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 grounp-hover:animate-pulse-glow"></div>
        {children}
      </div>
      <style jsx>{`
        @keyframes pulse-glow {
          0%,
          100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.8;
          }
        }
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default NeonBorder;