import { Card } from '@/components/Card'
import React from 'react'
import { BadgeIndianRupee, Handshake, ListTodo } from 'lucide-react';
import { GlareCard } from '@/components/ui/glare-card';

const features = [
  {
    icon: BadgeIndianRupee,
    title: "Tell FiSense about your spends",
    description: "Answer a few quick questions or upload a statement for precise reward analysis."
  },
  {
    icon: Handshake,
    title: "Get ranked card matches",
    description: "We review over 500 credit cards across banks to bring you transparent result."
  },
  {
    icon: ListTodo,
    title: "Track & Optimize (Coming Soon)",
    description: "Activate your dashboard to monitor monthly savings and discover missed opportunities."
  }
];


const HowItWorks = () => {
  return (
    <div className='flex min-h-screen flex-col items-center justify-center py-30 relative'>
      <h1 className="text-[#FFF] text-center font-butlerpro text-[80px] font-medium leading-[110%] tracking-[-6px] max-md:text-[56px] max-md:tracking-[-0.4px]">
        How it works
      </h1>
      <div className='h-30 w-full absolute top-[430px] bg-[#F35A13]/20'></div>

      <div className='flex items-center gap-10 mt-18'>
        {
          features.map((feature, index) => (
            <GlareCard key={feature.title} className="flex flex-col items-center justify-center bg-[#101010]">
              <Card key={index} icon={feature.icon} title={feature.title} description={feature.description} />
            </GlareCard>
          ))
        }
      </div>
    </div>

  )
}

export default HowItWorks