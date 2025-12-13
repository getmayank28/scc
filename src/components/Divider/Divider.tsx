import { cn } from "@/lib/utils"
import { divider } from "../../../public/images/divider"

const Divider = ({className}:{className?:string}) => {
    return  <div className={cn("mx-auto flex justify-center", className)}>{divider}</div>
}

export default Divider