"use client";
import { cn } from "@/lib/utils";
import { HoverBorderGradient } from "../ui/hover-border-gradient";
import { Spinner } from "./spinner";

export function ActionButton({
  title,
  onClick,
  className,
  loading,
}: {
  title: string;
  onClick: () => void;
  className?: string;
  loading?: boolean;
}) {
  return (
    <div className="" onClick={onClick}>
      <HoverBorderGradient
        containerClassName="rounded-full"
        as="button"
        className={cn(
          "bg-[#101010] py-4 px-10 cursor-pointer text-white flex items-center space-x-2",
          className
        )}
      >
        <span>{title}</span>
        {loading ? <Spinner /> : <p className="font-bold">→</p>}
      </HoverBorderGradient>
    </div>
  );
}
