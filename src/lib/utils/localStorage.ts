import { FormData } from "../../components/MultiStepForm/types";
import { INITIAL_FORM_DATA } from "../../components/MultiStepForm/constants";

const FORM_STORAGE_KEY = "credit_card_form_data";

export interface StoredFormState {
  formData: FormData;
  currentStep: number;
  superAccuracyMode: string;
  lastUpdated: number;
}

export class FormLocalStorage {
  /**
   * Save complete form state to localStorage
   */
  static saveFormState(state: Omit<StoredFormState, "lastUpdated">): void {
    try {
      // Check if we're in a browser environment
      if (
        typeof window === "undefined" ||
        typeof localStorage === "undefined"
      ) {
        return;
      }

      const stateWithTimestamp: StoredFormState = {
        ...state,
        lastUpdated: Date.now(),
      };
      localStorage.setItem(
        FORM_STORAGE_KEY,
        JSON.stringify(stateWithTimestamp)
      );
    } catch (error) {
      console.error("Failed to save form state to localStorage:", error);
    }
  }

  /**
   * Save only form data to localStorage
   */
  static saveFormData(formData: FormData): void {
    try {
      // Check if we're in a browser environment
      if (
        typeof window === "undefined" ||
        typeof localStorage === "undefined"
      ) {
        return;
      }

      const existingState = this.getFormState();
      const updatedState: StoredFormState = {
        formData,
        currentStep: existingState?.currentStep || 1,
        superAccuracyMode: existingState?.superAccuracyMode || "1",
        lastUpdated: Date.now(),
      };
      localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(updatedState));
    } catch (error) {
      console.error("Failed to save form data to localStorage:", error);
    }
  }

  /**
   * Save current step to localStorage
   */
  static saveCurrentStep(step: number): void {
    try {
      // Check if we're in a browser environment
      if (
        typeof window === "undefined" ||
        typeof localStorage === "undefined"
      ) {
        return;
      }

      const existingState = this.getFormState();
      const updatedState: StoredFormState = {
        formData: existingState?.formData || INITIAL_FORM_DATA,
        currentStep: step,
        superAccuracyMode: existingState?.superAccuracyMode || "1",
        lastUpdated: Date.now(),
      };
      localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(updatedState));
    } catch (error) {
      console.error("Failed to save current step to localStorage:", error);
    }
  }

  /**
   * Save accuracy mode to localStorage
   */
  static saveAccuracyMode(mode: string): void {
    try {
      // Check if we're in a browser environment
      if (
        typeof window === "undefined" ||
        typeof localStorage === "undefined"
      ) {
        return;
      }

      const existingState = this.getFormState();
      const updatedState: StoredFormState = {
        formData: existingState?.formData || INITIAL_FORM_DATA,
        currentStep: existingState?.currentStep || 1,
        superAccuracyMode: mode,
        lastUpdated: Date.now(),
      };
      localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(updatedState));
    } catch (error) {
      console.error("Failed to save accuracy mode to localStorage:", error);
    }
  }

  /**
   * Get complete form state from localStorage
   */
  static getFormState(): StoredFormState | null {
    try {
      // Check if we're in a browser environment
      if (
        typeof window === "undefined" ||
        typeof localStorage === "undefined"
      ) {
        return null;
      }

      const stored = localStorage.getItem(FORM_STORAGE_KEY);
      if (!stored) return null;

      const parsed = JSON.parse(stored);

      // Validate the stored data structure
      if (
        parsed &&
        typeof parsed === "object" &&
        "formData" in parsed &&
        "currentStep" in parsed &&
        "superAccuracyMode" in parsed
      ) {
        return parsed;
      }

      return null;
    } catch (error) {
      console.error("Failed to retrieve form state from localStorage:", error);
      return null;
    }
  }

  /**
   * Get only form data from localStorage
   */
  static getFormData(): FormData | null {
    const state = this.getFormState();
    return state?.formData || null;
  }

  /**
   * Get current step from localStorage
   */
  static getCurrentStep(): number | null {
    const state = this.getFormState();
    return state?.currentStep || null;
  }

  /**
   * Get accuracy mode from localStorage
   */
  static getAccuracyMode(): string | null {
    const state = this.getFormState();
    return state?.superAccuracyMode || null;
  }

  /**
   * Check if form data exists in localStorage
   */
  static hasFormData(): boolean {
    return this.getFormState() !== null;
  }

  /**
   * Check if stored form data is recent (within last 24 hours)
   */
  static isDataRecent(): boolean {
    const state = this.getFormState();
    if (!state?.lastUpdated) return false;

    const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    return Date.now() - state.lastUpdated < twentyFourHours;
  }

  /**
   * Clear all form data from localStorage
   */
  static clearFormData(): void {
    try {
      // Check if we're in a browser environment
      if (
        typeof window === "undefined" ||
        typeof localStorage === "undefined"
      ) {
        return;
      }

      localStorage.removeItem(FORM_STORAGE_KEY);
    } catch (error) {
      console.error("Failed to clear form data from localStorage:", error);
    }
  }

  /**
   * Update a specific field in the stored form data
   */
  static updateFormField(field: keyof FormData, value: string): void {
    try {
      // Check if we're in a browser environment
      if (
        typeof window === "undefined" ||
        typeof localStorage === "undefined"
      ) {
        return;
      }

      const existingState = this.getFormState();
      if (!existingState) return;

      const updatedFormData = {
        ...existingState.formData,
        [field]: value,
      };

      const updatedState: StoredFormState = {
        ...existingState,
        formData: updatedFormData,
        lastUpdated: Date.now(),
      };

      localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(updatedState));
    } catch (error) {
      console.error("Failed to update form field in localStorage:", error);
    }
  }

  /**
   * Get form data with fallback to initial data
   */
  static getFormDataWithFallback(initialData: FormData): FormData {
    const storedData = this.getFormData();
    if (storedData && this.isDataRecent()) {
      return storedData;
    }
    return initialData;
  }

  /**
   * Get current step with fallback
   */
  static getCurrentStepWithFallback(fallbackStep: number = 1): number {
    const storedStep = this.getCurrentStep();
    if (storedStep !== null && this.isDataRecent()) {
      return storedStep;
    }
    return fallbackStep;
  }

  /**
   * Get accuracy mode with fallback
   */
  static getAccuracyModeWithFallback(fallbackMode: string = "1"): string {
    const storedMode = this.getAccuracyMode();
    if (storedMode !== null && this.isDataRecent()) {
      return storedMode;
    }
    return fallbackMode;
  }
}
