import { BadgeIndianRupee, Brain, Home, MessagesSquare, ShieldAlert } from "lucide-react";
import { ROUTES } from "@/lib/constants/routes";
import { usePathname, useRouter } from "next/navigation";
import useChatSidebar from "@/lib/hooks/useChatSidebar";


const navs = [
  // Apply Card lives in the sidebar and on the home screen; Insights earns the
  // slot here because it is a daily-return surface rather than an occasional one.
  {
    id: 'insights',
    label: 'Insights',
    icon: ShieldAlert,
    href: ROUTES.INSIGHTS,
  },
  {
    id: 'optimizer',
    label: 'Optimize',
    icon: Brain,
    href: ROUTES.SPEND_OPTIMIZER,
  },
  {
    id: 'home',
    label: 'Home',
    icon: Home,
    href: ROUTES.DASHBOARD,
  },
  {
    id: 'chat',
    label: 'AI Advisor',
    icon: MessagesSquare,
    href: ROUTES.CHAT + "/new",
  },
  {
    id: 'redemption',
    label: 'Redeem',
    icon: BadgeIndianRupee,
    href: ROUTES.POINTS_REDEMPTION,
  }
]

const BottomBar = () => {
  const pathname = usePathname()
  const router = useRouter()
  const { handleNewChat } = useChatSidebar()

  return (
    <div className="bg-brown-sidebar shadow-2xl hidden z-[9999] px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] max-md:flex justify-between items-end fixed bottom-0 left-0 right-0 border-t border-white/5">
      {
        navs?.map(ele => {
          // `/chat/new` is a sub-path, so compare against the section root; a nested
          // route keeps its section lit.
          const root = ele.href === ROUTES.CHAT + "/new" ? ROUTES.CHAT : ele.href
          const isActive = pathname === root || pathname.startsWith(root + "/")
          return (
            <button
              key={ele?.id}
              aria-label={ele?.label}
              aria-current={isActive ? 'page' : undefined}
              className="flex-1 flex flex-col items-center gap-1 py-1.5 px-1 min-w-0 active:scale-95 transition-transform"
              onClick={() => {
                if (ele.id === 'chat') {
                  handleNewChat?.()
                } else {
                  router.push(ele?.href)
                }
              }}
            >
              <span
                className={`h-11 w-11 flex justify-center items-center rounded-full transition-colors ${
                  isActive ? 'bg-primary-orange' : 'bg-brown-background'
                }`}
              >
                <ele.icon color={isActive ? "#25190F" : "#fff"} size={22} />
              </span>
              <span
                className={`text-[11px] leading-none font-medium truncate max-w-full transition-colors ${
                  isActive ? 'text-primary-orange font-semibold' : 'text-white/70'
                }`}
              >
                {ele?.label}
              </span>
            </button>
          )
        })
      }
    </div>
  );
};

export default BottomBar