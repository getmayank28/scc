"use client";
import StepIndicator from "./StepIndicator";
import StepContent from "./StepContent";
import NavigationButtons from "./NavigationButtons";
import { STEP_CONFIGS, TOTAL_STEPS } from "./constants";
import { validateStep } from "./validation";
import { Toggle } from "../Toggle";
import { useFormContext } from "../../contexts";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { calculateTotal } from "@/libs/logic/logic";
import { cards } from "@/libs/constants";
import { cardBenefits } from "@/libs/constants/cardBenefits";

type CardBenefitsKeys = keyof typeof cardBenefits;

export default function MultiStepForm() {
  const {
    currentStep,
    formData,
    errors,
    superAccuracyMode,
    updateFormData,
    setErrors,
    setSuperAccuracyMode,
    nextStep,
    prevStep,
    clearStoredData,
  } = useFormContext();

  const showSuperAccuracyToggle = [2, 3, 4]?.includes(currentStep);
  const router = useRouter();

  // Auto-save form state when component unmounts or user navigates away
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Form data is automatically saved via useEffect in FormContext
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const handleNextStep = () => {
    const newErrors = validateStep(currentStep, formData);
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      nextStep();
    }
  };

  const handlePrevStep = () => {
    prevStep();
  };

  const handleSubmit = () => {
    const formDataRecord: Record<string, string> = Object.entries(
      formData
    ).reduce((acc, [key, value]) => {
      // Only include spend-related fields (exclude personal info fields)
      if (key !== "fullName" && key !== "email" && key !== "phone") {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, string>);

    const calculatedCardsData = cards?.map((ele) =>
      calculateTotal(ele, formDataRecord)
    );

    if (!calculatedCardsData) {
      return { cardsData: [], maxTotal: 0, bestCard: null };
    }

    const calculatedMaxTotal = Math.max(
      ...calculatedCardsData.map((card) => parseFloat(card.total))
    );
    const calculatedBestCard = calculatedCardsData.find(
      (card) => parseFloat(card.total) === calculatedMaxTotal
    );

    const cardExtraInfo =
      cardBenefits[calculatedBestCard?.cardType as CardBenefitsKeys] || null;

    localStorage.setItem(
      "cardForYou",
      JSON.stringify({
        bestCard: calculatedBestCard,
        cardExtraInfo,
      })
    );

    // Clear stored data after successful submission
    clearStoredData();
    router.replace("/recommendations");
  };

  const getStepTitle = (step: number) => {
    const stepConfig = STEP_CONFIGS.find((config) => config.step === step);
    return stepConfig?.title || "";
  };

  return (
    <div className="py-8 px-4 max-md:py-4">
      <div className="max-w-2xl mx-auto">
        <div className="p-8">
          {/* Step Indicator */}
          <StepIndicator currentStep={currentStep} />

          {/* Step Title */}
          <div className="text-center mb-6">
            <p className="text-white text-left font-satoshi max-md:mt-1 text-[20px] font-bold leading-[150%] tracking-[-2%] max-md:tracking-[-0.48px] [font-feature-settings:'ss03_on']">
              {getStepTitle(currentStep)}
            </p>

            {showSuperAccuracyToggle && (
              <div className="flex justify-between items-center max-md:mt-2">
                <p className="text-[rgba(255,255,255,0.4)] text-left font-satoshi max-md:mt-1 text-[16px] leading-[150%] tracking-[-2%] max-md:tracking-[-0.48px] [font-feature-settings:'ss03_on']">
                  Turn{" "}
                  {superAccuracyMode.toLowerCase() === "off" ? "on" : "off"}{" "}
                  super accuracy mode
                </p>

                <Toggle
                  value={superAccuracyMode}
                  onClick={() =>
                    setSuperAccuracyMode(
                      superAccuracyMode.toLowerCase() === "off"
                        ? String(currentStep)
                        : "off"
                    )
                  }
                />
              </div>
            )}
          </div>

          {/* Form Content */}
          <div>
            <div className="mb-8">
              <StepContent
                currentStep={currentStep}
                formData={formData}
                errors={errors}
                updateFormData={updateFormData}
                accuracyMode={superAccuracyMode}
              />
            </div>

            {/* Navigation Buttons */}
            <NavigationButtons
              currentStep={currentStep}
              totalSteps={TOTAL_STEPS}
              onNext={handleNextStep}
              onPrevious={handlePrevStep}
              onSubmit={handleSubmit}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
