import Typography from "@/components/Typography/Typography";
import CreditCardComparison from "./DrainCard";
import { Button } from "@/components/ui/stateful-button";
import { useSignInControl } from "@/contexts/SignInContext";

const CardDrainYou = () => {
  const { openSignUpModal } = useSignInControl();

  return (
    <>
      <div className="flex h-screen bg-background-primary gap-30 overflow-hidden items-center justify-center relative z-10">
        {/* LEFT CONTENT */}
        <div className="flex flex-col justify-start items-start z-10">
          <div className="max-w-[984px] mx-auto text-center">
            <Typography className="font-butlerpro font-medium text-left leading-24">
              Do you have <br />
              the right card?
            </Typography>
            <Typography variant="body" className="text-left opacity-90">
              Making the same purchase can result in different <br />
              rewards, depending on the card you pay with
            </Typography>
          </div>

          <Button
            className="text-sm font-bold py-4 px-10 my-10"
            onClick={openSignUpModal}
          >
            Analyze my card spending
          </Button>
        </div>

        {/* RIGHT CONTENT */}
        <CreditCardComparison />
      </div>
    </>
  );
};

export default CardDrainYou;
