import { Card } from '@/components/Card'
import React from 'react'
import { GlareCard } from '@/components/ui/glare-card';

const features = [
  {
    title: "Tell Us How You Spend",
    description: "Answer a few quick questions about your shopping, travel, and everyday expenses. No exact numbers needed."
  },
  {
    title: "We Analyze Your Credit Card Spending",
    description: "FiSense analyzes your spending patterns to identify where you earn and where you miss rewards."
  },
  {
    title: "Find the Best Credit Cards for Your Spending",
    description: "We recommend the best credit cards and smart combinations based on your lifestyle, not generic lists."
  },
  {
    title: "Use the Best Credit Card for Every Spend",
    description: "FiSense Spend Optimizer tells you exactly which card to use for each transaction. So, you maximize rewards on every purchase.."
  },
  {
    title: "Redeem Credit Card Points for Maximum Value",
    description: "FiSense shows you the best way to redeem your points across flights, hotels, and vouchers. so, you get the highest value."
  }
];


const HowItWorksMobile = () => {
  return (
    <div className='hidden max-md:flex min-h-screen max-md:h-auto max-md:py-20 flex-col items-center justify-center py-30 relative'>
      <h1 className="text-[#FFF] text-center font-butlerpro text-[80px] font-medium leading-[110%] tracking-[-6px] max-md:text-[48px] max-md:tracking-[-0.4px]">
        How it works
      </h1>

      <div className='flex items-center max-md:gap-6 max-md:justify-center gap-10 mt-18 max-md:mt-10 flex-wrap max-md:px-6'>
        {
          features.map((feature) => (
            <GlareCard key={feature.title} className="flex flex-col items-center justify-center bg-[#101010]">
              <Card title={feature.title} description={feature.description} />
            </GlareCard>
          ))
        }
      </div>
    </div>

  )
}

export default HowItWorksMobile