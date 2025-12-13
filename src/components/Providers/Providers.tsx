"use client"
import { StateProviders } from "@/contexts/StateProvider"
import { SessionProvider } from "next-auth/react"
import { FormProvider } from "@/contexts"
import { Toaster } from "react-hot-toast"
import { SidebarContainer } from "../SidebarConatainer/SidebarConatainer"

const ProvderContainer =({children}:{children:React.ReactNode}) => {
    return (
        <SessionProvider>
        <Toaster  position="top-right"/>
        <StateProviders>
        <FormProvider>
        <SidebarContainer>
          {children}
         </SidebarContainer>
        </FormProvider>
        </StateProviders>
        </SessionProvider>
    )
}

export default ProvderContainer