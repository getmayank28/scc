import { CreditCard } from "@/components/CreditCard"
import { LastRecommendationSkeleton } from "@/components/Loader/Loader"
import Typography from "@/components/Typography/Typography"
import useUserData from "@/lib/hooks/useUserData"
import { BotRecommendationCreditCardProps } from "@/types/card"
import { useAnalytics } from "@/lib/analytics/hooks/useAnalytics"
import { EventName } from "@/lib/analytics/types"

const LastRecommendation = ({ cards,isLoading }: { cards: BotRecommendationCreditCardProps[];isLoading:boolean }) => {
  const { name } = useUserData()
  const { track } = useAnalytics()

  if(isLoading){
    return <LastRecommendationSkeleton/>
  }

  return (
    <div className="bg-brown-sidebar max-w-[1270px] rounded-xl w-full p-4 px-6 max-md:p-4 mx-auto max-md:w-full max-md:max-w-[448px]">
      <div className="flex justify-between items-center mb-4">
        <Typography
          variant="caption"
          className="font-bold opacity-100 text-secondary-gray"
        >
          Last Recommendation Based on Your Spendings
        </Typography>
        {/* <Button
            variant="ghost"
            className="cursor-pointer hover:bg-transparent hover:text-white p-0 text-primary-orange opacity-100 font-bold"
          >
            Manage Cards
          </Button> */}
      </div>
      <div className="flex justify-start gap-6 max-md:overflow-x-auto max-md:gap-74">
        {
          cards?.map(card => (
            <CreditCard
              key={card?.cardName}
              background="linear-gradient(135deg,#30251E 60%,#6F4D34 100%,#AD744A 100%)"
              isCardSpotlightActive={false}
              forShow
              removeImage
              number={card?.cardName}
              name={name}
              annualFee={card?.annualFee}
              applyLink={card?.applyLink}
              onApplyClick={() =>
                track(EventName.HOME_RECOMMENDATION_CARD_APPLY_CLICKED, {
                  cardName: card?.cardName,
                  bankName: card?.cardName,
                })
              }
            />
          ))
        }
      </div>
    </div>
  )
}

export default LastRecommendation