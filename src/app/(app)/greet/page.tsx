"use client"
import ChatbotGreet from "@/components/ChatbotGreet/ChatbotGreet"
import { AUTH_STATE } from "@/lib/constants/auth"
import { ROUTES } from "@/lib/constants/routes"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"


const Greet = ({component,onClick,loading}:{component?:boolean,onClick?:()=> void, loading:boolean}) => {
    const router = useRouter()
    const session = useSession()

    const handleClick = () => {
      if(component){
        onClick?.()
        return
      }
      if(session?.status === AUTH_STATE.AUTHENTICATED){
        router.push(ROUTES.CHAT)
      }else{
        router.push(ROUTES.SIGN_UP)
      }
    }
    return (
        <div className="flex flex-col h-screen bg-[#111111]">
        <div className="p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="w-30 max-md:w-24" src="/logoWithTitle.svg" alt="logo" />
        </div>
        <ChatbotGreet loading={loading} onClick={handleClick} />
      </div>
    )
}

export default Greet