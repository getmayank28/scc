import { Sidebar, SidebarBody } from "../ui/sidebar";
import useChatSidebar from "@/lib/hooks/useChatSidebar";
import ChatSidebarBody from "../ChatSidebarBody/ChatSidebarBody";
import useIsMobile from "@/lib/hooks/useIsMobile";

const ChatSidebar = () => {
const {open, setOpen} = useChatSidebar()
const {isMobile} = useIsMobile()


if(isMobile) return null


  return (
    <Sidebar open={open} setOpen={setOpen}>
      <SidebarBody
        isVaraint2
        className="fixed z-100 justify-between bg-brown-sidebar gap-10 h-screen !w-[180px] px-2 pl-4"
      >
       <ChatSidebarBody />
      </SidebarBody>
    </Sidebar>
  );
};

export default ChatSidebar;
