import { cn } from "@/lib/utils"

const Divider = ({className}:{className?:string}) => {
    return <div className={cn("border-b border-brown-border", className)}></div>
}

export default Divider