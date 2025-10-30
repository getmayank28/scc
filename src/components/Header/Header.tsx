"use client"
import { cn } from "@/lib/utils";
import { HoveredLink, Menu } from "@/components/ui/navbar-menu";
import { useState } from 'react';


const Header = ({ className }: { className?: string }) => {
  const [active, setActive] = useState<string | null>(null);
  return (
    <div
      className={cn("fixed top-5 inset-x-0 max-w-2xl mx-auto z-50", className)}
    >
      <Menu setActive={setActive}>
        <div className="flex justify-between items-center w-full">
          <img className='w-30' src="/logoWithTitle.svg" alt="logo" />
          <div className="flex gap-4 items-center">
            <HoveredLink href="/">Home</HoveredLink>
            <HoveredLink href="/about">About</HoveredLink>
          </div>
        </div>
      </Menu>
    </div>

  );
}

export default Header