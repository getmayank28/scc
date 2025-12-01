import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';
import { KeyboardEvent, ChangeEvent } from 'react';

interface ChatbotInputAreaProps {
  inputValue: string;
  isTyping: boolean;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onKeyPress?: (e: KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
}

const ChatbotInput = ({
  inputValue,
  isTyping,
  onInputChange,
  onSend,
  onKeyPress,
  placeholder = "Ask me",
  disabled = false,
}: ChatbotInputAreaProps) => {
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    onInputChange(e.target.value);
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (onKeyPress) {
      onKeyPress(e);
    }
  };

  const isDisabled = disabled || isTyping;
  const isSendDisabled = !inputValue.trim() || isDisabled;

  return (
    <div className="flex-shrink-0 p-4 pb-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 bg-[#101010] backdrop-blur-sm rounded-full border border-[#F35A13]/40 px-2 py-1">
          <Input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={isDisabled}
            className="flex-1 p-6 bg-[#101010] border-0 text-white placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <Button
            onClick={onSend}
            disabled={isSendDisabled}
            size="icon"
            className="rounded-full cursor-pointer bg-[#F35A13]/50 hover:bg-[#F35A13] transition-all duration-300 disabled:bg-gray-700 h-10 w-10 flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatbotInput