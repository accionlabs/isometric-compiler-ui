// @/hooks/useChatProvider.tsx

import React, {
  ReactNode,
  useContext,
  useState,
  Dispatch,
  SetStateAction,
  createContext,
} from "react";

type Message = { text?: string; isUser: boolean; isSystemQuery: boolean, imageUrl?: string; };
interface ChatProviderProps {
  children: ReactNode;
}

interface ChatContextType {
  messages: Message[]; // Specify messages as a list of strings or your specific message type
  setMessages: Dispatch<SetStateAction<Message[]>>;
}

// Create the context with an initial undefined value
const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);

  return (
    <ChatContext.Provider value={{ messages, setMessages }}>
      {children}
    </ChatContext.Provider>
  );
};

// Custom hook to access the Chat context
export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
