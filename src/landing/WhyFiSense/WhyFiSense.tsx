import { Card } from '@/components/Card'
import React from 'react'
import { CreditCard, LockKeyhole, UserStar } from 'lucide-react';
import { GlareCard } from '@/components/ui/glare-card';

const whyFisense = [
  {
    icon: LockKeyhole,
    title: "Safe & Secure",
    description: "Your financial data stays private and protected."
  },
  {
    icon: UserStar,
    title: "Smarter & Personalized",
    description: "AI-driven analysis helps you understand your spending and find the perfect match."
  },
  {
    icon: CreditCard,
    title: "Compare 500+ Cards",
    description: "Transparent, unbiased comparisons across all major banks."
  }
];


const WhyFiSense = () => {
  return (
    <div className='flex min-h-screen flex-col items-center justify-center py-30 relative'>
      <h1 className="text-[#FFF] text-center font-butlerpro text-[80px] font-medium leading-[110%] tracking-[-6px] max-md:text-[56px] max-md:tracking-[-0.4px]">
        Why choose FiSense
      </h1>
      <div className='h-30 w-full absolute top-[430px] max-md:hidden bg-[#F35A13]/20'></div>
      <div className='flex items-center gap-10 mt-18 max-md:justify-center flex-wrap max-md:px-6'>
        {
          whyFisense.map((feature, index) => (
            <GlareCard key={feature.title} className="flex flex-col items-center justify-center bg-[#101010]">
              <Card key={index} icon={feature.icon} title={feature.title} description={feature.description} />
            </GlareCard>
          ))
        }
      </div>
    </div>
  )
}

export default WhyFiSense