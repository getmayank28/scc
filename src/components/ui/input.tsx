import * as React from "react";

import { cn } from "@/lib/utils/index";
type InputProps = React.ComponentProps<"input"> & {
  rightIcon?: React.ReactNode;
  containerClassName?:string
};

function Input({ className, type, rightIcon,containerClassName, ...props }: InputProps) {
  return (
    <div className={cn("relative h-12 w-full flex justify-center items-center", containerClassName)}>
      <input
        type={type}
        data-slot="input"
        className={cn(
          "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
          className
        )}
        {...props}
      />
      {rightIcon && (
        <div className="absolute top-1/2 transform -translate-y-1/2 right-[5%]">
          {rightIcon}
        </div>
      )}
    </div>
  );
}

export { Input };
