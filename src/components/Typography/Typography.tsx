import React from "react";
import { cn } from "@/lib/utils";


const variantStyles = {
  h1:
    "text-[#FFF] text-center relative text-[80px] font-bold leading-[110%] tracking-[-3px] max-md:text-[56px] max-md:tracking-[-0.4px]",

  body:
    "text-white opacity-70 relative text-center font-satoshi max-md:mt-2 text-[20px] max-md:text-[16px] font-normal leading-[150%] tracking-[-2%] max-md:tracking-[-0.48px] [font-feature-settings:'ss03_on']",

  h2:
    "text-white text-center text-[60px] font-medium leading-[110%] tracking-[-3px] max-md:text-[40px]",
    h3:
    "text-white text-center text-[40px] font-medium leading-[110%] max-md:text-[40px]",
    h4:
    "text-white text-center text-[28px] font-medium leading-[110%] max-md:text-[40px]",
    h5:
    "text-white text-center text-[20px] font-medium leading-[110%] max-md:text-[40px]",
    caption:
    "text-white opacity-70 relative text-center font-satoshi max-md:mt-2 text-[16px]  font-normal leading-[150%] [font-feature-settings:'ss03_on']",


  subtitle:
    "text-white opacity-80 text-center font-satoshi text-[18px] max-md:text-[16px] leading-[140%]",
};

interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  variant?: keyof typeof variantStyles;
  children: React.ReactNode;
  className?: string;
}

const Typography: React.FC<TypographyProps> = ({ variant = "h1", children, className = "", ...props }) => {
  const Component =
    variant === "h1" ? "h1" :
    variant === "h2" ? "h2" :
    "p";
  const classes = cn(variantStyles[variant], className);

  return (
    <Component className={classes} {...props}>
      {children}
    </Component>
  );
};

export default Typography;
