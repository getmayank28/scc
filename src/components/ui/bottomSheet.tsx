import {  ReactNode } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children?: ReactNode;
  title?: string;
  description?: string;
  height?: string;
}

const BottomSheet = ({ 
  open, 
  onOpenChange, 
  children, 
  title, 
  description,
  height = 'max-h-[400px]'
}: BottomSheetProps) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent 
      side="bottom" 
      className={`${height} mx-2 rounded-t-xl data-[state=open]:animate-slide-up data-[state=closed]:animate-slide-down`}
    >
      {(title || description) && (
        <SheetHeader className='border-b border-white/30'>
          {title && <SheetTitle>{title}</SheetTitle>}
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
      )}
      <div className="my-2 mt-0">
        {children}
      </div>
    </SheetContent>
  </Sheet>
  );
};


export default BottomSheet