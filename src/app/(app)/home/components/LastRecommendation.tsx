import { CreditCard } from "@/components/CreditCard"
import Typography from "@/components/Typography/Typography"
import { Button } from "@/components/ui/button"

const LastRecommendation = ()=>{
    return (
        <div className="bg-brown-sidebar max-w-[1270px] rounded-xl w-full p-4 px-6 mx-auto">
        <div className="flex justify-between items-center mb-2">
          <Typography
            variant="caption"
            className="font-bold opacity-100 text-secondary-gray"
          >
            Last Card Recommendation
          </Typography>
          <Button
            variant="ghost"
            className="cursor-pointer hover:bg-transparent hover:text-white p-0 text-primary-orange opacity-100 font-bold"
          >
            Manage Cards
          </Button>
        </div>
        <div className="flex justify-between gap-4">
          <CreditCard
            background="linear-gradient(135deg,#30251E 60%,#6F4D34 100%,#AD744A 100%)"
            isCardSpotlightActive={false}
            forShow
            removeImage
          />
          <CreditCard
            background="linear-gradient(135deg,#30251E 60%,#6F4D34 100%,#AD744A 100%)"
            isCardSpotlightActive={false}
            forShow
            removeImage
          />
          <CreditCard
            background="linear-gradient(135deg,#30251E 60%,#6F4D34 100%,#AD744A 100%)"
            isCardSpotlightActive={false}
            forShow
            removeImage
          />
        </div>
      </div>
    )
}

export default LastRecommendation