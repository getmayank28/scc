import React from "react";
import { Card, CardContent } from "@/components/ui/card";
// import { Progress } from "@/components/ui/progress";
import { LucideIcon } from "lucide-react";
// import { cn } from "@/lib/utils";

interface GoalCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  progressPercentage: number;
  color?: string;
  backgroundColor?: string;
  isActive:boolean;
  onClick:()=>void
}

export default function DataCard({
  icon: Icon,
  title,
  description,
  // progressPercentage,
  color = "purple",
  backgroundColor = "purple",
  isActive, 
  onClick
}: GoalCardProps) {
  const hexColorValue = color?.slice(4, -1);
  const hexBgColor= backgroundColor?.slice(4, -1);
  return (
    <Card
      className={`w-full py-5 h-[90px] bg-background-primary shadow-lg cursor-pointer`}
      style={{ borderColor: hexColorValue}}
      onClick={onClick}
    >
      <CardContent className="px-4">
       <div className="flex justify-between items-center">
       <div className="flex gap-3 items-center">
          
          <div
            className={`w-12 h-12 rounded-full flex items-center border justify-center ${backgroundColor}`}
            style={{
              borderColor: hexColorValue,
            }}
          >
            <Icon className="w-6 h-6" style={{ color: hexColorValue }} />
          </div>

          <h2 className="text-xl font-bold text-white/90">{title} Yearly Saving</h2>
  
          </div>
          <div className="flex gap-6 items-center">
          <p className="text-xl  font-bold" style={{color:hexColorValue}}>{description?.split("--")?.at(1)}</p>
          <p className="w-5 h-5 rounded-full"
        style={{background:isActive?hexColorValue:hexBgColor}}></p>
          </div>
         
       </div>

        {/* <div className="mt-4 flex gap-1">
          <p className="text-white/70">Without Card (Yearly): </p>
          <p className="font-bold" style={{color:'#DC0000'}}>INR 0</p>
        </div> */}
        {/* <div className="mb-4 flex gap-1 mt-4">
          <p className="text-white/70">{description?.split("--")?.at(0)}</p>
          <p className="font-bold" style={{color:hexColorValue}}>{description?.split("--")?.at(1)}</p>
        </div> */}

        {/* <Progress
          value={progressPercentage}
          className={cn("h-2", backgroundColor)}
          indicatorClassName={color}
        /> */}
      </CardContent>
    </Card>
  );
}
