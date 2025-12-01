import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "../ui/card";
import { RefObject } from "react";
import { LoaderOne } from "../ui/loader";
import { MessageProps } from "@/types/chatMessages";
import SliderInput from "../SliderInput/SliderInput";
import SingleSelectInput from "../SliderInput/SingleSelectInput/SingleSelectInput";
import { Button } from "../ui/button";
import { InputProps } from "@/models/Question";

interface ChatbotScrollableAreaProps {
  currentMessageId:string;
  messages: MessageProps[];
  isTyping: boolean;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  handleSend: (value: string) => void;
}

export const ChatbotScrollableArea = ({
  currentMessageId,
  messages,
  isTyping,
  messagesEndRef,
  handleSend,
}: ChatbotScrollableAreaProps) => {
  const renderInput = (message: InputProps) => {
    if (!message.inputType) return null;
    switch (message.inputType) {
      case "number":
        return (
          <SliderInput
          disabled={message.id !==currentMessageId}
            min={message?.validation?.min ?? 0}
            max={message?.validation?.max ?? 100000}
            onSubmit={(selected) =>
              handleSend("Your asnswer: " + String(selected))
            }
          />
        );
      case "select":
        return (
          <SingleSelectInput
          disabled={message.id !==currentMessageId}
            options={message?.options ?? []}
            onSubmit={(selected) =>
              handleSend("Your asnswer: " + String(selected))
            }
          />
        );
      default:
        return null;
    }
  };
  return (
    <div className="flex-1 overflow-hidden">
      <ScrollArea className="h-full px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6 pb-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === "user" ? "flex-row-reverse" : "flex-row"
              } animate-in fade-in slide-in-from-bottom-3 duration-500`}
            >
              <div
                className={`flex flex-col ${message.role === "user" ? "items-end" : "items-start"} flex-1 min-w-0`}
              >
                <Card
                  className={`px-4 py-3 gap-0 max-w-[85%] break-words ${
                    message.role === "user"
                      ? "bg-transparent text-gray-100 border-[#F35A13]/30"
                      : "bg-transparent text-gray-100 border-white/30 backdrop-blur-sm"
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </p>
                  {message?.inputs?.map((input: InputProps) => {
                    return (
                      <div key={input?.id}>
                        <div>{renderInput(input)}</div>
                        {input?.allowSkip && (
                          <Button
                          disabled={currentMessageId!==message?.id}
                            className="mt-0 ml-0 cursor-pointer bg-transparent hover:bg-transparent w-10 hover:text-white/70"
                            onClick={() => handleSend("Skipped")}
                          >
                            Skip
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </Card>
              </div>
            </div>
          ))}
          {isTyping && <LoaderOne />}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
    </div>
  );
};
