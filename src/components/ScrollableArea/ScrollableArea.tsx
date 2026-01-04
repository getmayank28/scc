import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "../ui/card";
import { RefObject, useEffect, useState } from "react";
// import SliderInput from "../SliderInput/SliderInput";
// import SingleSelectInput from "../SliderInput/SingleSelectInput/SingleSelectInput";
import { ChatMessage } from "@/types/chatMessages";
import {
  containsMarkdownTable,
  convertBoldMarkdownToHtml,
  markdownToJson,
} from "@/lib/utils/markdown";
import ChatCard from "../ChatCard/ChatCard";
// import MultiSelectInput from "../MultiSelectInput/MultiSelectInput";
import { MultiStepChatLoader } from "../MultiStepChatLoader/MultiStepChatLoader";
// import FormInput from "../FormInput/FormInput";
import { renderInput } from "@/lib/utils/renderInput";


const loadingStates = [
  {
    text: "Learning your spending",
  },
  {
    text: "Categorizing your expenses",
  },
  {
    text: "Scanning 500+ credit cards",
  },
  {
    text: "Analyzing rewards, and benefits",
  },
  {
    text: "Matching cards to your lifestyle",
  },
  {
    text: "Optimizing for maximum benefits",
  },
  {
    text: "Running cards comparisons",
  },
  {
    text: "Finding your best match",
  },
];

interface ChatbotScrollableAreaProps {
  currentMessageId?: string;
  messages: ChatMessage[];
  isTyping?: boolean;
  messagesEndRef?: RefObject<HTMLDivElement | null>;
 handleSend: (
    value: string | Record<string, string | number>,
    id?: string
  ) => void;
}

export const ChatbotScrollableArea = ({
  currentMessageId,
  messages,
  isTyping,
  messagesEndRef,
  handleSend,
}: ChatbotScrollableAreaProps) => {
  const [visibleMessages, setVisibleMessages] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    // Add new messages to visible set with a slight delay for animation
    messages.forEach((message) => {
      if (!visibleMessages.has(message.m_id)) {
        setTimeout(() => {
          setVisibleMessages((prev) => new Set(prev).add(message.m_id));
        }, 50);
      }
    });
  }, [messages]);

  if (!messages) return;

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
              } transition-opacity duration-500 ease-in ${
                visibleMessages.has(message.m_id) ? "opacity-100" : "opacity-0"
              }`}
              style={{
                animation: visibleMessages.has(message.m_id)
                  ? "fadeIn 0.5s ease-in forwards"
                  : "none",
              }}
            >
              <div
                className={`flex flex-col ${
                  message.source === "user" ? "items-end" : "items-start"
                } flex-1 min-w-0`}
              >
                <Card
                  className={`${
                    containsMarkdownTable(message?.content)
                      ? "p-0"
                      : "px-4 py-3"
                  } gap-0 max-w-[85%] break-words ${
                    message.source === "user"
                      ? "bg-transparent text-gray-100 border-[#F35A13]/30"
                      : `bg-transparent text-gray-100 ${
                          containsMarkdownTable(message?.content)
                            ? "border-none"
                            : "border-white/30"
                        }`
                  }`}
                >
                  {containsMarkdownTable(message?.content) ? (
                    <>
                      <p
                        className="text-sm leading-relaxed whitespace-pre-wrap border rounded-lg px-4 py-3 border-white/30"
                        dangerouslySetInnerHTML={{
                          __html: convertBoldMarkdownToHtml(
                            getContent(message?.content)?.message
                          ),
                        }}
                      ></p>
                      <div className="flex gap-6 mt-6">
                        {getContent(message?.content)?.cards.map(
                          (item, index) => {
                            return (
                              <ChatCard key={index} {...item} pattern={index} />
                            );
                          }
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <p
                        className="text-sm leading-relaxed whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{
                          __html: convertBoldMarkdownToHtml(message.content),
                        }}
                      ></p>
                      <div>
                        {renderInput({
                          message: message,
                          currentMessageId: currentMessageId || "",
                          isTyping: isTyping || false,
                          handleSend,
                        })}
                      </div>
                    </>
                  )}
                </Card>
              </div>
            </div>
          ))}
          {isTyping && <MultiStepChatLoader loadingStates={loadingStates} />}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};
