"use client";

import { useState } from "react";

const faqs = [
  {
    id: "1",
    question: "What is FiSense?",
    answer: () => (
      <>
        <p>
          FiSense is your smart financial guide. We start with Credit Card Rewards Optimization—helping you find which
          card gives you the most value for how you spend.
        </p>
      </>
    ),
  },
  {
    id: "2",
    question: "What does the Credit Card Optimizer do?",
    answer: () => (
      <>
        <p>
          It analyzes your spending across categories like fuel, dining, travel, e-commerce, and utilities, then identifies the
          card(s) that maximize your rewards and savings.
        </p>
      </>
    ),
  },
  {
    id: "3",
    question: "How do I use it?",
    answer: () => (
      <>
        <p>
          Just enter your monthly spends or upload your latest card statement (coming soon)—FiSense instantly
          calculates your benefits and shows your top card matches.
        </p>
      </>
    ),
  },
  {
    id: "4",
    question: "Which cards are covered?",
    answer: () => (
      <>
        <p>
          We compare 500+ credit cards from almost all major issuers in India, along with fintech-issued cards such as Uni,
          Slice, OneCard, and Scapia, ensuring wide and unbiased coverage.
        </p>
      </>
    ),
  },
  {
    id: "5",
    question: "Can I apply through FiSense?",
    answer: () => (
      <>
        <p>
          Yes. Once you find the right card, FiSense securely connects you to the official bank or fintech application page
          for a seamless process.
        </p>
      </>
    ),
  },
  {
    id: "6",
    question: "Is my data safe?",
    answer: () => (
      <>
        <p>
          Absolutely. Your information is encrypted, analyzed securely, and deleted after use. FiSense never stores or
          shares your personal or financial data.
        </p>
      </>
    ),
  },
];

const FAQSection = () => {
  const [active, setActive] = useState("");

  const handleClick = (faqId: string) => {
    setActive(active === faqId ? "" : faqId);
  };

  return (
    <div className="flex justify-center py-30 max-md max-md:pt-[80px] relative z-10 -mt-0.5 text-black max-md:px-6">
      <div className="flex flex-col flex-wrap items-center lg:flex-nowrap container relative justify-between tracking-tighter">
        <div className="relative pb-[82px]">
          <h2 className="text-white text-center font-butlerpro text-[64px] font-medium leading-[120%] tracking-[-3.84px] font-kerning-none font-feature-settings-liga-off">
            FAQs
          </h2>
        </div>
        <div className="w-full max-w-[686px]">
          {faqs.map((faq) => (
            <div
              key={faq.id}
              className={`flex justify-between py-8 max-md:py-5 border-t-[#D2D2D2] border-t-[1px] font-satoshi cursor-pointer`}
              onClick={() => handleClick(faq.id)}
            >
              <div className="lg:mr-10 font-satoshi flex-1">
                <h2 className="font-bold text-white/80 text-[24px] max-md:text-[16px] tracking-[0.02em] leading-[150%]">
                  {faq.question}
                </h2>
                <div
                  className={`overflow-hidden transition-all duration-500 ease-in-out ${
                    faq.id === active
                      ? "max-h-[1000px] opacity-100 mt-4"
                      : "max-h-0 opacity-0 mt-0"
                  }`}
                >
                  <div className="text-white/60 text-[20px] max-md:text-[16px] leading-[32px] tracking-[0.02em]">
                    {faq.answer()}
                  </div>
                </div>
              </div>
              <div className="w-[35px] lg:w-[53px] flex-none mr-2 pt-3">
                {/* TODO: Component for svg instead of using directly */}
                <svg
                  className={`transform  ${
                    active === faq.id ? "rotate-0" : "rotate-180"
                  } transition-transform duration-500 ease-in-out`}
                  width="18"
                  height="11"
                  viewBox="0 0 18 11"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M8.47165 1.11611C8.76455 0.82321 9.23935 0.82321 9.53225 1.11611L17.1788 8.76261C17.4717 9.05551 17.4717 9.53031 17.1788 9.82321L16.8252 10.1768C16.5323 10.4697 16.0575 10.4697 15.7646 10.1768L9.00195 3.41421L2.23935 10.1768C1.94645 10.4697 1.47165 10.4697 1.17875 10.1768L0.82515 9.82321C0.532249 9.53031 0.532249 9.05551 0.82515 8.76261L8.47165 1.11611Z"
                    fill="#fff"
                  />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FAQSection;
