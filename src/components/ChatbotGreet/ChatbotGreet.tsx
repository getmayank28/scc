import { ActionButton } from "../ui/action-button";
import { WavyBackground } from "../ui/wavy-background";

const ChatbotGreet = ({ onClick, loading }: { onClick: () => void, loading:boolean }) => {
  return (
    <div className="h-screen flex items-center ">
      <div className="w-full px-4 flex flex-col justify-center items-center relative !h-[60vh] max-md:h-[50vh]  overflow-hidden">
        <h1 className="max-w-4xl text-[#FFF] text-center relative z-[100] font-butlerpro text-[50px] font-medium leading-[110%] tracking-[-2px] max-md:text-[56px] max-md:tracking-[-0.4px]">
          Hey there!
        </h1>
        <p className="max-w-4xl text-white opacity-90 relative z-[100] text-center font-satoshi max-md:mt-2 text-[20px] max-md:text-[16px] font-normal leading-[150%] tracking-[-2%] max-md:tracking-[-0.48px] [font-feature-settings:'ss03_on']">
          Welcome to FiSense, your rewards genie for credit cards. I’ll help you
          pick (or fix) the card that gives you max cashback, perks, and smiles.
          So, should we start?
        </p>
        <ActionButton
        loading={loading}
          title="Find my card"
          onClick={onClick}
          className="hover:bg-[#F35A13]/30 transition-all duration-500"
        />
        <WavyBackground
          backgroundFill="#111"
          containerClassName="w-full bg-[#111] opacity-20 absolute top-[-30%] max-md:top-[-35%]"
          className="w-full mx-auto pb-40"
        >
          <div></div>
        </WavyBackground>
      </div>
    </div>
  );
};

export default ChatbotGreet;
