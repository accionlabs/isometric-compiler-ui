"use client";
import React, { useEffect, useRef, useState } from "react";
import { DiagramComponent } from "@/Types";
import { Message, useChat } from "@/hooks/useChatProvider";
import {
    getChatByuuid,
    getSignedUrl,
    sendChatRequestV2
} from "@/services/chat";
import { useEnterSubmit } from "@/hooks/useEnterSubmit";
import { Textarea } from "@/components/ui/Textarea";
import { Eye, FileText, X } from "lucide-react";
import ViewerPopup from "@/components/ui/ViewerPopup";
import ProgressPopup from "@/components/ui/ProgressPopup";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Markdown from "react-markdown";
import { CUSTOM_SCROLLBAR, FILE_TYPE_MAP } from "@/Constants";
import { getDiagramImageUrl } from "@/lib/exportUtils";
import { config } from "@/config";
import {
    // BreezeIcon,
    SendIcon,
    UnifiedModelIcon
} from "@/components/ui/IconGroup";

import GitRepoDialog from "./GitRepoDialog";
import AttachmentMenu from "./AttachmentMenu";
import pdf from "@/assets/pdf.png";
import image from "@/assets/image.png";
import text from "@/assets/text.png";
interface ChatPanelProps {
    handleLoadDiagramFromJSON: (
        loadedComponents: DiagramComponent[]
    ) => Promise<void>;
    diagramComponents: DiagramComponent[];
    addHistory: (diagramComponent: DiagramComponent[]) => void;
    handleUndo: () => void;
    handleRedo: () => void;
}

const sendDiagramImage = async (
    imageUrl: string,
    fileName: string,
    email: string
) => {
    try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const formData = new FormData();

        formData.append(
            "image",
            new File([blob], fileName, { type: blob.type })
        );
        formData.append("email", email);

        const uploadResponse = await fetch(
            `${config.gatewayApiUrl}/isometric/sendEmail`,
            {
                method: "POST",
                body: formData
            }
        );

        if (!uploadResponse.ok) {
            throw new Error(
                `Failed to send email: ${uploadResponse.statusText}`
            );
        }

        console.log("Email sent successfully!");
    } catch (error) {
        console.error("Error sending image:", error);
    }
};

