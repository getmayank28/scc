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
      const { merchant, category, paymentMethod } = record;

      return (
        <div className="flex items-center gap-3">
          <div
            className={`rounded-full flex justify-center items-center text-xl h-12 w-12 border-2 ${color} font-bold uppercas`}
          >
            {merchant?.slice(0, 1)?.toUpperCase()}
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm text-white font-semibold capitalize">
              {merchant}
            </span>
            <span className="text-xs text-muted-foreground capitalize">
              {getDashedFormattedValue(category)} •{" "}
              {getDashedFormattedValue(paymentMethod)}
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
        <span className="text-sm text-white font-semibold">
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
      <span className="text-sm font-semibold text-white">
        ₹{Number(value).toLocaleString("en-IN")}
      </span>
    ),
  },
  {
    key: "emi",
    title: "EMI",
    width: "15%",
    render: (value) => (
      <span className="text-sm font-semibold text-white capitalize">
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
          <span className="text-sm text-white font-semibold">{cardName}</span>
          <span className="text-sm font-bold text-orange-500">
            ✨ {expectedBenefit} Reward Value
          </span>
        </div>
      );
    },
  },
];

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
        <DataTable
          data={spendTransaction}
          columns={spendOptimizerColumns}
          loading={false}
          emptyText="No alerts found"
        />
      </StateHandler>
    </div>
  );
};

export default SpendTransactionHistory;
