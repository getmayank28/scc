import { BadgeIndianRupee, Brain, Home, MessagesSquare, Search } from "lucide-react";
import { ROUTES } from "@/lib/constants/routes";
import { usePathname, useRouter } from "next/navigation";
import useChatSidebar from "@/lib/hooks/useChatSidebar";


const navs = [
  {
    id: 'apply',
    icon: Search,
    href: ROUTES.APPLY_CARD,
  },
  {
    id: 'optimizer',
    icon: Brain,
    href: ROUTES.SPEND_OPTIMIZER,
  },
  {
    id: 'home',
    icon: Home,
    href: ROUTES.DASHBOARD,
  },
  {
    id: 'chat',
    icon: MessagesSquare,
    href: ROUTES.CHAT + "/new",
  },
  {
    id: 'redemption',
    icon: BadgeIndianRupee,
    href: ROUTES.POINTS_REDEMPTION,
  }
]

const BottomBar = () => {
  const pathname = usePathname()
  const router = useRouter()
  const { handleNewChat } = useChatSidebar()

  return (
    <div className="bg-brown-sidebar shadow-2xl hidden z-[9999] p-4 max-md:flex justify-between fixed -bottom-[2px] left-0 right-0">
      {
        navs?.map(ele => (
            <button key={ele?.id} className={`h-14 w-14 ${pathname === ele?.href ? 'bg-[#AD744A]' : 'bg-brown-background'}  rounded-full flex justify-center items-center`}
              onClick={() => {
                if(ele.id === 'chat'){
                  handleNewChat?.()
                }else{
                  router.push(ele?.href)
                }
               
              }}>
              <ele.icon color="#fff" size={28} />
            </button>
        ))
      }
    </div>
  );
};

export default BottomBar