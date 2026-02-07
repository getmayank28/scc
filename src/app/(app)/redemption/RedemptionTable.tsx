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
        <div className="flex flex-col gap-4 mt-4">
            {
                data?.map(ele => {
                    const Icon = redemptionsCategoryMap?.[ele?.category?.toLowerCase()] ?? redemptionsCategoryMap?.['default']
                    const isAirMiles = ele?.redemptionOptionTitle?.toLowerCase()?.includes('miles')
                    const currentValue = Number(ele?.points) * Number(ele?.pointConversionRatioInInr)
                    const loss = ele?.highestReturn - currentValue

                    return (
                        <div key={ele?.highestReturn} className={`relative bg-brown-sidebar flex flex-col justify-center items-center  border-2 ${loss === 0?'border-primary-orange':'border-brown-border'} rounded-md p-3`}>
                            {loss === 0 && (
                                <div className="absolute max-md:text-[8px] top-0 right-0 text-sm font-bold w-fit p-1 px-2 uppercase tracking-wider text-white bg-primary-orange">
                                    best value
                                </div>
                            )}

                            <div className="flex items-center gap-2 w-full pb-3 border-b-2 border-brown-border">
                                <span className="bg-brown-border p-1 rounded-sm">
                                    {Icon && <Icon className="w-4 h-4 text-white" />}
                                </span>
                                <span className="text-sm text-white font-semibold">
                                    {ele?.redemptionOptionTitle}
                                </span>
                            </div>
                            <div className="grid grid-cols-3 w-full mt-2">
                                <div className="flex flex-col" >
                                    <span className="text-[10px] uppercase font-semibold text-secondary-gray">
                                        Total value
                                    </span>
                                    <span className="text-sm font-semibold text-white capitalize">
                                        {isAirMiles ? `${Number(ele?.points) * 1} miles` : formatToINR(Number(ele?.points ?? 0) * Number(ele?.pointConversionRatioInInr))}
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-center uppercase font-semibold text-secondary-gray">
                                        ratio
                                    </span>
                                    <span className="text-sm text-center font-semibold text-white capitalize">
                                        {`1 Point = ${isAirMiles ? '1 mile' : '₹' + ele?.pointConversionRatioInInr}`}
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-right uppercase font-semibold text-secondary-gray">
                                        Lost
                                    </span>
                                    <span className={`text-sm text-right font-semibold  ${loss === 0 ? "text-secondary-success" : "text-destructive"} capitalize`}>
                                        {formatToINR(loss)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )
                })
            }


            <div className="max-md:hidden">
                <DataTable
                    data={data}
                    columns={spendOptimizerColumns}
                    loading={false}
                    emptyText="No alerts found"
                />
            </div>
        </div>

    )


}

export default RedemptionTable;