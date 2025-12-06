import React, { useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';

function OTPInput({ value = ['', '', '', '', '', ''], onChange }) {
  const inputRefs = useRef([]);

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index, inputValue) => {
    // Only allow numbers
    if (!/^\d*$/.test(inputValue)) return;

    const newOtp = [...value];
    newOtp[index] = inputValue.slice(-1); // Take only last character
    onChange(newOtp);

    // Move to next input if value entered
    if (inputValue && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace') {
      if (!value[index] && index > 0) {
        // Move to previous input if current is empty
        inputRefs.current[index - 1]?.focus();
      } else {
        // Clear current input
        const newOtp = [...value];
        newOtp[index] = '';
        onChange(newOtp);
      }
    }
    
    // Handle left arrow
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    
    // Handle right arrow
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').trim();
    
    // Only process if pasted data contains digits
    const digits = pastedData.replace(/\D/g, '').slice(0, 6);
    
    if (digits) {
      const newOtp = [...value];
      digits.split('').forEach((digit, idx) => {
        if (idx < 6) {
          newOtp[idx] = digit;
        }
      });
      onChange(newOtp);
      
      // Focus the next empty input or last input
      const nextIndex = Math.min(digits.length, 5);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  return (
    <div className="flex gap-3 justify-center">
      {value.map((digit, index) => (
        <Input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          className="text-white w-12 h-14 text-center text-2xl font-semibold"
        />
      ))}
    </div>
  );
}

export default OTPInput