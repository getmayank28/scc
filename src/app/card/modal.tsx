"use client";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  removeCloseButton?: boolean;
  allowOutsideClickClose?:boolean
}

export default function Modal({
  isOpen,
  onClose,
  children,
  className,
  removeCloseButton,
  allowOutsideClickClose,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed bg-black/50  inset-0 z-[99999] flex items-center justify-center"
      style={{ zIndex: 2147483647 }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-transparent bg-opacity-50"
        onClick={allowOutsideClickClose?onClose:()=>{}}
      />

      {/* Modal Content */}
      <div
        className={cn(
          `relative bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 z-[100000]`,
          className
        )}
      >
        {!removeCloseButton && (
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        )}
        {children}
      </div>
    </div>,
    document.body
  );
}