"use client";
import React, { useState, useEffect, useCallback } from "react";
import { X, ChevronDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { categories, emiOptions, paymentMethods } from "./data";

interface FormData {
  category: string;
  categoryLabel: string;
  amount: string;
  merchant: string;
  paymentMethod: string;
  paymentMethodLabel: string;
  emi: string;
  emiLabel: string;
}

interface TempFormData {
  amount: string;
  merchant: string;
}

interface FormErrors {
  category?: boolean;
  amount?: boolean;
  merchant?: boolean;
  paymentMethod?: boolean;
  emi?: boolean;
}

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
  onSecondaryClick?: () => void;
  secondaryLabel?: string;
  onPrimaryClick?: () => void;
  disabledPrimary?: boolean;
  primaryLabel?: string;
}

type FieldName = "category" | "amount" | "merchant" | "paymentMethod" | "emi";

const amountPresets: number[] = [5000, 10000, 20000];

const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  children,
  title,
  onSecondaryClick,
  secondaryLabel = "Cancel",
  onPrimaryClick,
  disabledPrimary,
  primaryLabel = "Submit",
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 z-40 transition-opacity duration-300"
        onClick={onClose}
      />
      <div className="fixed inset-x-0 bottom-0 z-50 animate-slide-up">
        <div className="bg-background-primary min-h-[350px] border-t border-primary-orange rounded-t-3xl shadow-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h3 className="text-lg font-bold text-white">{title}</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
          <div className="overflow-y-auto p-4 flex-1">{children}</div>
          <div className="flex items-center gap-4 justify-between p-4 border-b border-white/10">
            {onSecondaryClick && (
              <Button
                variant="outline"
                onClick={onSecondaryClick}
                className="flex-1 h-12 border-white/20 text-white hover:bg-white/5"
              >
                {secondaryLabel}
              </Button>
            )}
            {onPrimaryClick && (
              <Button
                onClick={onPrimaryClick}
                disabled={disabledPrimary}
                className="flex-1 h-12 bg-secondary-orange hover:bg-secondary-orange/90 disabled:bg-secondary-orange/50 text-white flex items-center justify-center gap-2"
              >
                {primaryLabel}
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default function SpendOptimizerMobile() {
  const [formData, setFormData] = useState<FormData>({
    category: "",
    categoryLabel: "",
    amount: "",
    merchant: "",
    paymentMethod: "",
    paymentMethodLabel: "",
    emi: "",
    emiLabel: "",
  });

  const [tempFormData, setTempFormData] = useState<TempFormData>({
    amount: "",
    merchant: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [currentField, setCurrentField] = useState<FieldName | null>(null);
  const [stepContent, setStepContent] = useState<FieldName | null>(null);

  const fieldOrder: FieldName[] = [
    "category",
    "amount",
    "merchant",
    "paymentMethod",
    "emi",
  ];

  // Get next unfilled field
  const getNextUnfilledField = (startField: FieldName): FieldName | null => {
    const startIndex = fieldOrder.indexOf(startField);
    
    for (let i = startIndex + 1; i < fieldOrder.length; i++) {
      const field = fieldOrder[i];
      if (!formData[field]) {
        return field;
      }
    }
    return null;
  };

  // Check if all fields are filled
  const areAllFieldsFilled = (): boolean => {
    return (
      !!formData.category &&
      !!formData.amount &&
      formData.amount !== "0" &&
      !!formData.merchant.trim() &&
      !!formData.paymentMethod &&
      !!formData.emi
    );
  };

  const openField = (fieldName: FieldName): void => {
    // If all fields are filled, don't open bottom sheet
    if (areAllFieldsFilled()) {
      return;
    }

    // Initialize temp data with current saved values
    if (fieldName === "amount") {
      setTempFormData({ ...tempFormData, amount: formData.amount });
    } else if (fieldName === "merchant") {
      setTempFormData({ ...tempFormData, merchant: formData.merchant });
    }

    // If this field is already filled, find the next unfilled field
    if (formData[fieldName]) {
      const nextUnfilled = getNextUnfilledField(fieldName);
      if (nextUnfilled) {
        setCurrentField(nextUnfilled);
        setStepContent(null);
        setTimeout(() => setStepContent(nextUnfilled), 50);
      } else {
        // All subsequent fields are filled, open the clicked field
        setCurrentField(fieldName);
        setStepContent(null);
        setTimeout(() => setStepContent(fieldName), 50);
      }
    } else {
      // Field is not filled, open it
      setCurrentField(fieldName);
      setStepContent(null);
      setTimeout(() => setStepContent(fieldName), 50);
    }
  };

  const closeSheet = (): void => {
    // Reset temp data on cancel
    setTempFormData({ amount: "", merchant: "" });
    setStepContent(null);
    setTimeout(() => setCurrentField(null), 300);
  };

  const handleFieldSubmit = (
    fieldName: FieldName,
    value: string,
    label: string
  ): void => {
    setFormData({
      ...formData,
      [fieldName]: value,
      [`${fieldName}Label`]: label,
    });
    setErrors({ ...errors, [fieldName]: false });

    // Check if there are any unfilled fields after this one
    const nextUnfilled = getNextUnfilledField(fieldName);
    
    if (nextUnfilled) {
      setStepContent(null);
      setTimeout(() => {
        setStepContent(nextUnfilled);
        setCurrentField(nextUnfilled);
      }, 300);
    } else {
      // All fields are filled, close the bottom sheet
      closeSheet();
    }
  };

  const handleSubmit = (): void => {
    const newErrors: FormErrors = {
      category: !formData.category,
      amount: !formData.amount || formData.amount === "0",
      merchant: !formData.merchant.trim(),
      paymentMethod: !formData.paymentMethod,
      emi: !formData.emi,
    };

    setErrors(newErrors);

    const hasErrors = Object.values(newErrors).some((error) => error);
    if (!hasErrors) {
      alert("Form submitted! Check console for data.");
      console.log("Form Data:", formData);
    }
  };

  const formatCurrency = (value: string): string => {
    if (!value) return "";
    const number = value.replace(/[^\d]/g, "");
    return new Intl.NumberFormat("en-IN").format(Number(number));
  };

  const getBSProps = useCallback(
    (currentField: string | null) => {
      switch (currentField) {
        case "category":
          return {
            title: "Spend Category",
            onSecondaryClick: closeSheet,
          };
        case "amount":
          return {
            title: "Spend Amount",
            onSecondaryClick: closeSheet,
            disabledPrimary: !tempFormData.amount,
            onPrimaryClick: () => {
              if (tempFormData.amount) {
                handleFieldSubmit(
                  "amount",
                  tempFormData.amount,
                  tempFormData.amount
                );
                setTempFormData({ ...tempFormData, amount: "" });
              }
            },
          };
        case "merchant":
          return {
            title: "Platform / Merchant / App",
            onSecondaryClick: closeSheet,
            disabledPrimary: !tempFormData.merchant.trim(),
            onPrimaryClick: () => {
              if (tempFormData.merchant.trim()) {
                handleFieldSubmit(
                  "merchant",
                  tempFormData.merchant,
                  tempFormData.merchant
                );
                setTempFormData({ ...tempFormData, merchant: "" });
              }
            },
          };
        case "paymentMethod":
          return {
            title: "How will you pay?",
            onSecondaryClick: closeSheet,
          };
        case "emi":
          return {
            title: "Convert to EMI?",
            onSecondaryClick: closeSheet,
          };
        default:
          return {
            title: "",
          };
      }
    },
    [currentField, tempFormData.amount, tempFormData.merchant]
  );

  return (
    <div className="bg-background-primary py-6 hidden max-md:flex flex-col min-h-screen">
      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>

      <div className="w-full flex-1 overflow-auto pb-20">
        <div className="flex flex-col gap-3 mb-6">
          {/* Category Selection */}
          <div className="space-y-2">
            <Label
              htmlFor="category"
              className="text-base text-white/80 font-semibold"
            >
              Spend Category <span className="text-destructive">*</span>
            </Label>
            <button
              onClick={() => openField("category")}
              className={`w-full h-12 px-4 rounded-lg border ${
                errors.category
                  ? "border-destructive"
                  : "border-secondary-orange"
              } bg-background-primary text-white text-left flex items-center justify-between transition-all`}
            >
              <span
                className={
                  formData.categoryLabel ? "text-white" : "text-white/40"
                }
              >
                {formData.categoryLabel || "Select a category"}
              </span>
              <ChevronDown className="w-5 h-5 text-secondary-orange" />
            </button>
            {errors.category && (
              <p className="text-xs text-destructive">
                Please select a category
              </p>
            )}
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label
              htmlFor="amount"
              className="text-base text-white/80 font-semibold"
            >
              Spend Amount <span className="text-destructive">*</span>
            </Label>
            <button
              onClick={() => openField("amount")}
              className={`w-full h-12 px-4 rounded-lg border ${
                errors.amount ? "border-destructive" : "border-secondary-orange"
              } bg-background-primary text-white text-left flex items-center justify-between transition-all`}
            >
              <span
                className={formData.amount ? "text-white" : "text-white/40"}
              >
                {formData.amount
                  ? `₹ ${formatCurrency(formData.amount)}`
                  : "Enter amount"}
              </span>
              <ChevronDown className="w-5 h-5 text-secondary-orange" />
            </button>
            {errors.amount && (
              <p className="text-xs text-destructive">Please enter an amount</p>
            )}
          </div>

          {/* Merchant Input */}
          <div className="space-y-2">
            <Label
              htmlFor="merchant"
              className="text-base text-white/80 font-semibold"
            >
              Platform / Merchant / App{" "}
              <span className="text-destructive">*</span>
            </Label>
            <button
              onClick={() => openField("merchant")}
              className={`w-full h-12 px-4 rounded-lg border ${
                errors.merchant
                  ? "border-destructive"
                  : "border-secondary-orange"
              } bg-background-primary text-white text-left flex items-center justify-between transition-all`}
            >
              <span
                className={formData.merchant ? "text-white" : "text-white/40"}
              >
                {formData.merchant || "e.g., Amazon, Swiggy"}
              </span>
              <ChevronDown className="w-5 h-5 text-secondary-orange" />
            </button>
            {errors.merchant && (
              <p className="text-xs text-destructive">
                Please enter merchant name
              </p>
            )}
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label
              htmlFor="paymentMethod"
              className="text-base text-white/80 font-semibold"
            >
              How will you pay? <span className="text-destructive">*</span>
            </Label>
            <button
              onClick={() => openField("paymentMethod")}
              className={`w-full h-12 px-4 rounded-lg border ${
                errors.paymentMethod
                  ? "border-destructive"
                  : "border-secondary-orange"
              } bg-background-primary text-white text-left flex items-center justify-between transition-all`}
            >
              <span
                className={
                  formData.paymentMethodLabel ? "text-white" : "text-white/40"
                }
              >
                {formData.paymentMethodLabel || "Select payment method"}
              </span>
              <ChevronDown className="w-5 h-5 text-secondary-orange" />
            </button>
            {errors.paymentMethod && (
              <p className="text-xs text-destructive">
                Please select a payment method
              </p>
            )}
          </div>

          {/* EMI Option */}
          <div className="space-y-2">
            <Label
              htmlFor="emi"
              className="text-base text-white/80 font-semibold"
            >
              Will this purchase be converted to EMI?{" "}
              <span className="text-destructive">*</span>
            </Label>
            <button
              onClick={() => openField("emi")}
              className={`w-full h-12 px-4 rounded-lg border ${
                errors.emi ? "border-destructive" : "border-secondary-orange"
              } bg-background-primary text-white text-left flex items-center justify-between transition-all`}
            >
              <span
                className={formData.emiLabel ? "text-white" : "text-white/40"}
              >
                {formData.emiLabel || "Select an option"}
              </span>
              <ChevronDown className="w-5 h-5 text-secondary-orange" />
            </button>
            {errors.emi && (
              <p className="text-xs text-destructive">
                Please select an EMI option
              </p>
            )}
          </div>
        </div>

        {/* Fixed Bottom Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background-primary border-t border-white/10">
          <Button
            onClick={handleSubmit}
            className="w-full h-12 text-base text-white font-semibold"
          >
            Find Best Card
          </Button>
        </div>
      </div>

      {/* Bottom Sheet */}
      <BottomSheet
        isOpen={currentField !== null}
        onClose={closeSheet}
        title={getBSProps(currentField)?.title}
        onSecondaryClick={getBSProps(currentField)?.onSecondaryClick}
        onPrimaryClick={getBSProps(currentField)?.onPrimaryClick}
        disabledPrimary={getBSProps(currentField)?.disabledPrimary}
      >
        {/* Category Selection */}
        {stepContent === "category" && (
          <div className="space-y-3 animate-fade-in">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.value}
                  onClick={() =>
                    handleFieldSubmit("category", cat.value, cat.label)
                  }
                  className="w-full text-sm py-3 px-3 rounded-lg border border-white/20 hover:border-secondary-orange hover:bg-secondary-orange/10 transition-all flex items-center gap-3 text-left"
                >
                  <Icon className="w-5 h-5 text-primary-orange" />
                  <span className="text-white font-medium">{cat.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Amount Input */}
        {stepContent === "amount" && (
          <div className="space-y-4 animate-fade-in">
            <div className="relative">
              <span className="absolute z-30 left-4 top-1/2 -translate-y-1/2 text-primary-orange font-medium text-lg pointer-events-none">
                ₹
              </span>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="0"
                autoFocus
                value={formatCurrency(tempFormData.amount)}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const value = e.target.value.replace(/[^\d]/g, "");
                  setTempFormData({ ...tempFormData, amount: value });
                }}
                className="h-13 pl-10 pr-4 border-secondary-orange bg-background-primary text-white text-lg focus:ring-2 focus:ring-secondary-orange"
              />
            </div>

            <div className="flex gap-2">
              {amountPresets.map((preset) => (
                <Button
                  key={preset}
                  variant="outline"
                  onClick={() =>
                    setTempFormData({
                      ...tempFormData,
                      amount: preset.toString(),
                    })
                  }
                  className="flex-1 h-9  border-white/20 text-white text-xs hover:border-secondary-orange hover:bg-secondary-orange/10"
                >
                  ₹{formatCurrency(preset.toString())}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Merchant Input */}
        {stepContent === "merchant" && (
          <div className="space-y-4 animate-fade-in">
            <Input
              type="text"
              inputMode="text"
              placeholder="e.g., Amazon, Swiggy, MakeMyTrip"
              autoFocus
              value={tempFormData.merchant}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setTempFormData({ ...tempFormData, merchant: e.target.value })
              }
              className="h-14 px-4 border-secondary-orange bg-background-primary text-white focus:ring-2 focus:ring-secondary-orange"
            />
          </div>
        )}

        {/* Payment Method */}
        {stepContent === "paymentMethod" && (
          <div className="space-y-3 animate-fade-in">
            {paymentMethods.map((method) => (
              <button
                key={method.value}
                onClick={() =>
                  handleFieldSubmit("paymentMethod", method.value, method.label)
                }
                className="w-full text-sm py-3 px-3 rounded-lg border border-white/20 hover:border-secondary-orange hover:bg-secondary-orange/10 transition-all flex items-center gap-3 text-left"
              >
                <span className="text-white font-medium">{method.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* EMI Options */}
        {stepContent === "emi" && (
          <div className="space-y-3 animate-fade-in">
            {emiOptions.map((option) => (
              <button
                key={option.value}
                onClick={() =>
                  handleFieldSubmit("emi", option.value, option.label)
                }
                className="w-full text-sm py-3 px-3 rounded-lg border border-white/20 hover:border-secondary-orange hover:bg-secondary-orange/10 transition-all flex items-center gap-3 text-left"
              >
                <span className="text-white font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        )}
      </BottomSheet>
    </div>
  );
}