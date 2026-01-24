"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { ROUTES } from "@/lib/constants/routes";
import useUserData from "@/lib/hooks/useUserData";
import Typography from "../Typography/Typography";

export default function ProfileDropdown() {
  const router = useRouter();
  const { nameInitials } = useUserData();

  const handleLogout = () => {
    if (typeof window === "undefined") return null;
    signOut({ callbackUrl: ROUTES.HOME });
    localStorage.clear();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex justify-center items-center max-md:w-10 max-md:h-10 rounded-full p-2 border border-[#452D1C] bg-[linear-gradient(to_bottom,#30251E_70%,#6F4D34_100%,#AD744A_100%)]">
          <Typography
            variant="body"
            className="text-left opacity-100 font-bold text-[#C7C4C6]"
          >
            {nameInitials || "UN"}
          </Typography>
        </div>
        {/* <Avatar className="cursor-pointer bg-secondary-orange">
          <AvatarImage src="/avatar.png" alt="User avatar" />
          <AvatarFallback className="bg-secondary-orange p-2 text-white">{nameInitials}</AvatarFallback>
        </Avatar> */}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-44 bg-background-primary border-primary-orange"
      >
        <DropdownMenuItem
          onClick={() => router.push(ROUTES.PROFILE)}
          className="cursor-pointer"
        >
          <User className="mr-2 h-4 w-4 hover:bg-black" />
          Profile
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer text-white/80"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
