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
};

export function Modal({ children, open, onChange, className }: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={onChange}>
      <DialogContent className={className}>
        {children}
      </DialogContent>
    </Dialog>
  );
}


