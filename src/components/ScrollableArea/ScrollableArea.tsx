import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "../ui/card";
import { RefObject } from "react";
import { LoaderOne } from "../ui/loader";
import SliderInput from "../SliderInput/SliderInput";
import SingleSelectInput from "../SliderInput/SingleSelectInput/SingleSelectInput";
import { Button } from "../ui/button";
import { InputProps } from "@/models/Question";
import { ChatMessage, MESSAGE_TYPE } from "@/types/chatMessages";
import { containsMarkdownTable, markdownToJson } from "@/lib/utils/markdown";
import ChatCard from "../ChatCard/ChatCard";

interface ChatbotScrollableAreaProps {
  currentMessageId?: string;
  messages: ChatMessage[];
  isTyping?: boolean;
  messagesEndRef?: RefObject<HTMLDivElement | null>;
  handleSend: (value: string) => void;
}

export const ChatbotScrollableArea = ({
  currentMessageId,
  messages,
  isTyping,
  messagesEndRef,
  handleSend,
}: ChatbotScrollableAreaProps) => {

  console.log(messages, "fjbvhfbvhbfhbhfbh")

  if (!messages) return;
  const renderInput = (message: ChatMessage) => {
    if (!message.type) return null;
    switch (message.type) {
      case MESSAGE_TYPE.SLIDER:
        return (
          <SliderInput
            // disabled={message.m_id !==currentMessageId}
            onSelectionSubmit
            disabled={false}
            value={message?.slider?.default_value}
            min={message?.slider?.min_value ?? 0}
            max={message?.slider?.max_value ?? 100000}
            onSubmit={(selected) => handleSend(String(selected))}
          />
        );
      case MESSAGE_TYPE.SELECT:
        return (
          <SingleSelectInput
            // disabled={message.m_id !==currentMessageId}
            disabled={false}
            onSelectionSubmit
            options={message?.slots ?? []}
            onSubmit={(selected) => handleSend(String(selected))}
          />
        );
      default:
        return null;
    }
  };

  const getContent = (content: string) => markdownToJson(content);


  return (
    <div className="flex-1 overflow-hidden">
      <ScrollArea className="h-full px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6 pb-4">
          {messages.map((message) => (
            <div
              key={message.m_id}
              className={`flex gap-3 ${
                message.source === "user" ? "flex-row-reverse" : "flex-row"
              } animate-in fade-in slide-in-from-bottom-3 duration-500`}
            >
              <div
                className={`flex flex-col ${message.source === "user" ? "items-end" : "items-start"} flex-1 min-w-0`}
              >
                <Card
                  className={`${containsMarkdownTable(message?.content)?'p-0':'px-4 py-3'} gap-0 max-w-[85%] break-words ${
                    message.source === "user"
                      ? "bg-transparent text-gray-100 border-[#F35A13]/30"
                      : `bg-transparent text-gray-100 ${containsMarkdownTable(message?.content)?'border-none':'border-white/30'} `
                  }`}
                >
                  {containsMarkdownTable(message?.content) ? (
                    <>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap border rounded-lg px-4 py-3 border-white/30">
                        {getContent(message?.content)?.message}
                      </p>
                      <div className="flex gap-6 mt-6">
                        {getContent(message?.content)?.cards.map(
                          (item, index) => {
                            return <ChatCard key={index} {...item} pattern={index} />
                          }
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </p>
                      <div>{renderInput(message)}</div>
                    </>
                  )}
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
