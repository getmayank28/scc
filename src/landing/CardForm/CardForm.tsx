"use client";
import { InputField, validateStep } from "@/components/MultiStepForm";
import { useFormContext } from "@/contexts";
import { ROUTES } from "@/libs/constants/routes";
import { useRouter } from "next/navigation";

const PaymentForm: React.FC = () => {
  const { formData, errors, updateFormData, setErrors } = useFormContext();

  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validateStep(1, formData, ["monthlySpend"]);
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      localStorage.removeItem("cardForYou");
      router.push(ROUTES.CARD_FORM);
    }
  };

  return (
    <div className="relative h-screen max-md:h-auto max-md:pb-[100px] items-center justify-center gap-8 pb-[200px] lg:gap-16 font-sans">
      {/* Credit Card Display */}
      <div className="aboslute top-0">
        <div className="relative h-[300px] max-md:h-[250px] overflow-hidden w-full flex justify-center items-center">
          <div
            className="w-[1600px] absolute h-[1600px] bottom-[00px] transform -translate-x-1/2 left-[50%] rounded-full"
            style={{
              background:
                "linear-gradient(180deg,#F35A13 0%, rgba(16, 16, 16, 1) 100%)",
            }}
          ></div>
        </div>
      </div>
      <div className="max-w-[984px] mx-auto text-center -mt-[140px] z-10 relative">
        <h1 className="text-[#FFF] text-center font-butlerpro text-[80px] font-medium leading-[110%] tracking-[-6px] max-md:text-[56px] max-md:tracking-[-0.4px]">
          <span className="max-md:hidden">
            The smarter way
            <br /> to choose
          </span>
          <span className="max-md:block hidden">The smarter choice</span>
        </h1>
        <p className="text-white opacity-70 text-center font-satoshi max-md:-mt-1 text-[20px] max-md:text-[16px] font-normal leading-[150%] tracking-[-2%] max-md:tracking-[-0.48px] [font-feature-settings:'ss03_on']">
          Get your personalized card now
        </p>
      </div>
      <div className="flex max-md:flex-col max-md:items-center max-md:gap-10 max-md:mt-12 justify-center gap-[100px] mt-[100px]">
        <div className="relative w-96 h-64 max-md:w-[300px] max-md:h-[206px] max-md:mb-0 mb-8 lg:mb-0">
          {/* Card Bottom Shadow */}
          <div className="absolute top-1 left-1 w-96 h-64 rounded-lg bg-gray-100 shadow-lg hidden md:block"></div>

          {/* Card Top */}
          <div
            className="absolute top-0 left-0 w-96 h-64 max-md:w-[300px] max-md:h-[206px] rounded-lg shadow-xl overflow-hidden"
            style={{
              background: "linear-gradient(120deg, #FC5179, #FB5117)",
              fontFamily: "Odibee Sans, Montserrat, sans-serif",
            }}
          >
            {/* Card Pattern Overlay */}
            <div
              className="absolute inset-0 opacity-5 bg-cover bg-center"
              style={{
                backgroundImage:
                  "url('http://cdn.flaticon.com/svg/44/44386.svg')",
              }}
            ></div>

            {/* Visa Logo */}
            <div className="absolute top-2 right-8">
              <svg
                version="1.1"
                id="visa"
                xmlns="http://www.w3.org/2000/svg"
                x="0px"
                y="0px"
                width="64px"
                height="64px"
                viewBox="0 0 47.834 47.834"
                fill="white"
              >
                <g>
                  <g>
                    <path
                      d="M44.688,16.814h-3.004c-0.933,0-1.627,0.254-2.037,1.184l-5.773,13.074h4.083c0,0,0.666-1.758,0.817-2.143
                           c0.447,0,4.414,0.006,4.979,0.006c0.116,0.498,0.474,2.137,0.474,2.137h3.607L44.688,16.814z M39.893,26.01
                           c0.32-0.819,1.549-3.987,1.549-3.987c-0.021,0.039,0.317-0.825,0.518-1.362l0.262,1.23c0,0,0.745,3.406,0.901,4.119H39.893z
                           M34.146,26.404c-0.028,2.963-2.684,4.875-6.771,4.875c-1.743-0.018-3.422-0.361-4.332-0.76l0.547-3.193l0.501,0.228
                           c1.277,0.532,2.104,0.747,3.661,0.747c1.117,0,2.313-0.438,2.325-1.393c0.007-0.625-0.501-1.07-2.016-1.77
                           c-1.476-0.683-3.43-1.827-3.405-3.876c0.021-2.773,2.729-4.708,6.571-4.708c1.506,0,2.713,0.31,3.483,0.599l-0.526,3.092
                           l-0.351-0.165c-0.716-0.288-1.638-0.566-2.91-0.546c-1.522,0-2.228,0.634-2.228,1.227c-0.008,0.668,0.824,1.108,2.184,1.77
                           C33.126,23.546,34.163,24.783,34.146,26.404z M0,16.962l0.05-0.286h6.028c0.813,0.031,1.468,0.29,1.694,1.159l1.311,6.304
                           C7.795,20.842,4.691,18.099,0,16.962z M17.581,16.812l-6.123,14.239l-4.114,0.007L3.862,19.161
                           c2.503,1.602,4.635,4.144,5.386,5.914l0.406,1.469l3.808-9.729L17.581,16.812L17.581,16.812z M19.153,16.8h3.89L20.61,31.066
                           h-3.888L19.153,16.8z"
                    />
                  </g>
                </g>
              </svg>
            </div>

            {/* Card Number */}
            <div className="absolute top-1/2 left-8 transform -translate-y-1/2 text-white text-xl font-mono opacity-75 tracking-wider">
              XXXX XXXX XXXX XXXX
            </div>

            {/* Card Details */}
            <div className="absolute bottom-4 left-8 flex justify-between items-end text-white opacity-75">
              <div className="flex flex-col w-[150px]">
                <span className="text-xs mb-1">Card Holder</span>
                <span className="text-sm font-medium capitalize">
                  {formData.fullName.slice(0, 18) || "_ _"}
                </span>
              </div>
              {/* <div className="flex flex-col items-center">
              <span className="text-xs mb-1">Expires</span>
              <span className="text-sm font-medium">
                <span>{formData.expiryMonth || "00"}</span>
                <span className="mx-1">/</span>
                <span>{formData.expiryYear || "00"}</span>
              </span>
            </div> */}
              <div className="flex flex-col w-[150px] !text-left">
                <span className="text-xs mb-1">Mobile</span>
                <span className="text-sm font-mono">
                  {formData.phone.slice(0, 10) || "_ _"}
                </span>
                {/* <span className="text-sm font-mono">{getDisplayCvc()}</span> */}
              </div>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="w-[400px] max-md:w-full max-md:px-[42px]"
        >
          <div className="flex flex-col gap-3">
            {/* Full Name Field */}
            <InputField
              label="Full Name"
              field="fullName"
              placeholder="Enter your name"
              value={formData.fullName}
              onChange={updateFormData}
              error={errors.fullName}
            />

            <InputField
              label="Email Address"
              type="email"
              field="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={updateFormData}
              error={errors.email}
            />
            <InputField
              label="Phone Number"
              type="number"
              field="phone"
              placeholder="Enter your phone number"
              value={formData.phone}
              onChange={updateFormData}
              error={errors.phone}
            />
          </div>

          {/* {apiError && (
          <div className="bg-red-900/20 border border-red-700 text-red-300 text-[12px] tracking-[-2%] leading-[18px] p-3 rounded-md mt-4">
            {apiError}
          </div>
        )} */}

          <button
            type="submit"
            className="cursor-pointer w-full mt-8 max-md:mt-6 flex gap-2 items-center justify-center text-black bg-white py-4 px-8 rounded-full transition-all duration-300 ease-in-out hover:scale-105 active:scale-95"
          >
            <p className="font-bold text-[16px] tarcking-[-0.03em]">
              Get Started
            </p>
            <p className="font-bold">→</p>
          </button>
        </form>
      </div>
    </div>
  );
};

export default PaymentForm;
