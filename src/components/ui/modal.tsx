"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";


type ModalProps = {
  open: boolean;
  onChange?: (open: boolean) => void;
  children:React.ReactNode;
  className?:string;
  overlayClassName?: string;
};

export function Modal({ children, open, onChange, className, overlayClassName }: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={onChange}>
      <DialogContent
        className={className}
        overlayClassName={overlayClassName}
        showCloseButton={false}
      >
        {children}
      </DialogContent>
    </Dialog>
  );
}


