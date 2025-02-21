import { DiagramComponent, DiagramInfo, User } from "@/Types";
import { Copy, Edit, MoreVertical, SquarePlus, Trash } from "lucide-react";
import SaveNewDiagram from "./SaveNewDiagram";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
    deleteDiagram,
    getDiagrams,
    saveDiagram,
    updateDiagram
} from "@/services/diagrams";
import { calculateSVGBoundingBox } from "@/lib/svgUtils";
import SVGPreview from "@/components/ui/SVGPreview";
import {
    DropdownMenu,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuContent
} from "@/components/ui/DropDownMenu";
import { Button } from "@/components/ui/Button";
import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/Dialog";
import { AlertDialog } from "@radix-ui/react-alert-dialog";
import {
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/AlertDialog";
// import { v4 as uuidv4 } from "uuid";

type Mode = "save" | "clone" | "edit_details" | "delete";
export default function DiagramPanel({
    currentDiagramInfo,
    setCurrentDiagramInfo,
    diagramComponents,
    composedSVG,
    canvasSize,
    handleLoadDiagramFromJSON,
    autoSaveState,
    user
}: {
    currentDiagramInfo: DiagramInfo | null;
    setCurrentDiagramInfo: (diagramInfo: DiagramInfo | null) => void;
    diagramComponents: DiagramComponent[];
    composedSVG: string;
    canvasSize: { width: number; height: number };
    handleLoadDiagramFromJSON: (
        loadedComponents: DiagramComponent[]
    ) => Promise<void>;
    autoSaveState: [
        autoSaveMode: boolean,
        setAutoSaveMode: (vlaue: boolean) => void
    ];
    user: User | undefined;
}) {
    const [isMyDiagramLoading, setIsDiagramLoading] = useState(false);
    const [error, setError] = useState({ isError: false, message: "" });
    const [autoSaveMode, setAutoSaveMode] = autoSaveState;
    const {
        data: diagrams,
        refetch,
        isLoading
    } = useQuery({
        queryKey: ["saved_diagrams"],
        queryFn: getDiagrams
    });

    const { mutate: deleteMutation, isPending: isDeletionPending } =
        useMutation({
            mutationFn: deleteDiagram,
            onSettled: () => {
                refetch();
                setIsOpen(false);
            }
        });
    const { mutate, isPending } = useMutation({
        mutationFn: saveDiagram,
        onSettled: (res, error) => {
            if (res?._id) {
                refetch();
                handleLoadDiagram(res);
                setIsOpen(false);
                setError({ isError: false, message: "" });
            }
            if (error) {
                setError({ isError: true, message: error.message });
            }
        }
    });

    const { mutate: updateElement, isPending: isUpdatePending } = useMutation({
        mutationFn: updateDiagram,
        onSettled: (res, error) => {
            if (res?._id && currentDiagramInfo?._id === res._id) {
                refetch();
                handleLoadDiagram(res);
                setIsOpen(false);
                setError({ isError: false, message: "" });
            }
            if (error) {
                setError({ isError: true, message: error.message });
            }
        }
    });
    const [isOpen, setIsOpen] = useState(false);
    const [mode, setMode] = useState<Mode>("save");
    const [tempDiagramInfo, setTempDiagramInfo] = useState<DiagramInfo | null>(
        null
    );
    const getPendingState: Record<Mode, boolean> = {
        save: isPending,
        delete: isDeletionPending,
        edit_details: isUpdatePending,
        clone: isPending
    };
    const handleDiagramSave = (name: string, description: string) => {
        const boundingBox = calculateSVGBoundingBox(
            composedSVG,
            canvasSize
        ) || {
            x: 0,
            y: 0,
            width: "100%",
            height: "100%"
        };

        const svgContent: string = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="${boundingBox.x} ${boundingBox.y} ${boundingBox.width} ${boundingBox.height}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        ${composedSVG}
    </svg>
`;
        mutate({ name, description, diagramComponents, svgContent });
    };
    const handleDiagramCloneAndEdit = (name: string, description: string) => {
        const payload = {
            name,
            description,
            diagramComponents: tempDiagramInfo?.diagramComponents ?? [],
            svgContent: tempDiagramInfo?.metadata?.svgContent ?? ""
        };
        if (mode === "clone") mutate(payload);
        if (mode === "edit_details")
            updateElement({ ...payload, id: tempDiagramInfo?._id ?? "" });
    };

    const handleSubmitAccordingToMode = (name: string, description: string) => {
        if (mode === "save") handleDiagramSave(name, description);
        if (mode === "clone" || mode === "edit_details")
            handleDiagramCloneAndEdit(name, description);
        if (mode === "delete") handleDeleteDiagram();
    };

    const handleDialogOperations = (element: DiagramInfo, mode: Mode) => {
        setTempDiagramInfo({
            ...element,
            name: mode === "clone" ? element.name + " clone" : element.name
        });
        setMode(mode);
        setIsOpen(true);
    };

    const handleDeleteDiagram = async () => {
        if (!tempDiagramInfo?._id) return;
        if (currentDiagramInfo?._id === tempDiagramInfo._id) {
            await handleLoadDiagramFromJSON([]);
            setCurrentDiagramInfo(null);
        }
        deleteMutation(tempDiagramInfo?._id);
    };

    const handleLoadDiagram = async (element: DiagramInfo) => {
        if (isMyDiagramLoading) return;
        // const currentUrl = new URL(window.location.href);
        // currentUrl.searchParams.delete('uuid')
        // currentUrl.searchParams.append('uuid', element.metadata?.uuid ||  uuidv4() );
        // window.history.pushState({}, '', currentUrl);
        if (currentDiagramInfo?._id !== element._id) setIsDiagramLoading(true);
        await handleLoadDiagramFromJSON(element.diagramComponents);
        setIsDiagramLoading(false);
        if (element._id === currentDiagramInfo?._id) return;
        setCurrentDiagramInfo(element);
        setAutoSaveMode(user?._id === element.author);
    };

    const DiagramDetails = ({ result }: { result: DiagramInfo }) => {
        const isMyDiagram = user?._id === result.author;

        return (
            <li
                className={`flex rounded-md items-center  mx-4 my-3 
                hover:bg-customLightGray cursor-pointer
                ${
                    result._id === currentDiagramInfo?._id
                        ? "bg-customLightGray"
                        : ""
                }`}
                onClick={() => handleLoadDiagram(result)}
            >
                <div className={`flex flex-grow items-center gap-4`}>
                    <div className="w-[76px] h-[76px] flex-shrink-0">
                        <SVGPreview
                            svgContent={result.metadata?.svgContent ?? ""}
                            className="w-full h-full object-cover bg-white"
                        />
                    </div>
                    <div className="flex-1">
                        <div className="text-white font-semibold ">
                            {result.name}
                        </div>
                        <p className="text-gray-400 text-xs">
                            {result.metadata?.description}
                        </p>
                        <span
                            className={`mt-2 inline-block text-xs font-medium ${"text-blue-400"}`}
                        >
                            {result.version}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-1 pr-4">
                    <div>
                        {isMyDiagram &&
                            autoSaveMode &&
                            currentDiagramInfo?._id === result._id && (
                                <Edit size={16} />
                            )}
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreVertical className="w-5 h-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-32">
                            {isMyDiagram && (
                                <DropdownMenuItem
                                    onClick={(e) => {
                                        e.stopPropagation();

                                        handleDialogOperations(
                                            result,
                                            "edit_details"
                                        );
                                    }}
                                    className="flex items-center gap-2 cursor-pointer"
                                >
                                    <Edit size={16} />
                                    Edit Details
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDialogOperations(result, "clone");
                                }}
                                className="flex items-center gap-2 cursor-pointer"
                            >
                                <Copy size={16} />
                                Clone
                            </DropdownMenuItem>
                            {isMyDiagram && (
                                <DropdownMenuItem
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDialogOperations(
                                            result,
                                            "delete"
                                        );
                                    }}
                                    className="flex items-center gap-2 text-red-500 cursor-pointer"
                                >
                                    <Trash size={16} />
                                    Delete
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </li>
        );
    };

    const LoaderSearchSkeleton = () => (
        <ul>
            {Array.from({ length: 10 }).map((_, index) => (
                <li
                    key={index}
                    className="animate-pulse flex items-center p-4  rounded-md gap-4 hover:bg-customLightGray cursor-pointer"
                >
                    <div className="w-[76px] h-[76px]  bg-gray-300 rounded-md flex-shrink-0">
                        <SVGPreview
                            className="w-full h-full object-cover bg-white"
                            svgContent=""
                        />
                    </div>
                    <div className="flex flex-col gap-1 flex-grow">
                        <div className="h-5 bg-gray-300 rounded-md my-1"></div>
                        <div className="h-2 bg-gray-300 rounded-md w-1/2"></div>
                        <div className="h-1 bg-gray-300 rounded-md w-1/3"></div>
                    </div>
                </li>
            ))}
        </ul>
    );
    const closeAlert = () => setError({ isError: false, message: "" });
    return (
        <div className="flex flex-col h-full">
            <div className="flex-grow overflow-hidden flex flex-col">
                <div className="flex justify-between items-center px-4 py-3">
                    <h1 className=" text-md font-medium bg-customGray text-white">
                        Diagrams
                    </h1>
                    <button
                        onClick={() => {
                            setTempDiagramInfo(null);
                            setMode("save");

                            setIsOpen(true);
                        }}
                        className="hover:bg-customLightGray rounded"
                    >
                        <SquarePlus />
                    </button>
                </div>
                <div className="flex-grow overflow-auto p-4 ">
                    {isLoading ? (
                        <LoaderSearchSkeleton />
                    ) : (
                        diagrams?.data.map((item) => (
                            <DiagramDetails key={item._id} result={item} />
                        ))
                    )}
                </div>
            </div>
            <Dialog open={isMyDiagramLoading}>
                <DialogContent className="bg-gray-800 text-white">
                    <DialogHeader>
                        <DialogTitle>Loading Diagram</DialogTitle>
                        <DialogDescription className="text-gray-300 animate-ping">
                            loading...
                        </DialogDescription>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
            <AlertDialog open={error.isError} onOpenChange={closeAlert}>
                <AlertDialogContent className="bg-gray-800 text-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Error</AlertDialogTitle>
                        <AlertDialogDescription>
                            {error.message}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={closeAlert}>
                            Cancel
                        </AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <SaveNewDiagram
                mode={mode}
                isOpen={isOpen}
                isPending={getPendingState[mode]}
                onClose={() => setIsOpen(false)}
                onSubmit={handleSubmitAccordingToMode}
                diagramInfo={tempDiagramInfo}
            />
        </div>
    );
}
