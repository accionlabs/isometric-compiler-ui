"use client";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "../components/ui/Button";
import { DiagramComponent } from "@/Types";
import { Message, useChat } from "@/hooks/useChatProvider";
import { getChatByuuid, getSignedUrl, sendChatRequestV2 } from "@/services/chat";
import { useEnterSubmit } from "@/hooks/useEnterSubmit";
import { Textarea } from "@/components/ui/Textarea";
import { FileText, Paperclip, X } from "lucide-react";
import ViewerPopup from "@/components/ui/ViewerPopup";
import ProgressPopup from "@/components/ui/ProgressPopup";
import { useMutation, useQuery } from "@tanstack/react-query";
import Markdown from "react-markdown";

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
    // const [isLoading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = React.useRef<HTMLTextAreaElement>(null);

    // const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [viewerContent, setViewerContent] = useState<React.ReactNode | null>(
        null
    );
    const [isViewerOpen, setViewerOpen] = useState(false);
    const [selectedFile, setSelectedFile] = React.useState<{ file: File | null; src: string; fileType: 'image' | 'pdf' | null }>({
        file: null,
        src: '',
        fileType: null,
    });
    const currentUrl = new URL(window.location.href);
    const existinguuid = currentUrl.searchParams.get('uuid')
    // get api using useQuery
    const {data: existingChatData, isLoading: isExistingChatLoading} = useQuery({queryKey: ['getChatByuuid', existinguuid], queryFn: ()=>{
        return getChatByuuid(existinguuid || '')
    }, enabled: !!existinguuid})
    const { mutate: sendChatMutaion, isPending: isLoading } = useMutation({
        mutationFn: sendChatRequestV2,
        onSettled: (res, error) => {
            if (res) {
                if (res.metadata.needFeedback) {
                    setMessages((prev) => [
                        ...prev,
                        { text: res.message, isUser: false, isSystemQuery: true, metaData: {} }
                    ]);
                } else {
                    handleLoadDiagramFromJSON(res.metadata.content ?? []);
                    setMessages((prev) => [
                        ...prev,
                        {
                            text: res.message,
                            isUser: false,
                            isSystemQuery: false,
                            metaData: { content: res.metadata.content }
                        }
                    ]);
                }
            }
            if (error) {
                setMessages((prev) => [
                    ...prev,
                    { text: 'something went wrong. Please try again', isUser: false, isSystemQuery: true, metaData: {} }
                ]);
                // setError({ isError: true, message: error.message });
            }
        }
    })

    useEffect(()=>{
        if(existingChatData?.chats.length){
            const existingMessages = existingChatData.chats.map((chat)=>{
                const existingMessage : Message = {
                    text: chat.message,
                    isUser: chat.role === 'user',
                    isSystemQuery: chat.role === 'system',
                    metaData: chat.metadata
                }
                return existingMessage
            })
            setMessages(existingMessages)
        }
    },[existingChatData])


    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
    
            const reader = new FileReader();
            if (file.type.startsWith('image/')) {
                // Read image as Data URL for preview
                reader.onload = () =>
                    setSelectedFile({
                        file,
                        fileType: 'image',
                        src: reader.result as string,
                    });
                reader.readAsDataURL(file);
            } else if (file.type === 'application/pdf') {
                // Set PDF file without preview
                setSelectedFile({
                    file,
                    src: '',
                    fileType: 'pdf',
                });
            }
        }
    };

    const clearFile = () => setSelectedFile({ file: null, src: '', fileType: null });

    const getViewerContent = async (message: Message) => {
        if (message.metaData.fileType === 'image') {
            let signedUrl
            if(message.metaData.fileUrl?.startsWith('https://')){
                const urlArray = message.metaData.fileUrl.split('/')
                const imageKey = urlArray[urlArray.length - 1]
                 signedUrl= await getSignedUrl(imageKey)
                
            }else{
                signedUrl = message.metaData.fileUrl
            }
            return (
                <img
                    src={signedUrl}
                    alt="Preview"
                    className="w-full h-auto rounded-md"
                />
            );
        } else {
            return (
                <pre className="max-h-96 overflow-auto bg-gray-100 p-4 rounded-md text-sm text-black whitespace-pre-wrap">
                    {JSON.stringify(message.metaData.content, null, 2)}
                </pre>
            );
        }
    };
    // Open viewer
    const openViewerPopup = async (message: Message) => {
        setViewerContent(await getViewerContent(message));
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
        if(!existinguuid) return
        if (!input && !selectedFile.file ) return;
        setMessages((prev) => [
            ...prev,
            { text: input, isUser: true, isSystemQuery: false, metaData: { fileUrl: selectedFile.src, fileType: selectedFile.fileType ?? undefined, fileName: selectedFile.file?.name } }
        ]);
        sendChatMutaion(
            {
                query: input,
                uuid: existinguuid,
                currentState: diagramComponents,
                file: selectedFile.file ?? undefined
            }
        );
        setInput("");
        clearFile();
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
                    className={`flex flex-col gap-2 ${
                        message.isUser ? "items-end" : "items-start"
                    }`}
                >
                
                    {/* Image Message */}
                    {message.metaData.fileType === "image" && (
                        <img
                            src={message.metaData.fileUrl}
                            alt="Sent"
                            className="w-20 h-20 cursor-pointer"
                            onClick={() => openViewerPopup(message)}
                            onError={(e) => (e.currentTarget.src = "/images/placeholder.jpg")} 
                        />
                    )}
                
                    {/* PDF Message */}
                    {message.metaData.fileType === "pdf" && (
                        <div className="w-20 h-20 flex flex-col items-center justify-center bg-gray-100 rounded-sm border">
                            <FileText className="w-5 h-5 text-gray-700" />
                            <span className="text-[10px] text-gray-800 truncate max-w-[40px] text-center">
                                {message.metaData.fileName}
                            </span>
                        </div>
                    )}

                    {/* Text Message */}
                    {message.text && (
                        <div
                            className={`max-w-xs px-4 py-2 rounded-lg break-words ${
                                message.isUser ? "bg-blue-600" : "bg-gray-700"
                            }`}
                        >
                            <Markdown>{message.text}</Markdown>
                        </div>
                    )}
                
                    {/* JSON Response */}
                    {message.metaData.content && (
                        <div
                            className="max-w-xs p-3 rounded-lg bg-gray-700 cursor-pointer border border-gray-500 hover:bg-gray-600 flex items-center"
                            onClick={() => openViewerPopup(message)}
                        >
                            <span className="text-blue-400 font-semibold">📄 View JSON Response</span>
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
                    {selectedFile.file && (
                        <div className="relative w-12 h-12 flex-shrink-0">
                            {selectedFile.fileType === 'image' ? (
                                <img
                                    src={selectedFile.src}
                                    alt="Selected"
                                    className="w-full h-full object-cover rounded-sm border"
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 rounded-sm border">
                                    <FileText className="w-5 h-5 text-gray-700" />
                                    <span className="text-[10px] text-gray-800 truncate max-w-[40px] text-center">{selectedFile.file?.name}</span>
                                </div>
                            )}

                            <button
                                type="button"
                                className="absolute -top-1 -right-1 p-[0.125rem] bg-white rounded-full shadow"
                                onClick={() => clearFile()}
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
                            accept="image/*,.pdf"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileSelect}
                        />
                        <Button
                            type="submit"
                            disabled={(!input && !selectedFile.file) || isLoading}
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
            {!!selectedFile.file && (
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
