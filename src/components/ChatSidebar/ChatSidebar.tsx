import { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "../ui/sidebar";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { ROUTES } from "@/lib/constants/routes";
import { SquarePen } from "lucide-react";
import Typography from "../Typography/Typography";

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

const links = [
  {
    label: "New Chat",
    href: ROUTES.DASHBOARD,
    icon: <SquarePen className="h-5 w-5 shrink-0 text-neutral-200" />,
  },
];
const ChatSidebar = () => {
  const [open, setOpen] = useState(true);
  return (
      <Sidebar  open={open} setOpen={setOpen}>
        <SidebarBody isVaraint2 className="fixed z-100 justify-between bg-background-primary gap-10 h-screen border-r border-secondary-orange w-[180px]">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink className="text-white" key={idx} link={link} />
              ))}
            </div>
            <Typography variant="body" className="text-sm text-left mt-4 font-semibold">Your chats</Typography>
          </div>
        </SidebarBody>
      </Sidebar>
  );
};

export default ChatSidebar;
