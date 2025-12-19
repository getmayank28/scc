"use client";
import React, { useState, useRef, useEffect, useMemo } from "react";
import useWebSocket from 'react-use-websocket';
import { ChatbotScrollableArea } from "@/components/ScrollableArea/ScrollableArea";
import ChatbotInput from "@/components/ChatbotInput/ChatbotInput";
// import { useLazyConnectWebSocketQuery } from "@/store/socket";
import {
  clearFromSessionStorage,
  // getFromSessionStorage,
  WS_SESSION_KEY,
} from "@/lib/utils/sessionStorage";
import { useChatState } from "@/hooks/useChatState";
import { ChatMessage } from "@/types/chatMessages";
import { Button } from "@/components/ui/button";
// import { LoaderThree } from "@/components/ui/loader";
import GreetUser from "@/components/GreetUser/GreetUser";
// import { getAnonymousId } from "@/lib/utils/ananymous";
// import { useChatSessionTokenMutation, useCreateChatSessionMutation } from "@/store/api";
import useSocket from "@/lib/hooks/useSocket";

export default function ChatbotUI() {
  const [inputValue, setInputValue] = useState("");
  const [currentMessageId, setCurrentMessageId] = useState("");
  const [startChatLoader, setStartChatLoader] = useState(false);
  const {
    messages,
    addUserMessage,
    addAssistantMessage,
    loadHistory,
    setSession,
  } = useChatState();

  const {getSocketUrl} = useSocket()

  const [socketUrl, setSocketUrl] = useState<string | null>(null)

  const { sendMessage, lastMessage, readyState } = useWebSocket(
    socketUrl ? socketUrl : null
  );

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // const token = getFromSessionStorage(WS_SESSION_KEY) ?? "";
  // const { data: socketData, isLoading } = useConnectWebSocketQuery({
  //   language: "EN_US",
  //   isAudio: false,
  //   token,
  // });
  // const [webSocketConnect, { data: socketData, isLoading }] =
  //   useLazyConnectWebSocketQuery();
  // const send = socketData?.send;
  const processedSocketMessages = useRef(new Set<string>());
  const isAssistantTyping =
    messages.length > 0 && messages[messages.length - 1]?.source === "user";

    // const sessionId = ''


    // const WS_URL = (token:string, sessionId:string) => `wss://sarathi-9720-411951434462.us-central1.run.app/ws?token=${token}&sessionId=${sessionId}&language=EN_US&is_audio=false`;

    // const shouldConnect = Boolean(token && sessionId);
    // const { sendMessage, lastMessage, readyState } = useWebSocket(
    //   shouldConnect
    //     ? WS_URL(token, sessionId)
    //     : null
    // );
  // useEffect(() => {
  //   if (!socketData?.messages) return;
  //   // eslint-disable-next-line @typescript-eslint/no-explicit-any
  //   socketData.messages.forEach((msg: any, index: number) => {
  //     // Create a unique ID for each message in the socket array
  //     // Using combination of type, m_id, source, and index
  //     const socketMsgId = `${msg.type}-${msg.m_id}-${msg.source}-${index}-${msg.content?.substring(0, 10)}`;

  //     // Skip if we've already processed this exact message
  //     if (processedSocketMessages.current.has(socketMsgId)) {
  //       return;
  //     }

  //     // Mark as processed
  //     processedSocketMessages.current.add(socketMsgId);

  //     if (msg.type === "session") {
  //       setSession(msg);
  //       return;
  //     }

  //     if (msg.source === "assistant") {
  //       // Pass the unique chunk ID to track it
  //       addAssistantMessage(msg, socketMsgId);
  //       return;
  //     }

  //     if (msg.type === "history") {
  //       loadHistory(msg.messages);
  //       return;
  //     }
  //   });
  // }, [socketData?.messages, addAssistantMessage, loadHistory, setSession]);

  useEffect(() => {
    const id = messages?.[messages?.length - 1]?.m_id;
    setCurrentMessageId(id);
  }, [messages?.length]);

  const showStartButton = useMemo(() => {
    return !messages?.length 
  }, [messages]);

 

  // useEffect(() => {
  //   let timer: ReturnType<typeof setTimeout> | undefined;

  //   if (startChatLoader) {
  //     timer = setTimeout(() => {
  //       setStartChatLoader(false);
  //     }, 5000);
  //   }

  //   return () => {
  //     if (timer !== undefined) {
  //       clearTimeout(timer);
  //     }
  //   };
  // }, [startChatLoader]);

  useEffect(() => {
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    scrollToBottom();
  }, [messages]);

  const handleSend = (value: string) => {
    if (!value.trim()) return;


    // console.log(value,readyState, "hbcfhbvbfvbfhbh")

    const userMsg: ChatMessage = {
      content: value,
      m_id: crypto.randomUUID(),
      source: "user",
      search: false,
      type: "TextMessage",
    };
    sendMessage(JSON.stringify(userMsg))

    addUserMessage(userMsg);
    // send(userMsg);

    setInputValue("");
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(inputValue);
    }
  };

  const handleClearChat = () => {
    clearFromSessionStorage(WS_SESSION_KEY);
    window.location.reload();
  };

  // if (showStartButton === undefined) {
  //   return (
  //     <div className="bg-background-primary flex justify-center items-center w-full h-screen fixed">
  //       <LoaderThree />
  //     </div>
  //   );
  // }

  // const [createChatSession] = useCreateChatSessionMutation()
  // const [chatSessionToken] = useChatSessionTokenMutation()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleMessage = (message:any) => {
    console.log(message, message.source, "socket message");
  
    if (message.source === "assistant") {
      addAssistantMessage(message);
      return;
    }
  
    if (message.type === "history") {
      loadHistory(message.messages);
      return;
    }
  };

  useEffect(() => {
    if (!lastMessage) return;
    let parsed;
    try {
      parsed = JSON.parse(lastMessage.data);
    } catch {
      console.error("Invalid JSON from socket:", lastMessage.data);
      return;
    }
  
    handleMessage(parsed);
  }, [lastMessage]);

  useEffect(()=>{
    const conectSocket = async () => {
      const baseUrl = await getSocketUrl()
      if(baseUrl) setSocketUrl(baseUrl)
    }
    conectSocket()

    if (!lastMessage) return;
    let parsed;
    try {
      parsed = JSON.parse(lastMessage.data);
    } catch {
      console.error("Invalid JSON from socket:", lastMessage.data);
      return;
    }

    if(parsed.type === 'history'){
      console.log(parsed, "fhvfhbjfbnvf")
    }
   
  },[lastMessage])
 
  const handleGreetClick = async () => {
    setStartChatLoader(true);
   
    sendMessage(JSON.stringify({
      content: 'hello world',
      m_id: crypto.randomUUID(),
      source: "user",
      search: false,
      type: "TextMessage",
    }))
  };
  return (
    <>
      {showStartButton? (
          <GreetUser
          component
          loading={startChatLoader}
          onClick={handleGreetClick}
        />

      ) : (
        <div className="flex flex-col h-screen bg-[#111111]">
          <div className="p-4 flex justify-end items-center">
            <Button variant="outline" onClick={handleClearChat}>
              Clear chat
            </Button>
          </div>
          {/* <div>
 
         <button className="bg-white py-2 px-4" onClick={handleGreetClick}>start connectin</button>
        <button className="bg-white py-2 px-4" onClick={() => {
          sendMessage(JSON.stringify({
            content: 'hello world',
            m_id: crypto.randomUUID(),
            source: "user",
            search: false,
            type: "TextMessage",
          }))
        }}>send message</button>
        </div> */}
          
          {/* Messages Area - Scrollable */}
          <ChatbotScrollableArea
            currentMessageId={currentMessageId}
            messages={messages}
            handleSend={handleSend}
            messagesEndRef={messagesEndRef}
            isTyping={isAssistantTyping}
          />
          {/* Input Area - Fixed at Bottom */}
          <ChatbotInput
            inputValue={inputValue}
            onInputChange={setInputValue}
            onSend={() => handleSend(inputValue)}
            placeholder="Ask me anything..."
            onKeyPress={handleKeyPress}
            isTyping={isAssistantTyping}
          />
        </div>
      )}
    </>
  );
}
