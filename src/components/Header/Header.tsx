"use client"
import { cn } from "@/lib/utils";
import { HoveredLink, Menu, MenuItem, ProductItem } from "@/components/ui/navbar-menu";
import { ROUTES } from "@/lib/constants/routes";
import { useState } from "react";


const Header = ({ className }: { className?: string }) => {
  const [active, setActive] = useState<string | null>(null);

  return (
      <div
      className={cn("fixed top-5 inset-x-0 max-w-2xl mx-auto z-100 max-md:px-4", className)}
    >

      <Menu setActive={setActive}>
        <div className="flex justify-between items-center w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className='w-30 max-md:w-24' src="/logoWithTitle.svg" alt="logo" />
          <div className="flex gap-4 items-center">
            <HoveredLink href={ROUTES.HOME}>Home</HoveredLink>
            <HoveredLink href={ROUTES.ABOUT}>About</HoveredLink>
            <HoveredLink href={ROUTES.CARD}>Card</HoveredLink>
            <MenuItem setActive={setActive} active={active} item="Tools" >
              <div className="flex flex-col space-y-4 text-sm bg-background-primary">
                <HoveredLink href={ROUTES.SAVING_CALCULATOR}>Saving calculator</HoveredLink>
              </div>
            </MenuItem>
            <HoveredLink href={ROUTES.SIGN_IN} className="border border-primary-orange text-white font-semibold rounded-full px-3 py-1 hover:bg-secondary-orange hover:text-white">Sign in</HoveredLink>
          </div>
        </div>
      </Menu>

  </div>
  );
}

export default Header