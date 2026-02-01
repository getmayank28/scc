import { DataTable } from "@/components/ui/table/data-table";
import { TableColumn } from "@/types/table";
import { RedemptionOption } from "@/types/redemption";
import { redemptionsCategoryMap } from "@/lib/constants/redemption";
import { formatToINR } from "@/lib/utils/number";

export const spendOptimizerColumns: TableColumn<
    RedemptionOption & { points: number; highestReturn: number }
>[] = [
        {
            key: "rank",
            title: "Rank",
            width: "12.5%",
            render: (_, record, index) => {

                return (
                    <div className={`flex rounded-sm justify-center items-center  text-center font-bold w-10 h-6 ${index === 0 ? 'bg-primary-orange text-white' : 'bg-white/20 text-white'}`}>{index + 1}</div>
                );
            },
        },
        {
            key: "redemptionOptionTitle",
            title: "Redemption Option",
            width: "25%",
            render: (value, record) => {
                const Icon = redemptionsCategoryMap?.[record?.category?.toLowerCase()] ?? redemptionsCategoryMap?.['default']
                return (
                    <div className="flex items-center gap-2">
                        <span className="bg-brown-border p-1 rounded-sm">
                            {Icon && <Icon className="w-4 h-4 text-white" />}
                        </span>
                        <span className="text-sm text-white font-semibold">
                            {value}
                        </span>
                    </div>

                );
            },
        },
        {
            key: "pointConversionRatioInInr",
            title: "Total Value",
            width: "12.5%",
            render: (value, record) => {
                const isAirMiles = record?.redemptionOptionTitle?.toLowerCase()?.includes('miles')

                if (isAirMiles) {
                    return (
                        <span className="text-sm font-semibold text-white capitalize">
                            {Number(record?.points) * 1 + ' miles'}
                        </span>
                    )
                }

                const totalValue = Number(record?.points ?? 0) * Number(value)
                return (
                    <span className="text-sm font-semibold text-white capitalize">
                        {formatToINR(totalValue)}
                    </span>
                )
            },
        },
        {
            key: "pointConversionRatioInInr",
            title: "Ratio",
            width: "15%",
            render: (value, record) => {
                const isAirMiles = record?.redemptionOptionTitle?.toLowerCase()?.includes('miles')


                return (
                    <div className="flex flex-col font-bold text-white">
                        1 Reward point = {isAirMiles ? '1 mile' : '₹' + value}
                    </div>
                );
            },
        },
        {
            key: "valueLost",
            title: "Value Lost",
            width: "12.5%",
            render: (_, record) => {
                const currentValue = Number(record?.points) * Number(record?.pointConversionRatioInInr)
                const loss = record?.highestReturn - currentValue
                return (
                    <div className={`flex flex-col ${loss === 0 ? "text-secondary-success" : "text-destructive"} font-bold`}>
                        {formatToINR(loss)}
                    </div>
                );
            },
        },
    ];
const RedemptionTable = ({ data }: { data: (RedemptionOption & { points: number; highestReturn: number })[] }) => {
    return (
        <DataTable
            data={data}
            columns={spendOptimizerColumns}
            loading={false}
            emptyText="No alerts found"
        />
    )
}

export default RedemptionTable;