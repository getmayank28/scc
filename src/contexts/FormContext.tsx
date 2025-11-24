"use client";
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { FormData, FormErrors } from "../components/MultiStepForm/types";
import { INITIAL_FORM_DATA } from "../components/MultiStepForm/constants";
import { FormLocalStorage } from "../lib/utils";
import {
  DINING_AND_MOVIE_SPEND,
  ECOMMERCE_SPEND,
  TRAVEL_SPEND,
} from "@/lib/constants";

interface FormContextType {
  formData: FormData;
  currentStep: number;
  errors: FormErrors;
  superAccuracyMode: string;
  updateFormData: (field: string, value: string) => void;
  setCurrentStep: (step: number) => void;
  setErrors: (errors: FormErrors) => void;
  setSuperAccuracyMode: (mode: string) => void;
  resetForm: () => void;
  nextStep: () => void;
  prevStep: () => void;
  validateCurrentStep: () => boolean;
  hasStoredData: boolean;
  clearStoredData: () => void;
}

const FormContext = createContext<FormContextType | undefined>(undefined);

interface FormProviderProps {
  children: ReactNode;
}

export const FormProvider: React.FC<FormProviderProps> = ({ children }) => {
  // Initialize state with localStorage data or fallback to initial values
  const [formData, setFormData] = useState<FormData>(() =>
    FormLocalStorage.getFormDataWithFallback(INITIAL_FORM_DATA)
  );
  const [currentStep, setCurrentStep] = useState(() =>
    FormLocalStorage.getCurrentStepWithFallback(1)
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [superAccuracyMode, setSuperAccuracyMode] = useState(() =>
    FormLocalStorage.getAccuracyModeWithFallback("1")
  );
  const [hasStoredData, setHasStoredData] = useState(() =>
    FormLocalStorage.hasFormData()
  );

  // Load data from localStorage on component mount
  useEffect(() => {
    const storedState = FormLocalStorage.getFormState();
    if (storedState && FormLocalStorage.isDataRecent()) {
      setFormData(storedState.formData);
      setCurrentStep(storedState.currentStep);
      setSuperAccuracyMode(storedState.superAccuracyMode);
      setHasStoredData(true);
    }
  }, []);

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    FormLocalStorage.saveFormData(formData);
  }, [formData]);

  // Save current step to localStorage whenever it changes
  useEffect(() => {
    FormLocalStorage.saveCurrentStep(currentStep);
  }, [currentStep]);

  // Save accuracy mode to localStorage whenever it changes
  useEffect(() => {
    FormLocalStorage.saveAccuracyMode(superAccuracyMode);
  }, [superAccuracyMode]);

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setFormData(INITIAL_FORM_DATA);
    setErrors({});
    setSuperAccuracyMode("1");
    FormLocalStorage.clearFormData();
    setHasStoredData(false);
  };

  const nextStep = () => {
    if (superAccuracyMode?.toLowerCase() === "off") {
      if (currentStep === 2) {
        setFormData((prev) => ({
          ...prev,
          ...ECOMMERCE_SPEND,
        }));
      } else if (currentStep === 3) {
        setFormData((prev) => ({
          ...prev,
          ...TRAVEL_SPEND,
        }));
      } else if (currentStep === 4) {
        setFormData((prev) => ({
          ...prev,
          ...DINING_AND_MOVIE_SPEND,
        }));
      }
    } else {
      if (currentStep === 2) {
        setFormData((prev) => ({
          ...prev,
          ecommerseSpend: "",
        }));
      } else if (currentStep === 3) {
        setFormData((prev) => ({
          ...prev,
          travelSpend: "",
        }));
      } else if (currentStep === 4) {
        setFormData((prev) => ({
          ...prev,
          diningSpend: "",
          movieSpend: "",
        }));
      }
    }
    setCurrentStep((prev) => Math.min(prev + 1, 6)); // TOTAL_STEPS = 6
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const validateCurrentStep = (): boolean => {
    // This will be implemented when validation logic is moved here
    // For now, return true to allow navigation
    return true;
  };

  const clearStoredData = () => {
    FormLocalStorage.clearFormData();
    setHasStoredData(false);
  };

  const value: FormContextType = {
    formData,
    currentStep,
    errors,
    superAccuracyMode,
    updateFormData,
    setCurrentStep,
    setErrors,
    setSuperAccuracyMode,
    resetForm,
    nextStep,
    prevStep,
    validateCurrentStep,
    hasStoredData,
    clearStoredData,
  };

  return <FormContext.Provider value={value}>{children}</FormContext.Provider>;
};

export const useFormContext = (): FormContextType => {
  const context = useContext(FormContext);
  if (context === undefined) {
    throw new Error("useFormContext must be used within a FormProvider");
  }
  return context;
};