const ChatPanel: React.FC<ChatPanelProps> = ({
    handleLoadDiagramFromJSON,
    diagramComponents,
    addHistory,
    handleRedo,
    handleUndo
}) => {
    const { messages, setMessages } = useChat();
    const { formRef, onKeyDown } = useEnterSubmit();

    const [input, setInput] = useState("");
    const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
    const [isGitRepoDialoagOpen, setIsGitRepoDialoagOpen] = useState(false);
    // const [isLoading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = React.useRef<HTMLTextAreaElement>(null);

    // const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [viewerContent, setViewerContent] = useState<React.ReactNode | null>(
        null
    );
    const [isViewerOpen, setViewerOpen] = useState(false);
    const [showLoader, setShowLoader] = useState(false);

    const [selectedFile, setSelectedFile] = useState<{
        file: File | null;
        src: string;
        fileType?: "image" | "pdf" | "txt" | "text" | null;
    }>({
        file: null,
        src: "",
        fileType: null
    });
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const currentUrl = new URL(window.location.href);
    const existinguuid = currentUrl.searchParams.get("uuid");
    // get api using useQuery
    const { data: existingChatData, isLoading: isExistingChatLoading } =
        useQuery({
            queryKey: ["getChatByuuid", existinguuid],
            queryFn: () => {
                return getChatByuuid(existinguuid || "");
            },
            enabled: !!existinguuid
        });

    const { mutate: sendChatMutaion, isPending: isLoading } = useMutation({
        mutationFn: sendChatRequestV2,
        onSettled: async (res, error) => {
            if (res) {
                if (res.metadata.isEmailQuery && !!res.metadata.emailId) {
                    const imageUrl = await getDiagramImageUrl("png");
                    await sendDiagramImage(
                        imageUrl,
                        "diagram.png",
                        res.metadata.emailId
                    );
                }
                if (res.metadata?.action?.[0]?.action === "undo") {
                    handleUndo();
                }
                if (res.metadata?.action?.[0]?.action === "redo") {
                    handleRedo();
                }
                if (res.metadata.needFeedback) {
                    if (res.metadata.isGherkinScriptQuery) {
                        setMessages((prev) => [
                            ...prev,
                            {
                                text: res.message,
                                isUser: false,
                                isSystemQuery: true,
                                metaData: {
                                    isGherkinScriptQuery:
                                        res.metadata.isGherkinScriptQuery,
                                    content: res.metadata.content
                                }
                            }
                        ]);
                    } else {
                        setMessages((prev) => [
                            ...prev,
                            {
                                text: res.message,
                                isUser: false,
                                isSystemQuery: true,
                                metaData: {}
                            }
                        ]);
                    }
                } else {
                    if (
                        res.metadata?.action?.[0]?.action !== "undo" &&
                        res.metadata?.action?.[0]?.action !== "redo" &&
                        JSON.stringify(res.metadata.content) !==
                            JSON.stringify(diagramComponents)
                    ) {
                        handleLoadDiagramFromJSON(res.metadata.content ?? []);
                        addHistory(res.metadata.content ?? []);
                    }
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
                    {
                        text: "something went wrong. Please try again",
                        isUser: false,
                        isSystemQuery: true,
                        metaData: {}
                    }
                ]);
                // setError({ isError: true, message: error.message });
            }
            setIsLoader(false);
        }
    });

    useEffect(() => {
        const existingMessages = existingChatData?.data.map((chat) => {
            const existingMessage: Message = {
                text: chat.message,
                isUser: chat.role === "user",
                isSystemQuery: chat.role === "system",
                metaData: chat.metadata
            };
            return existingMessage;
        });
        setMessages(existingMessages || []);
    }, [existingChatData]);

    const LoadMessagesWithImage = [
        { time: 0, message: "Extracting components." },
        { time: 4, message: "Mapping to Unified Model..." },
        { time: 8, message: "Optimizing layout..." },
        { time: 10, message: "Applying isometric view..." },
        { time: 14, message: "Finalizing diagram.." }
    ];

    const LoadMessagesWithPDF = [
        { time: 0, message: "Extracting text from PDF..." },
        { time: 1, message: "Analyzing document structure..." },
        { time: 2, message: "Detecting diagrams or tables..." },
        { time: 3, message: "Extracting business specification..." },
        { time: 4, message: "Extracting design specification..." },
        { time: 5, message: "Extracting Breeze blueprint..." },
        { time: 6, message: "Generating semantic model..." }
    ];

    const LoadMessagesFoeInput = [
        { time: 0, message: "Extracting text from PDF..." },
        { time: 1, message: "Analyzing document structure..." },
        { time: 2, message: "Detecting diagrams or tables..." },
        { time: 3, message: "Extracting business specification..." },
        { time: 4, message: "Extracting design specification..." },
        { time: 5, message: "Extracting Breeze blueprint..." },
        { time: 6, message: "Generating semantic model..." }
    ];

    const [loadMessages, setLoadMessages] = useState(LoadMessagesWithImage);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];

            const reader = new FileReader();

            if (file.type.startsWith("image/")) {
                // Read image as Data URL for preview
                reader.onload = () =>
                    setSelectedFile({
                        file,
                        fileType: "image",
                        src: reader.result as string
                    });
                setLoadMessages(LoadMessagesWithImage);

                reader.readAsDataURL(file);
            } else if (
                file.type === "application/pdf" ||
                file.type === "text/plain" ||
                file.type === "text/markdown"
            ) {
                // Set PDF file without preview
                setSelectedFile({
                    file,
                    src: "",
                    fileType: FILE_TYPE_MAP[file.type]
                });
                setLoadMessages(LoadMessagesWithPDF);
            }
        }
    };

    const clearFile = () => {
        setSelectedFile({ file: null, src: "", fileType: null });
        fileInputRef.current!.value = "";
    };

    const queryClient = useQueryClient();
    const getViewerContent = async (message: Message) => {
        if (message.metaData?.fileType === "image") {
            let signedUrl;
            if (message.metaData.fileUrl?.startsWith("https://")) {
                const urlArray = message.metaData.fileUrl.split("/");
                const imageKey = urlArray[urlArray.length - 1];
                signedUrl = await queryClient.fetchQuery({
                    queryKey: ["getSignedUrl", imageKey],
                    queryFn: () => getSignedUrl("image", imageKey),
                    staleTime: 300000
                });
            } else {
                signedUrl = message.metaData.fileUrl;
            }
            return (
                <img
                    src={signedUrl}
                    alt="Preview"
                    className="w-full h-auto rounded-md"
                />
            );
        } else if (message.metaData.isGherkinScriptQuery) {
            return (
                <Markdown className="text-black">
                    {"```gherkin\n" +
                        message.metaData.content.replace(/\\n/g, "\n") +
                        "\n```"}
                </Markdown>
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
        if (message.metaData.isGherkinScriptQuery) {
            message.metaData.content = message.metaData?.content;
        }

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
        if (!existinguuid) return;
        if (!input && !selectedFile.file) return;
        if (selectedFile.file) {
            setShowLoader(true);
            setIsLoader(true);
        }

        if (input === "generate blueprint") {
            setShowLoader(true);
            setIsLoader(true);
            setLoadMessages(LoadMessagesFoeInput);
        }
        setMessages((prev) => [
            ...prev,
            {
                text: input,
                isUser: true,
                isSystemQuery: false,
                metaData: {
                    fileUrl: selectedFile.src,
                    fileType: selectedFile.fileType ?? undefined,
                    fileName: selectedFile.file?.name
                }
            }
        ]);
        sendChatMutaion({
            query: input || "Process this file",
            uuid: existinguuid,
            currentState: diagramComponents,
            file: selectedFile.file ?? undefined
        });
        setInput("");
        clearFile();
    };

    const [isLoader, setIsLoader] = useState(false);
    const [isLoaderTimePassed, setIsLoaderTimePassed] = useState(false);

    useEffect(() => {
        if (isLoaderTimePassed) {
            setIsLoader(isLoading);
            setShowLoader(isLoading);
            setIsLoaderTimePassed(isLoading);
        }
    }, [isLoading, isLoaderTimePassed]);

    const loadDiagram = (content: DiagramComponent[]) => {
        handleLoadDiagramFromJSON(content);
        addHistory(content);
    };
    const handleLoading = (loading: boolean) => {
        setShowLoader(loading);
        setIsLoader(loading);
        setLoadMessages(LoadMessagesWithImage);
    };
    return (
        <div className="px-4 pt-3 h-full flex flex-col gap-4">
            {/* <div className="flex justify-between">
                <div className="flex gap-2 justify-center items-center">
                    <BreezeIcon />
                    <p className="text-xl font-medium">Breeze.AI</p>
                </div>
            </div> */}
            {/* chat container */}
            <div
                className={`flex-grow overflow-x-hidden flex flex-col gap-2 ${CUSTOM_SCROLLBAR}`}
            >
                {messages.map((message: Message, index) => (
                    <div
                        key={index}
                        className={`flex flex-col gap-2 ${
                            message.isUser ? "items-end" : "items-start"
                        }`}
                    >
                        {console.log(
                            "message.metaData.fileType",
                            message.metaData.fileType
                        )}
                        {/* PDF or image Message */}
                        {message.metaData.fileType && (
                            <>
                                <img
                                    src={
                                        message.metaData.fileType === "image"
                                            ? image
                                            : message.metaData.fileType ===
                                                  "txt" ||
                                              message.metaData.fileType ===
                                                  "text"
                                            ? text
                                            : pdf
                                    }
                                    alt={message.metaData.fileName}
                                    className=" object-contain rounded bg-white  h-8 w-8"
                                />
                                <span className="text-xs  truncate max-w-52 text-center">
                                    {message.metaData.fileUrl?.split("/").pop()}
                                </span>
                            </>
                        )}

                        {/* Text Message */}
                        {message.text && (
                            <div
                                className={` px-4 py-2 rounded-lg break-words ${
                                    message.isUser
                                        ? "bg-customLightGray max-w-xs"
                                        : ""
                                }`}
                            >
                                <Markdown>{message.text}</Markdown>
                            </div>
                        )}

                        {/* JSON Response */}
                        {message.metaData.content && (
                            <div className="flex items-center gap-2">
                                <div
                                    className="max-w-xs px-2 py-1 bg-customGray2 cursor-pointer rounded-xl flex items-center"
                                    onClick={() => openViewerPopup(message)}
                                >
                                    <div className="text-lightGray2 text-xs flex items-center gap-1">
                                        <span className="h-4 w-4">
                                            <UnifiedModelIcon />
                                        </span>
                                        {message.metaData?.isGherkinScriptQuery
                                            ? "View Gherkin Script"
                                            : "View Unified Model"}
                                    </div>
                                </div>
                                {!message.metaData.isGherkinScriptQuery && (
                                    <Eye
                                        size={16}
                                        className="cursor-pointer"
                                        onClick={() => {
                                            loadDiagram(
                                                message.metaData.content
                                            );
                                        }}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                ))}
                {isLoading && (
                    <div
                        className={`max-w-xs px-4 py-2 rounded-lg break-words bg-customLightGray`}
                    >
                        <span className="animate-pulse">
                            Breeze.AI processing
                        </span>
                        <span className="before:content-['.'] before:animate-dots" />
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            {/* input container */}
            <form onSubmit={handleSend} ref={formRef} className="w-full">
                <div className="relative flex max-h-60 w-full grow items-center overflow-hidden bg-[#1A1A1A] border-customLightGray px-8 sm:rounded-md sm:border sm:p-1 sm:pr-20">
                    {/* Image on the left side */}
                    {selectedFile.file && (
                        <div className="relative w-12 h-12 flex-shrink-0">
                            {selectedFile.fileType === "image" ? (
                                <img
                                    src={selectedFile.src}
                                    alt="Selected"
                                    className="w-full h-full object-cover rounded-sm border"
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 rounded-sm border">
                                    <FileText className="w-5 h-5 text-gray-700" />
                                    <span className="text-[10px] text-gray-800 truncate max-w-[40px] text-center">
                                        {selectedFile.file?.name}
                                    </span>
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
                        placeholder="Reply to Breeze.AI"
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
                        <div className="h-6">
                            <AttachmentMenu
                                dropdownControls={{
                                    isDropdownOpen,
                                    setIsDropdownOpen
                                }}
                                handleUploadBoxOpen={() =>
                                    fileInputRef.current?.click()
                                }
                                handleLoadDiagramFromJSON={
                                    handleLoadDiagramFromJSON
                                }
                                handleLoading={handleLoading}
                            />

                            <input
                                type="file"
                                accept="image/*,.pdf,.md,.txt,.md"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={handleFileSelect}
                            />
                        </div>

                        <button
                            className="h-6 mt-2 disabled:opacity-50"
                            type="submit"
                            disabled={
                                (!input && !selectedFile.file) || isLoading
                            }
                        >
                            <SendIcon />
                            <span className="sr-only">Send message</span>
                        </button>
                    </div>
                </div>
            </form>

            {/* viewer Popup */}
            <ViewerPopup
                isOpen={isViewerOpen}
                onClose={closeViewerPopup}
                content={viewerContent || ""}
            />
            <GitRepoDialog
                isOpen={isGitRepoDialoagOpen}
                onClose={() => setIsGitRepoDialoagOpen(false)}
            />
            {showLoader && (
                <ProgressPopup
                    isOpen={isLoader}
                    onClose={() => {
                        setIsLoader(isLoading);
                        setIsLoaderTimePassed(true);
                    }}
                    messages={loadMessages}
                    duration={14}
                />
            )}
        </div>
    );
};
export default ChatPanel;
