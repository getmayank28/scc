"use client";

import React from "react";
import { cn } from "@/lib/utils";
import Error from "./error";
import { ErrorProp } from "@/types/error";

interface StateHandlerProps {
  loading?: boolean;
  error?: ErrorProp;
  children: React.ReactNode;
  className?: string;

  /** Custom components to render */
  loader?: React.ReactNode;
  errorComponent?: React.ReactNode;
  onErrorTryAgain?:()=>void
}

function StateHandler({
  loading = false,
  error = { error: null},
  children,
  className,
  loader,
  errorComponent,
  onErrorTryAgain
}: StateHandlerProps) {
  if (loading) {
    return (
      <div
        className={cn(
          "w-full h-full",
          className
        )}
      >
        {loader || <p className="text-sm text-muted-foreground">Loading...</p>}
      </div>
    );
  }

  if (error?.error) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center w-full h-full text-center",
          className
        )}
      >
        {errorComponent || (
        <Error error={error?.error} onErrorTryAgain={onErrorTryAgain}/>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
 
export default StateHandler