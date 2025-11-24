import { useState, useEffect, useCallback } from "react";
import { FormLocalStorage, StoredFormState } from "../lib/utils/localStorage";
import { FormData } from "../components/MultiStepForm/types";

export interface UseLocalStorageFormReturn {
  // Data state
  formData: FormData | null;
  currentStep: number | null;
  accuracyMode: string | null;

  // Status
  hasStoredData: boolean;
  isDataRecent: boolean;
  lastUpdated: number | null;

  // Actions
  saveFormData: (data: FormData) => void;
  saveCurrentStep: (step: number) => void;
  saveAccuracyMode: (mode: string) => void;
  saveCompleteState: (state: Omit<StoredFormState, "lastUpdated">) => void;
  updateFormField: (field: keyof FormData, value: string) => void;
  clearStoredData: () => void;

  // Utilities
  loadStoredData: () => void;
  getStoredDataAge: () => string;
}

export const useLocalStorageForm = (): UseLocalStorageFormReturn => {
  const [formData, setFormData] = useState<FormData | null>(null);
  const [currentStep, setCurrentStep] = useState<number | null>(null);
  const [accuracyMode, setAccuracyMode] = useState<string | null>(null);
  const [hasStoredData, setHasStoredData] = useState(false);
  const [isDataRecent, setDataRecent] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  // Load data from localStorage
  const loadStoredData = useCallback(() => {
    const storedState = FormLocalStorage.getFormState();
    if (storedState) {
      setFormData(storedState.formData);
      setCurrentStep(storedState.currentStep);
      setAccuracyMode(storedState.superAccuracyMode);
      setHasStoredData(true);
      setDataRecent(FormLocalStorage.isDataRecent());
      setLastUpdated(storedState.lastUpdated);
    } else {
      setFormData(null);
      setCurrentStep(null);
      setAccuracyMode(null);
      setHasStoredData(false);
      setDataRecent(false);
      setLastUpdated(null);
    }
  }, []);

  // Save form data
  const saveFormData = useCallback((data: FormData) => {
    FormLocalStorage.saveFormData(data);
    setFormData(data);
    setHasStoredData(true);
    setLastUpdated(Date.now());
    setDataRecent(true);
  }, []);

  // Save current step
  const saveCurrentStep = useCallback((step: number) => {
    FormLocalStorage.saveCurrentStep(step);
    setCurrentStep(step);
    setHasStoredData(true);
    setLastUpdated(Date.now());
    setDataRecent(true);
  }, []);

  // Save accuracy mode
  const saveAccuracyMode = useCallback((mode: string) => {
    FormLocalStorage.saveAccuracyMode(mode);
    setAccuracyMode(mode);
    setHasStoredData(true);
    setLastUpdated(Date.now());
    setDataRecent(true);
  }, []);

  // Save complete state
  const saveCompleteState = useCallback(
    (state: Omit<StoredFormState, "lastUpdated">) => {
      FormLocalStorage.saveFormState(state);
      setFormData(state.formData);
      setCurrentStep(state.currentStep);
      setAccuracyMode(state.superAccuracyMode);
      setHasStoredData(true);
      setLastUpdated(Date.now());
      setDataRecent(true);
    },
    []
  );

  // Update specific form field
  const updateFormField = useCallback(
    (field: keyof FormData, value: string) => {
      FormLocalStorage.updateFormField(field, value);
      if (formData) {
        const updatedData = { ...formData, [field]: value };
        setFormData(updatedData);
        setLastUpdated(Date.now());
        setDataRecent(true);
      }
    },
    [formData]
  );

  // Clear stored data
  const clearStoredData = useCallback(() => {
    FormLocalStorage.clearFormData();
    setFormData(null);
    setCurrentStep(null);
    setAccuracyMode(null);
    setHasStoredData(false);
    setDataRecent(false);
    setLastUpdated(null);
  }, []);

  // Get human-readable age of stored data
  const getStoredDataAge = useCallback((): string => {
    if (!lastUpdated) return "No data stored";

    const now = Date.now();
    const diff = now - lastUpdated;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }, [lastUpdated]);

  // Load data on mount
  useEffect(() => {
    loadStoredData();
  }, [loadStoredData]);

  // Listen for storage changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "credit_card_form_data") {
        loadStoredData();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [loadStoredData]);

  return {
    formData,
    currentStep,
    accuracyMode,
    hasStoredData,
    isDataRecent,
    lastUpdated,
    saveFormData,
    saveCurrentStep,
    saveAccuracyMode,
    saveCompleteState,
    updateFormField,
    clearStoredData,
    loadStoredData,
    getStoredDataAge,
  };
};
