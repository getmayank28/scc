"use client";
import React, { useRef} from "react";
import { useMotionValueEvent, useScroll } from "motion/react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils/index";

export const StickyScroll = ({
  content,
  contentClassName,
}: {
  content: {
    title: string;
    description: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    content?: React.ReactNode | any;
  }[];
  contentClassName?: string;
}) => {
  const [activeCard, setActiveCard] = React.useState(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ref = useRef<any>(null);
  const { scrollYProgress } = useScroll({
    // uncomment line 22 and comment line 23 if you DONT want the overflow container and want to have it change on the entire page scroll
    // target: ref
    container: ref,
    offset: ["start start", "end start"],
  });
  const cardLength = content.length;

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    const cardsBreakpoints = content.map((_, index) => index / cardLength);
    const closestBreakpointIndex = cardsBreakpoints.reduce(
      (acc, breakpoint, index) => {
        const distance = Math.abs(latest - breakpoint);
        if (distance < Math.abs(latest - cardsBreakpoints[acc])) {
          return index;
        }
        return acc;
      },
      0,
    );
    setActiveCard(closestBreakpointIndex);
  });



  return (
    <motion.div
      animate={{
        backgroundColor: '#111',
      }}
      className="w-full relative flex h-[30rem] justify-center space-x-10 overflow-y-auto rounded-md px-10"
      ref={ref}
    >
      <div className="relative w-2xl flex items-start px-4">
        <div className="w-full">
          {content.map((item, index) => (
            <div key={item.title + index} className="my-40">
              <motion.h2
                initial={{
                  opacity: 0,
                }}
                animate={{
                  opacity: activeCard === index ? 1 : 0.3,
                }}
                className="text-4xl font-bold tracking-[3px] text-slate-100"
              >
                {item.title}
              </motion.h2>
              <motion.p
                initial={{
                  opacity: 0,
                }}
                animate={{
                  opacity: activeCard === index ? 1 : 0.3,
                }}
                className="text-2xl mt-8 max-w-sm text-slate-300"
              >
                {item.description}
              </motion.p>
            </div>
            
          ))}
          <div className="h-10"></div>
        </div>
      </div>
      <div
        style={{ background: '#111' }}
        className={cn(
          "sticky -top-10 w-[500px] h-[400px] rounded-md bg-white",
          contentClassName,
        )}
      >
        {content[activeCard].content ?? null}
      </div>
    </motion.div>
  );
};
