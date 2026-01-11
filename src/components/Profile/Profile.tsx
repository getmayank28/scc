"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { ROUTES } from "@/lib/constants/routes";
import useUserData from "@/lib/hooks/useUserData";

export default function ProfileDropdown() {
  const router = useRouter();
  const {nameInitials} = useUserData()


  const handleLogout = () => {
    signOut({ callbackUrl: ROUTES.HOME });
    localStorage.clear();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="cursor-pointer bg-secondary-orange">
          <AvatarImage src="/avatar.png" alt="User avatar" />
          <AvatarFallback className="bg-secondary-orange p-2 text-white">{nameInitials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent  align="end" className="w-44 bg-background-primary border-primary-orange">
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
