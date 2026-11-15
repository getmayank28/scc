import { RecentSpendTransactionSectionSkeleton } from "@/components/Loader/Loader";
import Typography from "@/components/Typography/Typography"
import dayjs from "dayjs";

type TransactionCardProps = {
  merchantName: string;
  category: string;
  date: string;
  amount: number;
  balance: number;
  avatarLetter: string;
  isIncome?: boolean;
  avatarColor?:string
};

export const ICON_COLORS = [
  "bg-[#FFE0EA] text-[#FF6496] border-[#FF6496]",
  "bg-[#E0EAFF] text-[#6496FF] border-[#6496FF]",
  "bg-[#D0DFE0] text-[#165F61] border-[#165F61]",
  "bg-[#DADAE9] text-[#454893] border-[#454893]",
  "bg-[#FFF4E0] text-[#FFC864] border-[#FFC864]",
];

const TransactionCard: React.FC<TransactionCardProps> = ({
  merchantName,
  category,
  date,
  amount,
  balance,
  avatarLetter,
  avatarColor
}) => {
  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-2">
        <div
          className={`rounded-full flex justify-center items-center text-lg h-10 w-10 border-2 font-bold uppercase
            ${avatarColor}`}
        >
          {avatarLetter}
        </div>

        <div className="flex flex-col">
          <span className="text-sm text-white font-semibold capitalize">
            {merchantName}{" "}
            <span className="text-[10px] opacity-90">
              ({category})
            </span>
          </span>

          <span className="text-xs text-secondary-gray font-bold">
            {dayjs(date).format("MMM DD, YYYY")}
          </span>
        </div>
      </div>

      <div>
        <Typography
          variant="caption"
          className={`text-right font-bold text-secondary-success`}
        >
           ₹{amount.toLocaleString()}
        </Typography>

        <Typography
          variant="caption"
          className="text-[12px] text-right font-bold text-white/80"
        >
          ₹{balance.toLocaleString()}
        </Typography>
      </div>
    </div>
  );
};


interface SpendCard {
  isBestCard: boolean;
  directSwipeSavingsInInr: number;
  voucherSavingsInInr: number;
}

interface SpendProps {
  _id:string;
  merchant:string;
  category:string;
  createdAt:string;
  expectedBenefit:number;
  amount:number;
  cards: SpendCard[];
}


const RecendSpendTransactionSection = ({spendTransaction,isLoading}:{spendTransaction:SpendProps[];isLoading:boolean}) => {

  if(isLoading){
    return <RecentSpendTransactionSectionSkeleton/>
  }

  return (
    <div className="w-md bg-brown-sidebar p-4 px-6 rounded-xl min-h-[292px] max-md:w-full max-md:min-h-fit max-md:p-4">
      <div className="flex justify-between items-center mb-2">
        <Typography
          variant="caption"
          className="font-bold opacity-100 text-secondary-gray"
        >
          Recent Spend Transaction
        </Typography>
      </div>

      <div className=" flex flex-col gap-4">
        {
          spendTransaction?.slice(0,4)?.map((spend, index:number) => {

            const bestCard = spend?.cards?.find(card => card?.isBestCard)
            const expectedBenefit = Math.max(bestCard?.directSwipeSavingsInInr ?? 0, bestCard?.voucherSavingsInInr ?? 0)
            return (
              <TransactionCard
                key={spend?._id}
                merchantName={spend?.merchant}
                category={spend?.category}
                date={spend?.createdAt}
                amount={expectedBenefit}
                balance={spend?.amount}
                avatarLetter={spend?.merchant?.slice(0, 1)}
                avatarColor={ICON_COLORS[index % ICON_COLORS.length]}
              />
            )
          })
        }
      </div>
    </div>
  )
}


export default RecendSpendTransactionSection