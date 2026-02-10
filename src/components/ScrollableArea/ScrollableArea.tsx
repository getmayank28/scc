import { ScrollArea } from "@/components/ui/scroll-area";
import { RefObject, useEffect, useState } from "react";
import { ChatMessage, MESSAGE_TYPE, MessageSource } from "@/types/chatMessages";
import {
  convertBoldMarkdownToHtml,
  isCardRecommendationResponse,
} from "@/lib/utils/markdown";
import ChatCard from "../ChatCard/ChatCard";
import { MultiStepChatLoader } from "../MultiStepChatLoader/MultiStepChatLoader";
import { renderInput } from "@/lib/utils/renderInput";
import { BotRecommendationCreditCardProps } from "@/types/card";
import { chatLoaderStates } from "@/lib/constants/loader";

interface ChatbotScrollableAreaProps {
  currentMessageId?: string;
  messages: ChatMessage[];
  isTyping?: boolean;
  messagesEndRef?: RefObject<HTMLDivElement | null>;
  handleSend: (
    value: string | Record<string, string | number>,
    id?: string
  ) => void;
  isSocketLoading?: boolean
}

export const ChatbotScrollableArea = ({
  currentMessageId,
  messages,
  isTyping,
  messagesEndRef,
  handleSend,
  isSocketLoading
}: ChatbotScrollableAreaProps) => {
  const [visibleMessages, setVisibleMessages] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    // Add new messages to visible set with a slight delay for animation
    messages.forEach((message) => {
      if (!visibleMessages.has(message?.m_id)) {
        setTimeout(() => {
          setVisibleMessages((prev) => new Set(prev).add(message?.m_id));
        }, 50);
      }
    });
  }, [messages]);

  if (!messages) return;


  const getStyles = (source: MessageSource, m_id: string, content: string, type?:string) => {
    const container = `flex max-md:w-full w-full gap-3 ${source === "user" ? "flex-row-reverse" : "flex-row"
      } transition-opacity duration-500 ease-in ${visibleMessages.has(m_id) ? "opacity-100" : "opacity-0"
      }`
    const containerAnimation = visibleMessages.has(m_id)
      ? "fadeIn 0.5s ease-in forwards"
      : "none"

    const cardContainer = `flex flex-col ${source === "user" ? "items-end" : "items-start"
      } flex-1 min-w-0 max-md:max-w-full max-md:w-full`


    const card = () => {
      if (!content && type !== MESSAGE_TYPE.FORM) return ''

      let style = 'gap-0 max-w-[85%] max-md:max-w-[75%] break-words bg-brown-sidebar'

      if (isCardRecommendationResponse(content)) {
        style = style + " p-0"
      } else {
        style = style + " px-4 py-3 max-md:px-3"
      }
      if (source === "user") {
        style = style + " bg-brown-sidebar text-gray-100 rounded-md border border-primary-orange/50"
      } else {
        const base = " bg-brown-sidebar border text-gray-100 rounded-md"
        if (isCardRecommendationResponse(content)) {
          style = style + base + " border-none bg-transparent"
        } else {
          style = style + base + " border-brown-border"
        }
      }
      return style
    }

    return {
      container,
      containerAnimation,
      cardContainer,
      card:card()
    }
  }
  return (
    <div className={`flex-1 overflow-hidden ${isSocketLoading ? 'opacity-0' : 'opacity-100'}`}>
      <ScrollArea className="h-full px-4 py-6 max-md:py-2">
        <div className="max-w-4xl mx-auto space-y-6 pb-4 max-md:w-[91vw]">
          {messages.map((message) => (
            <div
              key={message?.m_id}
              className={getStyles(message?.source, message?.m_id, message?.content)?.container}
              style={{ animation: getStyles(message?.source, message?.m_id,message?.content)?.containerAnimation }} >

              <div className={getStyles(message?.source, message?.m_id,message?.content)?.cardContainer}>
                <div className={getStyles(message?.source, message?.m_id, message?.content, message?.type)?.card} >
                  {isCardRecommendationResponse(message?.content) ? (
                    <>
                      {JSON.parse(convertBoldMarkdownToHtml(message?.content))?.startMessage && <p
                        className="text-sm max-md:text-xs leading-relaxed whitespace-pre-wrap border rounded-lg px-4 py-3 border-brown-border bg-brown-sidebar"
                        dangerouslySetInnerHTML={{
                          __html: JSON.parse(convertBoldMarkdownToHtml(message?.content))?.startMessage
                          ,
                        }}
                      ></p>}
                      <div className="flex gap-6 my-6 max-md:flex-col">
                        {JSON.parse(convertBoldMarkdownToHtml(message?.content))?.cards.map(
                          (item: BotRecommendationCreditCardProps, index: number) => {
                            return (
                              <ChatCard key={index} {...item} />
                            );
                          }
                        )}
                      </div>
                      {JSON.parse(convertBoldMarkdownToHtml(message?.content))?.endMessage && <p
                        className="text-sm max-md:text-xs leading-relaxed whitespace-pre-wrap border rounded-lg px-4 py-3 border-brown-border bg-brown-sidebar"
                        dangerouslySetInnerHTML={{
                          __html: JSON.parse(convertBoldMarkdownToHtml(message?.content))?.endMessage
                          ,
                        }}
                      ></p>}
                    </>
                  ) : (
                    <>
                      <p
                        className="text-sm max-md:text-xs leading-relaxed whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{
                          __html: convertBoldMarkdownToHtml(message?.content),
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
                </div>
              </div>
            </div>
          ))}
          {isTyping && <MultiStepChatLoader loadingStates={chatLoaderStates} />}
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
