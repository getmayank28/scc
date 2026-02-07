import Modal from "@/app/card/modal"
import Typography from "../Typography/Typography"
import { BadgeCheck, BadgeIndianRupee, BadgeX, Squircle, X } from "lucide-react"
import { BotRecommendationCreditCardProps } from "@/types/card"
import { Button } from "../ui/stateful-button"

const CardRecommendationModal = ({ open = false, onClose, ...rest }: BotRecommendationCreditCardProps & { open?: boolean, onClose: () => void }) => {
    return (
        <Modal
            isOpen={open}
            onClose={onClose}
            removeCloseButton
            allowOutsideClickClose={false}
            className="relative h-fit min-h-[65vh] border-2 border-brown-border bg-brown-background max-md:w-full max-md:pb-[80px] max-md:min-w-full max-md:h-screen max-md:overflow-y-auto max-md:rounded-none w-[800px] min-w-[800px] max-w-[80vw]"
        >
            <div onClick={onClose} className="z-40 absolute top-5 cursor-pointer right-5 bg-[#372921] w-10 h-10 max-md:w-8 max-md:h-8 rounded-full flex justify-center items-center"><X color="#ffffff"/></div>
            <div>
                <Typography variant="body" className="text-left font-bold opacity-100 text-secondary-gray">{rest?.cardName}</Typography>
                <Typography variant="h3" className="font-bold text-left my-2"><span className="text-primary-orange">{rest?.netAnnualRewardLoss}</span> annual potential loss</Typography>
            </div>
            <div className="flex gap-4 mt-4 max-md:flex-col">
                <div className="flex-1">
                    <div className="flex p-3 px-4 justify-start items-center gap-2 bg-brown-sidebar">
                        <BadgeCheck size={20} color="#22C55F" />
                        <Typography variant="caption" className="text-left opacity-100 font-semibold uppercase">why this card</Typography>
                    </div>
                    <div className="flex p-3 px-4 justify-center items-start gap-2 bg-[#372921]">
                        <Typography variant="caption" className="text-left opacity-100 text-white/80 font-semibold text-sm">{rest?.whyThisCard}
                        </Typography>
                    </div>
                </div>
                <div className="flex-1">
                    <div className="flex p-3 px-4 justify-start items-center gap-2 bg-brown-sidebar">
                        <BadgeX size={20} color="#FF2C02" />
                        <Typography variant="caption" className="text-left opacity-100 font-semibold uppercase">not ideal for</Typography>
                    </div>
                    <div className="flex p-3 px-4 justify-center items-start gap-2 bg-[#372921]">
                        <Typography variant="caption" className="text-left opacity-100 text-white/80 font-semibold text-sm">{rest?.notIdealFor}
                        </Typography>
                    </div>
                </div>
            </div>
            <div className="flex gap-6 mt-4 mb-10">
                <div className="bg-[#372921]  max-w-full rounded-sm grow">
                    <div className="flex p-3 px-4 justify-start items-center gap-2 bg-brown-sidebar">
                        <BadgeIndianRupee size={20} color="#AD744A" />
                        <Typography variant="caption" className="text-left text-sm opacity-100 font-semibold uppercase">Category Wise Rewards
                        </Typography>
                    </div>
                    {
                        rest?.categoryWiseReward.split(", ")?.map((bullet: string) => (
                            <div key={bullet} className="flex max-w-sm p-2 px-4 justify-start items-center gap-2 ">
                                <Squircle size={20} color="#AD744A" />
                                <Typography variant="caption" className="text-left opacity-100 text-white/80 font-semibold text-sm">{bullet}
                                </Typography>
                            </div>
                        ))
                    }
                </div>
            </div>
            <div className="bg-[#372921] flex justify-between p-4 max-md:gap-2 absolute max-md:fixed bottom-0 left-0 w-full">
                <div className="bg-brown-sidebar text-[12px] p-2 px-4 rounded-full text-white/80 font-bold uppercase max-md:text-[10px] max-md:h-fit max-md:text-center">Annual Fee: {rest?.annualFee}</div>
                <Button className="font-bold" onClick={()=>window.open(rest?.applyLink, '_blank')}>Apply</Button>
            </div>
        </Modal>
    )

}


export default CardRecommendationModal