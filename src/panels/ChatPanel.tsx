// @/panels/ChatPanel.tsx

"use client";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "../components/ui/Button";
import { CodeBlock } from "./CodeBlockCard";
import { DiagramComponent } from "@/Types";
import { useChat } from "@/hooks/useChatProvider";
import { sendChatRequest, sendImageChatRequest } from "@/services/chat";
import { useEnterSubmit } from "@/hooks/useEnterSubmit";
import { Textarea } from "@/components/ui/Textarea";
import { Paperclip, X } from "lucide-react";
interface ChatPanelProps {
    handleLoadDiagramFromJSON: (
        loadedComponents: DiagramComponent[]
    ) => Promise<void>;
    diagramComponents: DiagramComponent[];
    addHistory: (diagramComponent: DiagramComponent[]) => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({
    handleLoadDiagramFromJSON,
    diagramComponents,
    addHistory
}) => {
    const { messages, setMessages } = useChat();
    const { formRef, onKeyDown } = useEnterSubmit();

    const [input, setInput] = useState("");
    const [isLoading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = React.useRef<HTMLTextAreaElement>(null);

    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.onload = () => setSelectedImage(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const clearImage = () => setSelectedImage(null);

    // Scroll to the bottom when a new message is added
    useEffect(() => {
        messages.length > 0 &&
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async (e: { preventDefault: () => void }) => {
        e.preventDefault();
        if (selectedImage) {
            setLoading(true);
            try {
                const res = await sendImageChatRequest(selectedImage);
                handleLoadDiagramFromJSON(res);
                clearImage();
                setLoading(false);
                setMessages((prev) => [
                    ...prev,
                    {
                        text: JSON.stringify(res, null, 2),
                        isUser: false,
                        isSystemQuery: false
                    }
                ]);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        } else if (input.trim()) {
            setMessages((prev) => [
                ...prev,
                { text: input, isUser: true, isSystemQuery: false }
            ]);
            handleResponse(input);
            setInput("");
        }
    };

    const handleResponse = async (input: string) => {
        setLoading(true);
        try {
            const res = await sendChatRequest(input, diagramComponents);
            if (res.needFeedback) {
                setMessages((prev) => [
                    ...prev,
                    { text: res.feedback, isUser: false, isSystemQuery: true }
                ]);
            } else {
                handleLoadDiagramFromJSON(res.result);
                setMessages((prev) => [
                    ...prev,
                    { text: res.feedback, isUser: false, isSystemQuery: true }
                ]);
                setMessages((prev) => [
                    ...prev,
                    {
                        text: JSON.stringify(res.result, null, 2),
                        isUser: false,
                        isSystemQuery: false
                    }
                ]);
            }
        } catch (error) {
            console.error("Error in handleResponse:", error);
            setMessages((prev) => [
                ...prev,
                {
                    text: "An error occurred. Please try again.",
                    isUser: false,
                    isSystemQuery: true
                }
            ]);
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="p-4 flex h-full flex-col gap-4 ">
            {/* chat container */}
            <div className="flex-grow overflow-x-hidden flex flex-col gap-2 scrollbar-thin scrollbar-thumb-customLightGray scrollbar-track-transparent scrollbar-thumb-rounded custom-scrollbar">
                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={`flex ${
                            message.isUser ? "justify-end" : "justify-start"
                        }`}
                    >
                        {message.isUser || message.isSystemQuery ? (
                            <div
                                className={`max-w-xs px-4 py-2 rounded-lg break-words ${
                                    message.isUser
                                        ? "bg-blue-600"
                                        : "bg-gray-700"
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
                    <div
                        className={`max-w-xs px-4 py-2 rounded-lg  bg-gray-700"}`}
                    >
                        AI Thinking....
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* input container */}
            <form onSubmit={handleSend} ref={formRef}>
                <div className="relative flex max-h-60 w-full grow flex-col overflow-hidden bg-background px-8 sm:rounded-md sm:border sm:p-1 sm:pr-20">
                    <Textarea
                        id="messageInput"
                        ref={inputRef}
                        tabIndex={0}
                        onKeyDown={onKeyDown}
                        placeholder="Send a message."
                        className="min-h-[60px] w-full resize-none bg-transparent px-4 py-[1.3rem] focus-within:outline-none sm:text-sm"
                        autoFocus
                        spellCheck={false}
                        autoComplete="off"
                        autoCorrect="off"
                        name="message"
                        rows={1}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />

                    {selectedImage && (
                        <div className="absolute top-2 left-2 flex items-center space-x-2">
                            <div className="relative w-12 h-12">
                                <img
                                    src={selectedImage}
                                    alt="Selected"
                                    className="w-full h-full object-cover rounded-sm border"
                                />
                                <button
                                    type="button"
                                    className="absolute top-0 right-0 p-1 bg-white rounded-full shadow"
                                    onClick={clearImage}
                                >
                                    <X className="w-4 h-4 text-red-600" />
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-1 justify-center align-middle absolute right-0 top-[13px] sm:right-4">
                        <Paperclip
                            className="mt-1 cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                        />

                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleImageSelect}
                        />
                        <Button
                            type="submit"
                            disabled={(!input && !selectedImage) || isLoading}
                        >
                            send
                            <span className="sr-only">Send message</span>
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
};
export default ChatPanel;
