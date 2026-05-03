import Typography from "@/components/Typography/Typography";
import CreditCardComparison from "./DrainCard";
import { EventName } from "@/lib/analytics/types";
import LandingCTA from "./LandingCTA";

const CardDrainYou = () => {

  return (
    <>
      <div className="flex max-md:pt-20 max-md:pb-10  h-screen max-md:gap-5 max-md:h-auto max-md:flex-col-reverse bg-background-primary gap-30 overflow-hidden items-center justify-center relative z-10">
        {/* LEFT CONTENT */}
        <div className="flex flex-col max-md:items-center justify-start items-start z-10">
          <div className="max-w-[984px] mx-auto text-center">
            <Typography className="font-butlerpro font-medium text-left leading-24">
              Redeem for <br />Best Value
            </Typography>
            <Typography variant="body" className="text-left opacity-90 max-md:text-center">
              Most people redeem points the wrong way.
              FiSense helps<br className="max-md:hidden" />  you unlock the maximum value across, Cash, flights, hotels,<br className="max-md:hidden" />  and vouchers.
            </Typography>
          </div>
          <LandingCTA title="Analyze my card spending" eventButtonName={EventName.ANALYSE_FOR_BEST_VALUE_BTN} />
          
        </div>

        {/* RIGHT CONTENT */}
        <CreditCardComparison />
      </div>
    </>
  );
};

export default CardDrainYou;
