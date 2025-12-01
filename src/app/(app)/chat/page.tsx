"use client";
import React, { useState, useRef, useEffect } from "react";
import { ChatbotScrollableArea } from "@/components/ScrollableArea/ScrollableArea";
import ChatbotInput from "@/components/ChatbotInput/ChatbotInput";
import { useGetQuestionsQuery } from "@/store/api";
import { LoaderOne } from "@/components/ui/loader";
import { MessageProps } from "@/types/chatMessages";
import useNavigationGuard from "@/lib/hooks/useNavigationGuard";

const CHAT_ROLES = {
  USER:"user", 
  ASSISTANT:"assistant"
}

export default function ChatbotUI() {
  const [messages, setMessages] = useState<MessageProps[]>([
    {
      id: "1",
      role: "assistant",
      inputs:[],
      content:
        "👋 Hey there! Welcome to FiSense — your rewards genie for credit cards. I'll help you pick (or fix) the card that gives you max cashback, perks, and smiles. So, what should I call you?",
    },
  ]);
  const [currentMessageNumber, setCurrentMessageNumber] = useState(0)
  const [currentMessageId, setCurrentMessageId] = useState('')
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useNavigationGuard({})

  const {data, isFetching} = useGetQuestionsQuery({})

  useEffect(() => {
    scrollToBottom();
  }, [messages]);


  useEffect(() => {
    const timer = setTimeout(()=> {
      if(data?.result?.length){
        const question = data?.result[currentMessageNumber]
        const newMessage = {  
          id:question?.questionId, 
          role: CHAT_ROLES.ASSISTANT,
          content:question?.question, 
          inputs:question?.inputs,
        }
        setMessages(prev => ([...prev, newMessage ]))
        setCurrentMessageId(question?.questionId)
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [data?.result]);



  if(isFetching){
    return <LoaderOne/>
  }



  const handleSend = (value?:string) => {
    const newValue = value ?? inputValue
    if (!newValue.trim()) return;

    const userMessage = {
      id:crypto.randomUUID(), 
      role: CHAT_ROLES.USER,
      content: newValue,  
      inputs:[]    
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);
    setCurrentMessageNumber((prev)=> prev+1)
    if(data?.result?.length){
      const question = data?.result[currentMessageNumber+1]
      const newMessage = {  
        id:question?.questionId, 
        role: CHAT_ROLES.ASSISTANT,
        content:question?.question, 
        inputs:question?.inputs,
      }
      setMessages(prev => ([...prev, newMessage ]))
      setCurrentMessageId(question?.questionId)
    }
    setIsTyping(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  return (
    <div className="flex flex-col h-screen bg-[#111111]">
      {/* Header - Fixed */}
      <div className="p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="w-30 max-md:w-24" src="/logoWithTitle.svg" alt="logo" />
      </div>
         {/* Messages Area - Scrollable */}
         <ChatbotScrollableArea
            currentMessageId={currentMessageId}
            messages={messages}
            messagesEndRef={messagesEndRef}
            isTyping={isTyping}
            handleSend={handleSend}
          />

          {/* Input Area - Fixed at Bottom */}
          <ChatbotInput
            inputValue={inputValue}
            isTyping={isTyping}
            onInputChange={setInputValue}
            onSend={handleSend}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything..."
          />
    </div>
  );
}
