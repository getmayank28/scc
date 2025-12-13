import { cva } from "class-variance-authority";
import Typography from "../Typography/Typography";
import { cn } from "@/lib/utils";

const chipVariants = cva(
  "uppercase border bg-background-primary",
  {
    variants: {
      variant: {
        default:
          "border-primary-orange text-primary-orange",
          success:"border-secondary-success text-secondary-success",
          destructive:"border-destructive text-destructive",
          faded:"border-white/70 text-white/70",
      },
      size: {
        default: "font-bold text-[12px] py-1 px-2 rounded-sm",
        sm: "font-bold text-[10px] py-1 px-2 rounded-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface ChipProps {
  label: string;
  variant?: 'default'|'success'|'destructive'|"faded";
  className?: string;
  size?:'default'|'sm'
}
const Chip = ({ label, variant, className,size }: ChipProps) => {
  return (
    <Typography
      variant="caption"
      className={cn(chipVariants({ variant,size, className }))}
    >
      {label}
    </Typography>
  );
};

export default Chip;
