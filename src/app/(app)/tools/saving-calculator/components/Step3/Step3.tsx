"use client"
import { LandingAnimation } from "@/components/LandingAnimation";
import Typography from "@/components/Typography/Typography";
import { ActionButton } from "@/components/ui/action-button";
import { Checkbox } from "@/components/ui/checkbox";
import { ROUTES } from "@/lib/constants/routes";
import { useRouter } from "next/navigation";

const Step3 = () => {
  const router = useRouter()
  const benefits = [
    "Travel insurance value and free or discounted airport transfers",
    "Discounts on car rentals and fuel surcharge waivers",
    "Forex savings compared to debit cards",
    "Reward points converted into flights/amazon gift cards",
    "Airport Lounge/fast-track/security lane access and cost saving",
    "Airline ticket discounts and priority check-in and boarding",
    "Exclusive dining and concierge offers",
  ];

  return (
    <div className="flex flex-col gap-4 mt-10">
      <Typography variant="h4" className="text-left">
        View perks beyond cashback & points
      </Typography>
      <div className="flex  justify-between py-5 px-10 rounded-lg">
      <div className="flex flex-col gap-4">
        <Typography variant="body" className="text-left">
        Get your personalised card, tell us what you are looking for
        </Typography>
        <div className="flex flex-col gap-3">
          {benefits?.map((benefit: string) => (
            <div key={benefit} className="flex gap-2 items-center">
              <Checkbox
                id="toggle-2"
                defaultChecked={Math.random() < 0.5}
                className="w-6 h-6 data-[state=checked]:border-primary-orange border-primary-orange data-[state=checked]:bg-secondary-orange data-[state=checked]:text-white"
              />
              <Typography variant="caption" className="text-left">
                {benefit}
              </Typography>
            </div>
          ))}
        </div>
        <ActionButton title="Find my card now" onClick={() => router.push(ROUTES.SIGN_UP)}/>
      </div>
      <div className="w-[60%] relative max-md:w-[300px] z-[101] h-[392px] max-md:h-[290px]">
          <LandingAnimation cardBackground="linear-gradient(90deg, #F35A13 10%, #8D340B 100%)"/>
        </div>
      </div>
    </div>
  );
};

export default Step3;
