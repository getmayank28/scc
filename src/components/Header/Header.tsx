"use client";
import { cn } from "@/lib/utils";
import { HoveredLink, Menu, MenuItem } from "@/components/ui/navbar-menu";
import { ROUTES } from "@/lib/constants/routes";
import { useState } from "react";
import Image from "next/image";
import { useFeatureFlag } from "@/contexts/FeatureContext";
import { FeatureFlagsConfig } from "@/lib/constants/featureFlags";

const Header = ({ className }: { className?: string }) => {
  const [active, setActive] = useState<string | null>(null);

  const isWaitlistEnabled = useFeatureFlag(FeatureFlagsConfig.WAITLIST);

  return (
    <div
      className={cn(
        "fixed top-5 inset-x-0 max-w-2xl max-md:max-w-[350px] mx-auto z-100 max-md:px-4",
        className
      )}
    >
      <Menu setActive={setActive}>
        <div className="flex justify-between items-center w-full">
          <HoveredLink href={ROUTES.HOME} className="hidden max-md:flex">
            <Image width={28} height={28} src="/logo.svg" alt="logo" />
          </HoveredLink>
          <HoveredLink href={ROUTES.HOME} className="max-md:hidden">
            <Image width={96} height={20} src="/logoWithTitle.svg" alt="logo" />
          </HoveredLink>

          <div className="flex gap-4 items-center max-md:gap-2">
            {isWaitlistEnabled && (
              <HoveredLink
                href={ROUTES.HOME}
                className="max-md:text-[14px] max-md:font-semibold"
              >
                Home
              </HoveredLink>
            )}
            <HoveredLink
              href={ROUTES.ABOUT}
              className="max-md:text-[14px] max-md:font-semibold"
            >
              About
            </HoveredLink>
            {isWaitlistEnabled ? (
              <></>
            ) : (
              <>
                <HoveredLink
                  href={ROUTES.CHOOSE_CARD}
                  className="max-md:text-[14px] max-md:font-semibold"
                >
                  Card
                </HoveredLink>
                <MenuItem setActive={setActive} active={active} item="Tools">
                  <div className="flex flex-col space-y-4 text-sm bg-background-primary">
                    <HoveredLink
                      href={ROUTES.SAVING_CALCULATOR}
                      className="max-md:text-[14px] max-md:font-semibold"
                    >
                      Saving calculator
                    </HoveredLink>
                  </div>
                </MenuItem>
                <HoveredLink
                  href={ROUTES.SIGN_IN}
                  className="border max-md:text-[14px] border-primary-orange text-white font-semibold rounded-full px-3 py-1 hover:bg-secondary-orange hover:text-white"
                >
                  Sign in
                </HoveredLink>
              </>
            )}
          </div>
        </div>
      </Menu>
    </div>
  );
};

export default Header;
