"use client"
import HeaderText from "@/components/HeaderText/HeaderText";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/stateful-button";
import { useState } from "react";
import RedemptionTable from "./RedemptionTable";
import Typography from "@/components/Typography/Typography";
import useRedemptionData from "@/lib/hooks/useRedemptionData";
import RedemptionCard from "./RedemptionCard";
import { IconBulb } from "@tabler/icons-react";
import { RedemptionSkeleton } from "./Loader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGetUserCardsQuery } from "@/store/api";
import useUserData from "@/lib/hooks/useUserData";


const PointRedemption = () => {
  const [query, setQuery] = useState("");
  const [points, setPoints] = useState('')
  const [errors, setErrors] = useState({ points: false, card: false })
  const { userId } = useUserData();

  const { data: userCards } = useGetUserCardsQuery(
    { userId },
    {
      skip: !userId,
    },
  );
  const { handleRedemptionSubmit, isRedemptionLoading, redemptionOptionsData, redemptionRawData: redemptionData } = useRedemptionData()


  const handleSubmit = async () => {
    if (!points && !query) {
      setErrors({ points: true, card: true })
      return
    }
    if (!points) {
      setErrors((prev) => ({ ...prev, points: true }))
      return
    }
    if (!query) {
      setErrors((prev) => ({ ...prev, card: true }))
      return
    }

    handleRedemptionSubmit(query, points)
  }

  return (
    <div className="flex h-full bg-brown-background flex-col max-md:px-4 max-md:pt-20 p-20 min-h-screen">
      <HeaderText
        containerClassName="items-start"
        title="Points Redemption"
        content="Turn your credit card points into maximum value"
        contentVariant="caption"
        titleVariant="h3"
        titleClassName="font-bold"
      />
      <div className="flex rounded-md border border-brown-border max-w-6xl bg-brown-sidebar p-5 gap-4 mt-4 mb-2 max-md:flex-col">
        <div className="w-full">
          <Select
          disabled={isRedemptionLoading}
            value={query}
            onValueChange={(value) => setQuery(value)}
          >
            <SelectTrigger
              id="paymentMethod"
              className={`!h-12 w-full border-primary-orange text-white`}
            >
              <SelectValue placeholder="Select card" />
            </SelectTrigger>
            <SelectContent
              className="!max-h-[300px] !max-w-[430px]"
              position="popper"
              sideOffset={4}
            >
              {userCards?.map((card:{cardId:{name:string}}) => {
                return (
                  <SelectItem key={card.cardId?.name} value={card.cardId?.name}>
                    <div className="flex items-center gap-2">
                      <span>{card.cardId?.name}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
        <Input
          disabled={isRedemptionLoading}
          id="amount"
          type="text"
          placeholder="Enter points..."
          value={points}
          onChange={(e) => setPoints(e.target.value)}
          className={`h-12 max-md:text-xs max-w-md text-lg max-md:mr-auto text-white ${errors.points ? "border-destructive" : "border-primary-orange"
            }`}
        />
        <Button
          disabled={isRedemptionLoading}
          className="rounded-lg h-12 w-xl max-md:w-full px-8 bg-primary-orange/70 max-md:max-w-md"
          onClick={handleSubmit}
        >
          Check My Points Value
        </Button>
      </div>
      {
        isRedemptionLoading ? (
          <RedemptionSkeleton />
        ) : (
          <>
            {
              redemptionOptionsData?.length ? (
                <>
                  <div className="pt-10 pb-1 max-md:hidden">
                    <Typography variant="body" className="text-left opacity-100 font-bold uppercase tracking-wider">Best Options</Typography>
                    <Typography variant="caption" className="text-left opacity-90 font-medium">{redemptionData?.startMessage}</Typography>
                  </div>
                  <div className="grid grid-cols-3 gap-4 py-4 max-md:gap-54 max-md:overflow-x-auto max-md:hidden">
                    {
                      redemptionOptionsData?.slice(0, 3)?.map((ele) => (
                        <RedemptionCard
                          key={ele?.category}
                          isBestOption={Number(ele?.points) * ele?.pointConversionRatioInInr === ele?.highestReturn}
                          tag={ele?.category}
                          title={ele?.redemptionOptionTitle}
                          points={ele?.points}
                          conversionRate={`1:${ele?.pointConversionRatioInInr}`}
                          conversionValue=""
                          totalValue={Number(ele?.points) * ele?.pointConversionRatioInInr}
                          infoText={ele?.note?.slice(0, 90)}
                          buttonText="Redeem now"
                          applyLink={ele?.portalLink}
                        />
                      ))
                    }
                  </div>
                  <Typography variant="body" className="mt-10 text-left opacity-100 font-bold uppercase tracking-wider">value breakdown</Typography>
                  <RedemptionTable
                    data={redemptionOptionsData}
                  />
                </>
              ) : <></>
            }
            {
              (redemptionData?.recommendationForMaxBenefits || redemptionData?.endMessage) ? (
                <div className="p-6 pl-4 mt-6 max-md:p-2 max-md:py-4 flex gap-2 bg-secondary-orange/30 border-l-4 border-primary-orange">
                  <div className="h-8 w-8">
                    <IconBulb size={40} color="#F35A13" className="!w-8 !h-8" />
                  </div>
                  <Typography variant="caption" className="text-left opacity-100 font-bold max-md:font-medium">{redemptionData?.recommendationForMaxBenefits} {redemptionData?.endMessage}</Typography>
                </div>
              ) : <></>
            }
          </>
        )
      }
    </div>
  )
}

export default PointRedemption