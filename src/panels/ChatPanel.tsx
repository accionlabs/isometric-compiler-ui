"use client";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "../components/ui/Button";
import { DiagramComponent } from "@/Types";
import { Message, useChat } from "@/hooks/useChatProvider";
import { sendChatRequest, sendImageChatRequest } from "@/services/chat";
import { useEnterSubmit } from "@/hooks/useEnterSubmit";
import { Textarea } from "@/components/ui/Textarea";
import { Paperclip, X } from "lucide-react";
import ViewerPopup from "@/components/ui/ViewerPopup";
import ProgressPopup from "@/components/ui/ProgressPopup";

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

    const [viewerContent, setViewerContent] = useState<React.ReactNode | null>(
        null
    );
    const [isViewerOpen, setViewerOpen] = useState(false);

    const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.onload = () => setSelectedImage(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const clearImage = () => setSelectedImage(null);

    const getViewerContent = (message: Message) => {
        if (message.isImage) {
            return (
                <img
                    src={message.text}
                    alt="Preview"
                    className="w-full h-auto rounded-md"
                />
            );
        } else {
            return (
                <pre className="max-h-96 overflow-auto bg-gray-100 p-4 rounded-md text-sm text-black whitespace-pre-wrap">
                    {JSON.stringify(JSON.parse(message.text), null, 2)}
                </pre>
            );
        }
    };
    // Open viewer
    const openViewerPopup = (message: Message) => {
        setViewerContent(getViewerContent(message));
        setViewerOpen(true);
    };

    // Close viewer
    const closeViewerPopup = () => {
        setViewerOpen(false);
        setViewerContent(null);
    };

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
                    { text: selectedImage, isUser: true, isImage: true }, // Mark it as an image
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
                    { text: res.feedback, isUser: false, isSystemQuery: true },
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
    const [isLoader, setIsLoader] = useState(false);
    const [isLoaderTimePassed, setIsLoaderTimePassed] = useState(false);

    useEffect(() => {
        setIsLoader(isLoading)
        if(!isLoading) setIsLoaderTimePassed(false)
    }, [isLoaderTimePassed, isLoading])

    const LoadMeessagesWithImage: { time: number; message: string }[] = [
        { time: 0, message: "Extracting components." },
        { time: 0.5, message: "Mapping to Unified Model..." },
        { time: 1, message: "Optimizing layout..." },
        { time: 2, message: "Applying isometric view..." },
        { time: 3, message: "Finalizing diagram.." }
    ];

    const messageDurationWithImage = 4;
    return (
        <div className="p-4 h-full flex flex-col gap-4 ">
            {/* chat container */}
            <div className="flex-grow overflow-x-hidden flex flex-col gap-2 scrollbar-thin scrollbar-thumb-customLightGray scrollbar-track-transparent scrollbar-thumb-rounded custom-scrollbar">
                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={`flex ${
                            message.isUser ? "justify-end" : "justify-start"
                        }`}
                    >
                        {message.isImage ? (
                            <img
                                src={message.text}
                                alt="Sent"
                                className="w-20 h-20 cursor-pointer"
                                onClick={() => openViewerPopup(message)}
                            />
                        ) : message.isUser || message.isSystemQuery ? (
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
                            <div
                                className="max-w-xs p-3 rounded-lg bg-gray-700 cursor-pointer border border-gray-500 hover:bg-gray-600 flex items-center"
                                onClick={() => openViewerPopup(message)}
                            >
                                <span className="text-blue-400 font-semibold">
                                    📄 View JSON Response
                                </span>
                            </div>
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
            <form onSubmit={handleSend} ref={formRef} className="w-full">
                <div className="relative flex max-h-60 w-full grow items-center overflow-hidden bg-background px-8 sm:rounded-md sm:border sm:p-1 sm:pr-20">
                    {/* Image on the left side */}
                    {selectedImage && (
                        <div className="relative w-12 h-12 flex-shrink-0">
                            <img
                                src={selectedImage}
                                alt="Selected"
                                className="w-full h-full object-cover rounded-sm border"
                            />
                            <button
                                type="button"
                                className="absolute -top-1 -right-1 p-[0.125rem] bg-white rounded-full shadow"
                                onClick={clearImage}
                            >
                                <X className="w-2 h-2 text-customGray" />
                            </button>
                        </div>
                    )}

                    {/* Text input next to image */}
                    <Textarea
                        id="messageInput"
                        ref={inputRef}
                        tabIndex={0}
                        onKeyDown={onKeyDown}
                        placeholder="Send a message."
                        className="ml-1 min-h-[60px] w-full resize-none bg-transparent px-4 py-[1.3rem] focus-within:outline-none sm:text-sm scrollbar-hide"
                        autoFocus
                        spellCheck={false}
                        autoComplete="off"
                        autoCorrect="off"
                        name="message"
                        rows={1}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />

                    <div className="flex gap-1 justify-center items-center absolute right-0 top-[13px] sm:right-4">
                        <Paperclip className="mt-1 cursor-pointer" onClick={() => fileInputRef.current?.click()} />
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


            {/* viewer Popup */}
            <ViewerPopup
                isOpen={isViewerOpen}
                onClose={closeViewerPopup}
                content={viewerContent || ""}
            />
            {!!selectedImage && (
                <ProgressPopup
                    isOpen={isLoader}
                    onClose={() => {
                        setIsLoader(isLoading);
                        setIsLoaderTimePassed(true);
                    }}
                    messages={LoadMeessagesWithImage}
                    duration={messageDurationWithImage}
                />
            )}
        </div>
    );
};
export default ChatPanel;
