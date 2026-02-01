import Typography from "@/components/Typography/Typography"
import { Button } from "@/components/ui/button"
import Divider from "@/components/ui/divider"
import { formatToINR } from "@/lib/utils/number"

interface RedemptionCardProps {
    isBestOption?: boolean
  
    tag: string
    title: string
  
    points: number
    conversionRate: string
    conversionValue: string
    totalValue: number
  
    infoText: string
    buttonText: string
    applyLink:string
  }

const RedemptionCard = ({
  isBestOption,
  tag,
  title,
  points,
  conversionRate,
  totalValue,
  buttonText,
  applyLink
}: RedemptionCardProps) => {
  return (
    <div
      className={`bg-brown-sidebar relative rounded-md max-w-md border-2 ${
        isBestOption ? "border-primary-orange" : "border-brown-border"
      } p-4 flex flex-col justify-start`}
    >
      {isBestOption && (
        <div className="absolute top-0 right-0 text-sm font-bold w-fit p-1 px-2 uppercase tracking-wider text-white bg-primary-orange">
          best value
        </div>
      )}

      <div className="w-fit flex flex-col gap-2">
        <div className="text-sm font-bold w-fit p-1 px-2 uppercase tracking-wider text-primary-orange bg-secondary-orange/40">
          {tag}
        </div>
        <Typography variant="body" className="text-md opacity-100 font-bold text-left">
          {title}
        </Typography>
      </div>

      <Divider className="my-4" />

      <div className="grid grid-cols-3">
        <div className="flex flex-col gap-1">
          <Typography variant="caption" className="text-sm text-left font-bold uppercase text-secondary-gray">
            Point
          </Typography>
          <Typography variant="h5" className="font-bold text-left">
            {points.toLocaleString()}
          </Typography>
        </div>

        <div className="flex flex-col justify-center items-center gap-1">
          <Typography variant="caption" className="text-sm font-bold uppercase text-secondary-gray">
            conversion
          </Typography>
          <div className="flex items-center gap-1">
            <Typography variant="h5" className="font-bold text-center text-primary-orange">
              {conversionRate}
            </Typography>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <Typography variant="caption" className="text-sm font-bold uppercase text-secondary-gray text-right">
            Total value
          </Typography>
          <Typography variant="h5" className="font-bold text-right">
            {formatToINR(totalValue)}
          </Typography>
        </div>
      </div>

      <Divider className="my-4" />

      {/* <div className="flex gap-3 border p-1 px-3 rounded-md bg-secondary-orange/30 border-secondary-orange">
        <Info size={30} color="#fff" />
        <Typography variant="caption" className="text-sm text-left font-semibold text-white/80">
          {infoText}
        </Typography>
      </div> */}

      <Button disabled={!applyLink} className="rounded-md mt-4" onClick={() => window.open(applyLink,"_blank")}>{buttonText}</Button>
    </div>
  )
}

export default RedemptionCard
