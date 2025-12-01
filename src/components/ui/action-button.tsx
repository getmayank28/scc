"use client";
import { cn } from "@/lib/utils";
import { HoverBorderGradient } from "../ui/hover-border-gradient";

export function ActionButton({ title, onClick, className }: { title: string, onClick:()=>void, className?:string}) {
  
    return (
        <div className="mt-8" onClick={onClick}>
            <HoverBorderGradient
                containerClassName="rounded-full"
                as="button"
                className={cn("bg-[#101010] py-4 px-10 cursor-pointer text-white flex items-center space-x-2", className)}
            >
                <span>{title}</span>
                <p className="font-bold">→</p>
            </HoverBorderGradient>
        </div>
    );
}


