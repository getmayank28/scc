import { DataTable } from "@/components/ui/table/data-table";
import { useGetUserSpendTransactionQuery } from "@/store/spendTransaction";
import { TableColumn } from "@/types/table";
import dayjs from "dayjs";
import { SpendTransaction } from "./data";
import { getDashedFormattedValue } from "@/lib/utils/spendTransaction";
import StateHandler from "@/components/ui/state-handler";
import { TransactionHistorySkeleton } from "@/components/Loader/Loader";
import { getErrorProp } from "@/lib/utils/error";
import Typography from "@/components/Typography/Typography";

export const ICON_COLORS = [
  "bg-[#FFE0EA] text-[#FF6496] border-[#FF6496]",
  "bg-[#E0EAFF] text-[#6496FF] border-[#6496FF]",
  "bg-[#FFF4E0] text-[#FFC864] border-[#FFC864]",
  "bg-[#D0DFE0] text-[#165F61] border-[#165F61]",
  "bg-[#DADAE9] text-[#454893] border-[#454893]",
];

export const spendOptimizerColumns: TableColumn<
  SpendTransaction & { createdAt: string }
>[] = [
    {
      key: "merchantPlatform",
      title: "Merchant & Platform",
      width: "25%",
      render: (_, record, index) => {
        const color = ICON_COLORS[index % ICON_COLORS.length];
        const { merchant, category } = record;

        return (
          <div className="flex items-center gap-3">
            <div
              className={`rounded-full flex justify-center items-center text-xl h-12 w-12 border-2 ${color} font-bold uppercas`}
            >
              {merchant?.slice(0, 1)?.toUpperCase()}
            </div>
            <div className="flex flex-col gap-1">
              <span className={`text-sm ${color?.split(" ")?.at(1)} font-semibold capitalize`}>
                {merchant}
              </span>
              <span className="text-xs max-md:text-[10px] text-muted-foreground capitalize">
                {getDashedFormattedValue(category)} •{" "}
                {/* {getDashedFormattedValue(paymentMethod)} */}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: "createdAt",
      title: "Date",
      width: "15%",
      render: (_, record) => {
        const { createdAt } = record;
        return (
          <span className="text-sm text-white max-md:text-[10px] font-semibold">
            {dayjs(createdAt).format("MMM DD, YYYY")}
          </span>
        );
      },
    },
    {
      key: "amount",
      title: "Amount",
      width: "15%",
      render: (value) => (
        <span className="text-sm font-semibold text-white max-md:text-[12px]">
          ₹{Number(value).toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      key: "emi",
      title: "EMI",
      width: "15%",
      render: (value) => (
        <span className="text-sm font-semibold text-white capitalize max-md:text-[10px]">
          {getDashedFormattedValue(value as string)}
        </span>
      ),
    },
    {
      key: "bestRecommendation",
      title: "Recommendation",
      width: "15%",
      render: (_, record) => {
        const { cardName, expectedBenefit } = record || {};

        if (!cardName)
          return <span className="text-sm text-muted-foreground">—</span>;

        return (
          <div className="flex flex-col">
            <span className="text-sm text-white font-semibold max-md:text-[10px] ">{cardName}</span>
            <span className="text-sm font-bold text-orange-500 max-md:text-[10px] ">
              ✨ {expectedBenefit} Reward Value
            </span>
          </div>
        );
      },
    },
  ];

const Card = ({merchant,category,date,amount,cardName,expectedBenefit,color}:Partial<SpendTransaction> & { date: string, color:string }) => {
  return (
    <div className="bg-brown-sidebar border border-brown-border rounded-md">
      <div className="p-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div
              className={`rounded-full flex justify-center items-center ${color} text-xl h-10 w-10 border-2 font-bold uppercas`}
            >
              {merchant?.slice(0, 1)?.toUpperCase()}
            </div>
            <div className="flex flex-col gap-0">
              <span className={`text-sm text-white font-semibold capitalize`}>
                {merchant}
              </span>
              <span className="text-xs text-muted-foreground capitalize">
              {getDashedFormattedValue(category??"")} •{" "}
              {/* {getDashedFormattedValue(paymentMethod??"")} */}
              </span>
            </div>
          </div>
          <span className="text-xs text-white font-semibold">
          {dayjs(date).format("MMM DD, YYYY")}
          </span>
        </div>
        <div className="flex justify-between mt-4">
          <Typography variant="body" className="opacity-100 font-bold">₹{Number(amount).toLocaleString("en-IN")}</Typography>
          <div className="bg-brown-border p-2 py-1 rounded-full">
            {/* <Typography variant="caption" className="font-semibold"> 
               {getDashedFormattedValue(emi as string)}</Typography> */}
          </div>
        </div>
      </div>
      <div className="flex flex-col justify-between bg-brown-border p-2 mt-3 rounded-b-md">
        <Typography variant="caption" className="opacity-100 font-semibold">{cardName}</Typography>
        <div>
          <Typography variant="caption" className="opacity-100 text-primary-orange font-semibold">✨ {expectedBenefit} Reward Value</Typography>
        </div>
      </div>
    </div>
  )
}

const SpendTransactionHistory = () => {
  const {
    data: spendTransaction,
    isFetching,
    error,
    refetch,
  } = useGetUserSpendTransactionQuery({});

  return (
    <div className="dark mt-8">
      <Typography variant="caption" className="font-bold opacity-secondary-gray text-left">
        Showing last 10 transactions
      </Typography>
      <StateHandler
        error={getErrorProp(error)}
        onErrorTryAgain={refetch}
        loading={isFetching}
        loader={<TransactionHistorySkeleton />}
      >
       <div className="py-4  flex-col gap-4 hidden max-md:flex">
       {
          spendTransaction?.map((ele: SpendTransaction & { createdAt: string }, index:number) => (
            <Card
              key={ele?.category}
              color={ICON_COLORS[index % ICON_COLORS.length]}
              merchant={ele?.merchant}
              category={ele?.category}
              // paymentMethod={ele?.paymentMethod}
              date={ele?.createdAt}
              amount={ele?.amount}
              // emi={ele?.emi}
              cardName={ele?.cardName}
              expectedBenefit={ele?.expectedBenefit}

            />
          ))
        }
       </div>


       <div className="max-md:hidden">
       <DataTable
          data={spendTransaction}
          columns={spendOptimizerColumns}
          loading={false}
          emptyText="No alerts found"
        />
       </div>
      </StateHandler>
    </div>
  );
};

export default SpendTransactionHistory;
