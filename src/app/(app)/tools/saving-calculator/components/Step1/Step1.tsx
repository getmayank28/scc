import { CustomPieChart } from "@/components/PieChart/PieChart";
import SliderInput from "@/components/SliderInput/SliderInput";
import { useMemo } from "react";
import { SpendProps } from "../../types";
import Typography from "@/components/Typography/Typography";

interface Step1Props {
  spends: SpendProps;
  setSpends: React.Dispatch<React.SetStateAction<SpendProps>>;
}
const Step1 = ({ spends, setSpends }: Step1Props) => {
  const handleChange = (key: string, value: number) => {
    setSpends((prev: SpendProps) => ({
      ...prev,
      [key]: value,
    }));
  };

  const chartData = useMemo(
    () => [
      {
        category: "Online Bill Payments",
        spends: spends?.onlineBillPayment,
        fill: "#F57B42",
      },
      {
        category: "Online shopping Spends",
        spends: spends?.onlineShopping,
        fill: "#F35A13",
      },
      {
        category: "Offline Spends",
        spends: spends?.offlineSpend,
        fill: "#F9AC89",
      },
    ],
    [spends?.onlineBillPayment, spends?.onlineShopping, spends?.offlineSpend]
  );

  return (
    <div className="flex flex-col gap-4 mt-0">
        <Typography variant="h4" className="text-left">Tell us about your spends</Typography>
        <div className="flex rounded-lg">
    <div className="max-w-3xl w-full py-5 px-10 flex flex-col gap-20 ">
      <SliderInput
        value={spends?.onlineBillPayment}
        title="Online spend on Bill Payment"
        description="(water, electricity, rent, fees, tax)"
        showMinMax={false}
        min={10}
        max={100000}
        isOutsideControl
        onChange={(value) => handleChange("onlineBillPayment", value)}
      />
      {/* <div className="h-[1px] rounded-full w-[20%] mx-auto bg-white/30"></div> */}
      <SliderInput
        value={spends?.onlineShopping}
        title="Spend on Online Shopping"
        description="(Amazon, Flipkart, Myntra and all others)"
        showMinMax={false}
        min={10}
        max={100000}
        isOutsideControl
        onChange={(value) => handleChange("onlineShopping", value)}
      />
      {/* <div className="h-[1px] rounded-full w-[20%] mx-auto bg-white/30"></div> */}
      <SliderInput
        value={spends?.offlineSpend}
        title="Total offline spend"
        description="(In store purchases)"
        showMinMax={false}
        min={10}
        max={100000}
        isOutsideControl
        onChange={(value) => handleChange("offlineSpend", value)}
      />
    </div>
    <div className="flex justify-center items-center">
      <CustomPieChart chartData={chartData} />
    </div>
  </div>
    </div>
 
  );
};

export default Step1;
