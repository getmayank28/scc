"use client"
import { cn } from "@/lib/utils";
import { HoveredLink, Menu } from "@/components/ui/navbar-menu";


const Header = ({ className }: { className?: string }) => {

  return (
    <div
      className={cn("fixed top-5 inset-x-0 max-w-2xl mx-auto z-50 max-md:px-4", className)}
    >
      <Menu setActive={() => {}}>
        <div className="flex justify-between items-center w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className='w-30 max-md:w-24' src="/logoWithTitle.svg" alt="logo" />
          <div className="flex gap-4 items-center">
            <HoveredLink href="/">Home</HoveredLink>
            <HoveredLink href="/about">About</HoveredLink>
            <HoveredLink href="/card">Card</HoveredLink>
          </div>
        </div>
      </Menu>
    </div>
  );
}

export default Header