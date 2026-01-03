"use client";
import { MultiStepLoader as Loader } from "../ui/multi-step-loader";

export function MultiStepChatLoader({
  loadingStates,
}: {
  loadingStates: Array<{ text: string }>;
}) {
  return (
    <div className="h-30 w-80">
      <Loader loadingStates={loadingStates} loading={true} duration={2000} />
    </div>
  );
}
