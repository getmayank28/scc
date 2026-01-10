"use client";
import React, { ReactNode, useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "../ui/sidebar";
import { motion } from "motion/react";
import Image from "next/image";
import { PUBLIC_ROUTES, ROUTES } from "@/lib/constants/routes";
import {
  Brain,
  House,
  LogOutIcon,
  MessagesSquare,
  Search,
  User,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { Button } from "../ui/button";
import { signOut } from "next-auth/react";
import Link from "next/link";

export function SidebarContainer({ children }: { children: ReactNode }) {
  const links = [
    {
      label: "Dashboard",
      href: ROUTES.DASHBOARD,
      icon: <House className="h-5 w-5 shrink-0 text-neutral-200" />,
    },
    {
      label: "AI Advisor",
      href: ROUTES.CHOOSE_CARD,
      icon: <MessagesSquare className="h-5 w-5 shrink-0 text-neutral-200" />,
    },
    {
      label: "Spend Optimizer",
      href: ROUTES.SPEND_OPTIMIZER,
      icon: <Brain className="h-5 w-5 shrink-0 text-neutral-200" />,
    },
    // {
    //   label: "Favorites",
    //   href: ROUTES.FAVORITES,
    //   icon: <Heart className="h-5 w-5 shrink-0 text-neutral-200" />,
    // },
    {
      label: "Explore Cards",
      href: ROUTES.CARD_INDO,
      icon: <Search className="h-5 w-5 shrink-0 text-neutral-200" />,
    },
    {
        label: "Profile",
        href: ROUTES.PROFILE,
        icon: (
          <User className="h-5 w-5 shrink-0 text-neutral-200" />
        ),
      },
  ];
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isVerifyRoute = pathname?.includes('/verify')
  const isBlockedRoute = PUBLIC_ROUTES?.includes(pathname) || isVerifyRoute;
  const isAuthBlockedRoute = ['/chat']?.includes(pathname)

  const handleLogout = () => {
    signOut({ callbackUrl: ROUTES.HOME });
    localStorage.clear()
  };

  return (
    <div className={"flex w-full rounded-md min-h-screen"}>
      {!isBlockedRoute && (
        <Sidebar open={open} setOpen={setOpen}>
          <SidebarBody className="fixed z-100 justify-between bg-background-primary gap-10 h-screen border-r border-secondary-orange">
            <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
              {open ? <Logo /> : <LogoIcon />}
              <div className="mt-8 flex flex-col gap-2">
                {links.map((link, idx) => (
                  <SidebarLink className="text-white" key={idx} link={link} />
                ))}
              </div>
            </div>
          </SidebarBody>
        </Sidebar>
      )}
      {(!isBlockedRoute && !isAuthBlockedRoute)&& (
        <div className="w-full py-6 px-6 h-14 flex justify-end fixed top-0 left-0">
          <Button variant="outline" onClick={handleLogout}>
            <LogOutIcon /> Logout
          </Button>
        </div>
      )}

      <div className={`w-full ${isBlockedRoute ? "pl-0" : "max-md:pl-0 pl-[28px]"}`}>
        {children}
      </div>
    </div>
  );
}
export const Logo = () => {
  return (
    <Link
      href="/home"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black"
    >
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium whitespace-pre text-black dark:text-white"
      >
        <Image
          width={120}
          height={24}
          className="w-30 max-md:w-24"
          src="/logoWithTitle.svg"
          alt="logo"
        />
      </motion.span>
    </Link>
  );
};
export const LogoIcon = () => {
  return (
    <Link
      href="/home"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black"
    >
      <Image
        width={120}
        height={24}
        className="w-30 max-md:w-24"
        src="/logo.svg"
        alt="logo"
      />
    </Link>
  );
};
