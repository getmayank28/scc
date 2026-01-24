import Typography from "@/components/Typography/Typography"
import { Button } from "@/components/ui/button";
const TransactionCard = () => (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-2">
        <div
          className={`rounded-full flex justify-center items-center text-lg h-10 w-10 border-2 bg-[#FFE0EA] text-[#FF6496] border-[#FF6496] font-bold uppercas`}
        >
          M
        </div>
        <div className="flex flex-col gap-0">
          <span className="text-sm text-white font-semibold capitalize">
            Amazon{" "}
            <span className="text-[10px] opacity-90">(online shopping)</span>
          </span>
          <span className="text-xs text-secondary-gray font-bold">
            Jan 17, 2026
          </span>
        </div>
      </div>
      <div>
        <Typography
          variant="caption"
          className="text-right opacity-100 font-bold text-secondary-success"
        >
          ₹417
        </Typography>
        <Typography
          variant="caption"
          className="text-[12px] text-right opacity-100 font-bold text-secondary-gray"
        >
          ₹5,000
        </Typography>
      </div>
    </div>
  );

const RecendSpendTransactionSection = () => {
    return (
        <div className="w-md bg-brown-sidebar p-4 px-6 rounded-xl min-h-[292px]">
        <div className="flex justify-between items-center mb-2">
          <Typography
            variant="caption"
            className="font-bold opacity-100 text-secondary-gray"
          >
            Recent Spend Transaction
          </Typography>
          <Button
            variant="ghost"
            className="cursor-pointer hover:bg-transparent hover:text-white p-0 text-primary-orange opacity-100 font-bold"
          >
            See All
          </Button>
        </div>

        <div className=" flex flex-col gap-4">
          <TransactionCard />
          <TransactionCard />
          <TransactionCard />
          <TransactionCard />
        </div>
      </div>
    )
}


export default RecendSpendTransactionSection