import { cn } from "@/lib/utils";
import Typography, { variantStyles } from "../Typography/Typography";

interface HeaderTextProps {
  title: string;
  content?: string;
  titleVariant?: keyof typeof variantStyles;
  contentVariant?: keyof typeof variantStyles;
  titleClassName?: string;
  contentClassName?: string;
  containerClassName?:string
}
const HeaderText = ({
  title,
  content,
  titleVariant='h3',
  contentVariant='body',
  titleClassName,
  contentClassName,
  containerClassName
}: HeaderTextProps) => {
  return (
    <div className={cn('flex flex-col gap-2 justify-center items-center', containerClassName)}>
      <Typography variant={titleVariant} className={titleClassName}>{title}</Typography>
      <Typography variant={contentVariant} className={contentClassName}>
      {content}
      </Typography>
    </div>
  );
};

export default HeaderText;
