"use client";
import { MultiStepLoader as Loader } from "../ui/multi-step-loader";

const loadingStates = [
    {
      text: "Learning your spending",
    },
    {
      text: "Categorizing your expenses",
    },
    {
      text: "Scanning 500+ credit cards",
    },
    {
      text: "Analyzing rewards, and benefits",
    },
    {
      text: "Matching cards to your lifestyle",
    },
    {
      text: "Optimizing for maximum benefits",
    },
    {
      text: "Running cards comparisons",
    },
    {
      text: "Finding your best match",
    },
  ];
  
export function MultiStepChatLoader() {
  return (
    <div className="h-30 w-80">
      <Loader loadingStates={loadingStates} loading={true} duration={2000} />
    </div>
  );
}
