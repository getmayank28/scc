"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import Typography from "@/components/Typography/Typography";
import { BankRedemptionInstructions } from "./redemptionInstructions";

interface RedemptionInstructionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instructions: BankRedemptionInstructions | null;
}

const RedemptionInstructionsModal = ({
  open,
  onOpenChange,
  instructions,
}: RedemptionInstructionsModalProps) => {
  if (!instructions) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-brown-sidebar border-brown-border max-w-lg max-h-[85vh] overflow-y-auto max-md:max-w-[calc(100%-2rem)] max-md:max-h-[65vh]">
        <DialogHeader>
          <DialogTitle className="text-white max-md:text-left text-xl font-bold">
            How to Redeem
          </DialogTitle>
          <DialogDescription className="text-secondary-gray text-sm max-md:text-left">
            Follow these steps to redeem your {instructions.bankName} credit
            card points
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-2">
          {instructions.steps.map((step, index) => (
            <div key={index} className="flex gap-3 items-start">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary-orange/20 flex items-center justify-center mt-0.5">
                <Typography
                  variant="caption"
                  className="text-primary-orange font-bold opacity-100 text-xs"
                >
                  {index + 1}
                </Typography>
              </div>
              <div className="flex flex-col gap-1">
                <Typography
                  variant="caption"
                  className="text-white font-semibold opacity-100 text-left text-sm"
                >
                  {step.title}
                </Typography>
                <Typography
                  variant="p"
                  className="text-secondary-gray text-left leading-relaxed"
                >
                  {step.description}
                </Typography>
              </div>
            </div>
          ))}
        </div>

        {instructions.note && (
          <div className="mt-2 p-3 rounded-md bg-secondary-orange/20 border border-secondary-orange/40">
            <Typography
              variant="p"
              className="text-secondary-gray text-left leading-relaxed"
            >
              <span className="text-primary-orange font-semibold">Note: </span>
              {instructions.note}
            </Typography>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RedemptionInstructionsModal;
