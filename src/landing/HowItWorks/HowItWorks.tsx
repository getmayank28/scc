import { Card } from '@/components/Card'
import React from 'react'
import { GlareCard } from '@/components/ui/glare-card';

const features = [
  {
    title: "Share how you spend",
    description: "Answer a few quick questions about your shopping, travel, and everyday expenses. No exact numbers. No bank jargon."
  },
  {
    title: "We analyse your spending",
    description: "FiSense uses intelligent analysis to match credit cards to your lifestyle and spending habits, so you earn more from the same spending."
  },
  {
    title: "Get personalised card matches",
    description: "We recommend credit cards and smart 2-card combinations when useful based on your lifestyle, not generic lists."
  },
  {
    title: "Decide when it feels right",
    description: "Compare with your current card, see potential savings, and apply only if and when you’re comfortable."
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