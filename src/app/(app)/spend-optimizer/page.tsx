"use client"
import HeaderText from "@/components/HeaderText/HeaderText"
import SpendOptimizerDesktop from "./SpendOptimizerDesktop"
import SpendOptimizerMobile from "./SpendOptimizerMobile"
import UserCards from "./UserCards"


const SpendOptimizer = () => {
  return (
    <div className="flex flex-col p-20 h-screen max-md:p-6 max-md:h-auto">
      <HeaderText
        containerClassName="items-start"
        title="Spend Optimizer"
        titleVariant="h3"
        titleClassName="font-bold"
        contentVariant="caption"
        content="Which of my cards should I use for this purchase?"
      />
      <UserCards/>
       <SpendOptimizerDesktop/>
      <SpendOptimizerMobile/>
    </div>
  )
}

export default SpendOptimizer