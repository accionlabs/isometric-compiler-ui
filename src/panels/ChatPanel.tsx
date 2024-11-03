"use client";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { CodeBlock } from "./CodeBlockCard";
import { DiagramComponent } from "@/Types";
import { useChat } from "@/hooks/useChatProvider";
import { sendChatRequest } from "@/services/chat";

interface ChatPanelProps {
  handleLoadDiagramFromJSON: (loadedComponents: DiagramComponent[]) => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ handleLoadDiagramFromJSON }) => {
  const { messages, setMessages } = useChat();

  const [input, setInput] = useState("");
  const [isLoading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to the bottom when a new message is added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (input.trim()) {
      setMessages((prev) => [...prev, { text: input, isUser: true }]);
      handleResponse(input);
      setInput("");
    }
  };

  const handleResponse = async (input: string) => {
    setLoading(true);
    try {
      const res = await sendChatRequest(input);
      const resCopy = JSON.parse(JSON.stringify(res));
      handleLoadDiagramFromJSON(res);
      setMessages((prev) => [
        ...prev,
        { text: JSON.stringify(resCopy, null, 2), isUser: false },
      ]);
    } catch (error) {
      console.error("Error in handleResponse:", error);
      setMessages((prev) => [
        ...prev,
        { text: "An error occurred. Please try again.", isUser: false },
      ]);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="p-4 flex flex-col gap-4 ">
      {/* chat container */}
      <div className="h-[85vh] overflow-scroll flex flex-col gap-2">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.isUser ? "justify-end" : "justify-start"
            }`}
          >
            {message.isUser ? (
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  message.isUser ? "bg-blue-600" : "bg-gray-700"
                }`}
              >
                {message.text}
              </div>
            ) : (
              <CodeBlock language="JSON" value={message.text} />
            )}
          </div>
        ))}
        {isLoading && (
          <div className={`max-w-xs px-4 py-2 rounded-lg  bg-gray-700"}`}>
            AI Thinking....
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* input container */}
      <form onSubmit={handleSend}>
        <div className="flex bottom-2 gap-2">
          <Input
            tabIndex={0}
            autoFocus
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter your requirement"
            className="w-full bg-gray-700 text-white border-gray-600 focus:border-blue-500 placeholder-gray-400"
          />
          <Button type="submit" className="bg-blue-600 hover:bg-blue-500">
            Send
          </Button>
        </div>
      </form>
    </div>
  );
};
export default ChatPanel;
