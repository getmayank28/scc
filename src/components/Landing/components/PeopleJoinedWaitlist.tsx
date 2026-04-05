import Typography from "@/components/Typography/Typography"
import Image from "next/image"

const PeopleJoinedWaitlist  = () => {
    return (
        <div className="flex items-center max-md:justify-center max-md:pb-10 gap-1">
            <Image width={105} height={40} src="/images/waitlisted-people.png" alt="people"/>
            <Typography variant="caption" className="text-sm font-bold">Trusted by 400+ early adopters</Typography>
        </div>

    )

}


export default PeopleJoinedWaitlist