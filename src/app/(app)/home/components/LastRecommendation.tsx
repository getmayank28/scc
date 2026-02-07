import { CreditCard } from "@/components/CreditCard"
import Typography from "@/components/Typography/Typography"
import useUserData from "@/lib/hooks/useUserData"
import { BotRecommendationCreditCardProps } from "@/types/card"

const LastRecommendation = ({ cards }: { cards: BotRecommendationCreditCardProps[] }) => {
  const { name } = useUserData()
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
      <div className="flex justify-between gap-4 max-md:overflow-x-auto max-md:gap-74">
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
            />
          ))
        }
      </div>
    </div>
  )
}

export default LastRecommendation