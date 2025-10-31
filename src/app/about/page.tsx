import { Header } from "@/components/Header"
import { BackgroundRippleEffect } from "@/components/ui/background-ripple-effect"
import { CardSpotlight } from "@/components/ui/card-spotlight"
import { Footer } from "@/landing/Footer"
import { divider } from "../page"
import Tagline from "@/components/LandingAnimation/Tagline/Tagline"

const About = () => {
  return (
    <div className="bg-[#101010] min-h-[100vh]">
      <Header />
      <div className="flex bg-[#101010]  flex-col max-md:px-0 items-center justify-center pt-[220px] max-md:pt-[100px] max-md:pb-[0px] relative z-10">
        <BackgroundRippleEffect rows={12} />
        <div className="flex flex-col justify-center items-center z-10">
          <div className="max-w-[984px] mx-auto text-center">
            <h1 className="text-[#FFF] text-center font-butlerpro text-[80px] font-medium leading-[110%] tracking-[-6px] max-md:text-[56px] max-md:tracking-[-0.4px]">
              Make Smarter Credit
            </h1>
            <div className="flex justify-center gap-4">
              <h1 className="text-[#FFF] text-center font-butlerpro text-[80px] font-medium leading-[110%] tracking-[-6px] max-md:text-[56px] max-md:tracking-[-0.4px]">
                Choices
              </h1>
              <h1 className="text-[#F35A13] text-center font-butlerpro text-[80px] font-medium leading-[110%] tracking-[-6px] max-md:text-[56px] max-md:tracking-[-0.4px]">
                Instantly </h1>
            </div>
            <p className="text-white mt-2 max-w-4xl mx-auto opacity-70 text-center font-satoshi max-md:-mt-1 text-[20px] max-md:text-[16px] font-normal leading-[150%] tracking-[-2%] max-md:tracking-[-0.48px] [font-feature-settings:'ss03_on']">
              FiSense helps you navigate the complex world of credit cards with AI-powered precision. We analyze 500+ cards across top banks to find the one that gives you maximum rewards, savings, and benefits based on how you spend.
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center gap-10 mt-[330px]">
        <CardSpotlight>
          <div className="text-center  relative z-10 w-[320px] py-12 rounded-xl">
            <div className="text-7xl font-bold text-white mb-2">500+</div>
            <p className="text-white max-w-4xl mx-auto opacity-70 text-center font-satoshi max-md:-mt-1 text-[24px] max-md:text-[16px]  leading-[150%] tracking-[-2%] max-md:tracking-[-0.48px] [font-feature-settings:'ss03_on']">
              Cards Analyzed
            </p>
          </div>
        </CardSpotlight>
        <CardSpotlight >
          <div className="text-center relative z-10 w-[320px] py-12 rounded-xl">
            <div className="text-7xl font-bold text-white mb-2">100%</div>
            <p className="text-white max-w-4xl mx-auto opacity-70 text-center font-satoshi max-md:-mt-1 text-[24px] max-md:text-[16px]  leading-[150%] tracking-[-2%] max-md:tracking-[-0.48px] [font-feature-settings:'ss03_on']">
              Unbiased Results
            </p>
          </div>
        </CardSpotlight>
        <CardSpotlight >
          <div className="text-center relative z-10 w-[320px] py-12 rounded-xl">
            <div className="text-7xl font-bold text-white mb-2">0</div>
            <p className="text-white max-w-4xl mx-auto opacity-70 text-center font-satoshi max-md:-mt-1 text-[24px] max-md:text-[16px]  leading-[150%] tracking-[-2%] max-md:tracking-[-0.48px] [font-feature-settings:'ss03_on']">
              Data Sharing
            </p>
          </div>
        </CardSpotlight>
      </div>
      <Tagline />
      <div className="mx-auto flex justify-center">{divider}</div>
      <Footer />
    </div>
  )
}

export default About