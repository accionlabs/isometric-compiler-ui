// @/ImprovedLayout.tsx

import React, { useState, useCallback, useEffect, useRef } from "react";
import { Node } from "@xyflow/react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "./components/ui/Dialog";
import { Button } from "./components/ui/Button";
import FlowSVGDisplay from "./FlowSVGDIsplay";
import ShapesPanel from "./panels/ShapesPanel";
import CompositionPanel from "./panels/CompositionPanel";
import SettingsPanel from "./panels/SettingsPanel";
import AttachmentOptionsPanel from "./panels/AttachmentOptionsPanel";
import {
    DiagramComponent,
    Shape,
    Component,
    CanvasSettings,
    Category,
    UnifiedElement
} from "./Types";
import ChatPanel from "./panels/ChatPanel";
import { ChatProvider } from "./hooks/useChatProvider";
import { StorageType } from "./lib/fileOperations";
import SaveDiagramDialog from "@/panels/SaveDiagramDialog";
import SaveComponentDialog from "@/panels/SaveComponentDialog";
import SettingsDialog from "@/panels/SettingsDialog";
import LibraryManagerDialog from "@/panels/LibraryManagerDialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/DropDownMenu";
import { ChevronDown, Redo, Undo } from "lucide-react";
import { MenuIcon } from "./components/ui/IconGroup";
import { useKeycloak } from "@react-keycloak/web";
import CustomTooltip from "./components/flow/CustomToolTip";

type PanelType = "shapes" | "composition" | "chat";

const panels: Array<{ id: PanelType; label: string }> = [
    { id: "shapes", label: "Shapes" },
    { id: "composition", label: "Composition" },
    { id: "chat", label: "AI Model" }
];

interface ImprovedLayoutProps {
    svgLibrary: Shape[];
    shapesByCategory: Shape[];
    categories: Category[];
    searchQuery: string;
    searchedData:
        | {
              data: UnifiedElement[];
              total: number;
          }
        | undefined;
    setSearchQuery: (newLibrary: string) => void;
    activeCategory: string;
    activeLibrary: string;
    diagramComponents: DiagramComponent[];
    components: Component[];
    isCopied: boolean;
    canvasSize: { width: number; height: number };
    onCategoryChange: (id: string) => void;
    onSetCanvasSize: (size: { width: number; height: number }) => void;
    settings: CanvasSettings | null;
    onSetCanvasSettings: (settings: CanvasSettings) => void;
    composedSVG: string;
    onAdd3DShape: (shapeName: string) => void;
    onAdd2DShape: (shapeName: string, attachTo: string) => void;
    onAddComponent: (component: Component) => void;
    onDeleteComponent: (componentId: string) => void;
    onRemove3DShape: (id: string) => void;
    onRemove2DShape: (parentId: string, shapeIndex: number) => void;
    selected3DShape: string | null;
    onSelect3DShape: (id: string | null) => void;
    selectedPosition: string;
    onSelectedPosition: (id: string) => void;
    selectedAttachmentPoint: string | null;
    onSelectedAttachmentPoint: (id: string | null) => void;
    onCut3DShape: (id: string) => void;
    onCopy3DShape: (id: string) => void;
    onCancelCut3DShape: (id: string) => void;
    onPaste3DShape: (id: string) => void;
    onUpdateSvgLibrary: (newLibrary: Shape[]) => void;
    onDownloadSVG: (type: "svg" | "png") => Promise<void>;
    fileName: string;
    setFileName: (name: string) => void;
    availableAttachmentPoints: string[];
    errorMessage: string | null;
    setErrorMessage: (message: string | null) => void;
    onSaveDiagram: (fileName: string, onComplete: () => void) => Promise<void>;
    onLoadDiagram: (file?: File) => Promise<void>;
    handleLoadDiagramFromJSON: (loadedComponents: DiagramComponent[]) => void;
    folderPath: string;
    setFolderPath: (path: string) => void;
    showAttachmentPoints: boolean;
    setShowAttachmentPoints: (show: boolean) => void;
    onLibraryChange: (libraryId: string) => void;
    onUpdateMetadata: (
        id: string,
        type: string | undefined,
        metadata: any
    ) => void;
    storageType: StorageType;
    onStorageTypeChange: (type: StorageType) => void;
    onSaveAsComponent: (
        name: string,
        description: string,
        category: string
    ) => void;
    isSaveDiagramDialogOpen: boolean;
    setIsSaveDiagramDialogOpen: (open: boolean) => void;
    isDataLoading: {
        isCategoryLoading: boolean;
        isSearchLoading: boolean;
        isShapesLoading: boolean;
    };
    currentIndex: number;
    history: DiagramComponent[][];
    addHistory: (diagramComponent: DiagramComponent[]) => void;
    handleUndo: () => void;
    handleRedo: () => void;
}

const ImprovedLayout: React.FC<ImprovedLayoutProps> = ({
    svgLibrary,
    shapesByCategory,
    categories,
    searchQuery,
    searchedData,
    setSearchQuery,
    activeCategory,
    onCategoryChange,
    activeLibrary,
    onLibraryChange,
    diagramComponents,
    components,
    selected3DShape,
    canvasSize,
    composedSVG,
    onAdd3DShape,
    onAddComponent,
    onDeleteComponent,
    onAdd2DShape,
    onRemove3DShape,
    onRemove2DShape,
    onCut3DShape,
    onCopy3DShape,
    isCopied,
    onCancelCut3DShape,
    onPaste3DShape,
    onSelect3DShape,
    selectedPosition,
    onSelectedPosition,
    selectedAttachmentPoint,
    onSelectedAttachmentPoint,
    onSetCanvasSize,
    settings,
    onSetCanvasSettings,
    onUpdateSvgLibrary,
    onDownloadSVG,
    fileName,
    setFileName,
    availableAttachmentPoints,
    errorMessage,
    setErrorMessage,
    onSaveDiagram,
    handleLoadDiagramFromJSON,
    onLoadDiagram,
    folderPath,
    setFolderPath,
    showAttachmentPoints,
    setShowAttachmentPoints,
    onUpdateMetadata,
    storageType,
    onStorageTypeChange,
    onSaveAsComponent,
    isSaveDiagramDialogOpen,
    setIsSaveDiagramDialogOpen,
    isDataLoading,
    currentIndex,
    history,
    addHistory,
    handleUndo,
    handleRedo
}) => {
    const params = new URLSearchParams(window.location.search);
    const isReadModeEnabled = params.get("mode") === "read";

    const [activePanel, setActivePanel] = useState<PanelType>("shapes");

    const [isLoadingDialogOpen, setIsLoadingDialogOpen] = useState(false);
    const [isSaveLoadDialogOpen, setIsSaveLoadDialogOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isSaveComponentDialogOpen, setIsSaveComponentDialogOpen] =
        useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
    const [isLibraryDialogOpen, setIsLibraryDialogOpen] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState<{
        currentFile: string;
        loadedFiles: number;
        totalFiles: number;
    } | null>(null);
    const [saveLoadMessage, setSaveLoadMessage] = useState<string | null>(null);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            try {
                //message origin later can be handled by array of origins which we can fetch from db
                if (event.origin === "https://assistant.accionbreeze.com") {
                    const { diagramComponents = [] } = event.data;
                    handleLoadDiagramFromJSON(diagramComponents);
                }
            } catch (error) {
                console.error("Error processing message event: ", error);
            }
        };
        // Add event listener for message events
        window.addEventListener("message", handleMessage);

        // Clean up the event listener on component unmount
        return () => {
            window.removeEventListener("message", handleMessage);
        };
    }, []);

    const handleSelect3DShape = useCallback(
        (id: string | null) => {
            onSelect3DShape(id);
        },
        [onSelect3DShape]
    );

    const handleSelectedPosition = useCallback(
        (position: string | null) => {
            if (position) {
                //console.log(`Improved Layout: position ${position}`);
                onSelectedPosition(position);
            }
        },
        [onSelectedPosition, selectedPosition]
    );

    const handleSelectedAttachmentPoint = useCallback(
        (point: string | null) => {
            onSelectedAttachmentPoint(point);
        },
        [onSelectedAttachmentPoint]
    );

    const handleAdd3DShape = useCallback(
        (shapeName: string) => {
            onAdd3DShape(shapeName);
        },
        [onAdd3DShape]
    );

    const handleCopy3DShape = useCallback(
        (id: string) => {
            onCopy3DShape(id);
        },
        [onCopy3DShape]
    );

    const handlePaste3DShape = useCallback(
        (id: string) => {
            onPaste3DShape(id);
        },
        [onPaste3DShape]
    );

    const handleLoadDiagram = useCallback(
        async (file?: File) => {
            setIsSaveLoadDialogOpen(true);
            setSaveLoadMessage("Loading diagram...");
            try {
                await onLoadDiagram(file);
                setSaveLoadMessage("Diagram loaded successfully!");
            } catch (error) {
                setSaveLoadMessage(
                    error instanceof Error
                        ? error.message
                        : "Failed to load diagram. Please check the file and try again."
                );
            } finally {
                setTimeout(() => setIsSaveLoadDialogOpen(false), 5000);
            }
        },
        [onLoadDiagram]
    );

    const handleMenuSelect = React.useCallback(
        (action: () => void | Promise<void>) => async (e: Event) => {
            e.preventDefault();
            // Close the dropdown immediately
            setIsDropdownOpen(false);

            if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
            }
            // Wait a tick for the dropdown to close
            await new Promise((resolve) => setTimeout(resolve, 0));
            // Then execute the action
            await action();
        },
        []
    );

    const handleOpenSaveComponentDialog = useCallback(() => {
        setIsDropdownOpen(false);
        setIsSaveComponentDialogOpen(true);
    }, []);

    const handleSetFileName = useCallback(
        (name: string) => {
            setFileName(name);
        },
        [setFileName]
    );

    const handleFileSelect = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onLoadDiagram(file);
            event.target.value = "";
        }
    };

    const handleOpenSaveDialog = () => {
        setIsSaveDiagramDialogOpen(true);
    };

    const handleSaveDiagram = async () => {
        console.log("CompositionPanel handleSaveDiagram started:", {
            fileName
        });
        if (fileName.trim()) {
            console.log("Setting filename");
            setFileName(fileName);
        }
        try {
            setIsSaveDiagramDialogOpen(false);
            console.log("Starting onSaveDiagram");
            await onSaveDiagram(fileName, () => {
                console.log("Save completed, closing dialog");
            });
            console.log("onSaveDiagram completed");
        } catch (error) {
            console.error("Error in handleSaveDiagram:", error);
        }
    };

    const { keycloak } = useKeycloak();

    return (
        <ChatProvider>
            <div className="flex flex-row h-screen w-screen  text-white">
                {/* Left side control panels */}
                {!isReadModeEnabled && (
                    <div className="flex flex-col border-r bg-customGray border-gray-700 w-1/3">
                        {/* Tab buttons */}
                        <div className="flex flex-row px-2 py-2 space-x-3 border-t-2 border-gray-700 items-center">
                            <DropdownMenu
                                open={isDropdownOpen}
                                onOpenChange={setIsDropdownOpen}
                            >
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="p-2 gap-1"
                                    >
                                        <MenuIcon />
                                        <ChevronDown />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    className="w-[200px] bg-customGray"
                                >
                                    <DropdownMenuGroup>
                                        <DropdownMenuItem
                                            onSelect={handleMenuSelect(
                                                handleFileSelect
                                            )}
                                        >
                                            Load Diagram
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onSelect={handleMenuSelect(
                                                handleOpenSaveDialog
                                            )}
                                        >
                                            Save Diagram
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onSelect={handleMenuSelect(
                                                handleOpenSaveComponentDialog
                                            )}
                                            disabled={
                                                diagramComponents.length === 0
                                            }
                                        >
                                            Save as Component
                                        </DropdownMenuItem>
                                    </DropdownMenuGroup>
                                    <DropdownMenuSeparator className="bg-customLightGray" />
                                    <DropdownMenuGroup>
                                        <DropdownMenuItem
                                            onSelect={handleMenuSelect(() =>
                                                onDownloadSVG("svg")
                                            )}
                                        >
                                            Download SVG
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onSelect={handleMenuSelect(() =>
                                                onDownloadSVG("png")
                                            )}
                                        >
                                            Download PNG
                                        </DropdownMenuItem>
                                    </DropdownMenuGroup>
                                    <DropdownMenuSeparator className="bg-customLightGray" />
                                    <DropdownMenuItem
                                        onSelect={handleMenuSelect(() =>
                                            setIsSettingsDialogOpen(true)
                                        )}
                                    >
                                        Display Settings
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-customLightGray" />
                                    <DropdownMenuItem
                                        onSelect={handleMenuSelect(() =>
                                            keycloak.logout({
                                                logoutMethod: "POST"
                                            })
                                        )}
                                    >
                                        Logout
                                    </DropdownMenuItem>
                                    {/* <DropdownMenuItem
                                        onSelect={handleMenuSelect(() =>
                                            setIsLibraryDialogOpen(true)
                                        )}
                                    >
                                        Library Settings
                                    </DropdownMenuItem> */}
                                </DropdownMenuContent>
                            </DropdownMenu>
                            {panels.map((panel) => (
                                <button
                                    key={panel.id}
                                    onClick={() => setActivePanel(panel.id)}
                                    className={`relative rounded px-2 py-1 
            ${
                activePanel === panel.id
                    ? "bg-customLightGray"
                    : "bg-customGray"
            }`}
                                >
                                    {/* Hidden bold reference text */}
                                    <span
                                        aria-hidden="true"
                                        className="block text-sm font-bold invisible whitespace-nowrap"
                                    >
                                        {panel.label}
                                    </span>

                                    {/* Visible text layer */}
                                    <span
                                        className={`absolute inset-0 flex items-center justify-center text-sm
              ${activePanel === panel.id ? "font-bold" : "font-normal"}`}
                                    >
                                        {panel.label}
                                    </span>
                                </button>
                            ))}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".json"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </div>

                        {/* Panel content */}
                        <div className="flex-grow overflow-hidden">
                            {activePanel === "shapes" && (
                                <ShapesPanel
                                    svgLibrary={svgLibrary}
                                    shapesByCategory={shapesByCategory}
                                    categories={categories}
                                    searchQuery={searchQuery}
                                    searchedData={searchedData}
                                    setSearchQuery={setSearchQuery}
                                    activeCategory={activeCategory}
                                    onCategoryChange={onCategoryChange}
                                    canvasSize={canvasSize}
                                    activeLibrary={activeLibrary}
                                    onAdd3DShape={handleAdd3DShape}
                                    onAddComponent={onAddComponent}
                                    onDeleteComponent={onDeleteComponent}
                                    onAdd2DShape={onAdd2DShape}
                                    selected3DShape={selected3DShape}
                                    diagramComponents={diagramComponents}
                                    components={components}
                                    isDataLoading={isDataLoading}
                                />
                            )}
                            {activePanel === "composition" && (
                                <CompositionPanel
                                    diagramComponents={diagramComponents}
                                    canvasSize={canvasSize}
                                    isCopied={isCopied}
                                    svgLibrary={svgLibrary}
                                    onRemove3DShape={onRemove3DShape}
                                    onRemove2DShape={onRemove2DShape}
                                    onSelect3DShape={onSelect3DShape}
                                    selected3DShape={selected3DShape}
                                    onCut3DShape={onCut3DShape}
                                    onCopy3DShape={handleCopy3DShape}
                                    onCancelCut3DShape={onCancelCut3DShape}
                                    onPaste3DShape={handlePaste3DShape}
                                    onUpdateMetadata={onUpdateMetadata}
                                />
                            )}
                            {activePanel === "chat" && (
                                <ChatPanel
                                    diagramComponents={diagramComponents}
                                    addHistory={addHistory}
                                    handleLoadDiagramFromJSON={
                                        handleLoadDiagramFromJSON
                                    }
                                />
                            )}
                        </div>
                    </div>
                )}
                <div className="flex-grow flex flex-col  relative">
                    {/* Heading */}
                    <div className="flex h-14 justify-between items-center bg-customGray p-4 z-10">
                        <h2 className="text-xl  font-semibold ">
                            Composed SVG
                        </h2>
                        <div className="flex gap-4">
                            <CustomTooltip
                                action={
                                    <button
                                        disabled={currentIndex === 0}
                                        onClick={handleUndo}
                                        className="hover:bg-customLightGray p-2 rounded disabled:cursor-not-allowed disabled:opacity-50"
                                        title="Undo"
                                    >
                                        <Undo />
                                    </button>
                                }
                                header="Undo"
                                side="top"
                            />
                            <CustomTooltip
                                action={
                                    <button
                                        disabled={
                                            currentIndex === history.length - 1
                                        }
                                        onClick={handleRedo}
                                        className="hover:bg-customLightGray p-2 rounded disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <Redo />
                                    </button>
                                }
                                header="Redo"
                                side="top"
                            />
                        </div>
                    </div>

                    {/* Relative container for SVG Display and Attachment Options Panel */}
                    <div className="relative flex-grow overflow-hidden">
                        {/* SVG Display */}
                        <FlowSVGDisplay
                            svgContent={composedSVG}
                            selected3DShape={selected3DShape}
                            diagramComponents={diagramComponents}
                            isCopied={isCopied}
                            onSelect3DShape={handleSelect3DShape}
                            canvasSize={canvasSize}
                            settings={settings}
                            setSelectedPosition={handleSelectedPosition}
                            setSelectedAttachmentPoint={
                                handleSelectedAttachmentPoint
                            }
                        />

                        {/* Attachment Options Panel - slides behind the heading */}
                        {!isReadModeEnabled && (
                            <div
                                className={`absolute top-0 left-0 right-0 transition-transform duration-300 ease-in-out transform ${
                                    selected3DShape
                                        ? "translate-y-0"
                                        : "-translate-y-full"
                                }`}
                                style={{ top: "-1px" }} // Slight overlap to prevent gap
                            >
                                <AttachmentOptionsPanel
                                    selectedPosition={selectedPosition}
                                    setSelectedPosition={handleSelectedPosition}
                                    selectedAttachmentPoint={
                                        selectedAttachmentPoint
                                    }
                                    setSelectedAttachmentPoint={
                                        handleSelectedAttachmentPoint
                                    }
                                    availableAttachmentPoints={
                                        availableAttachmentPoints
                                    }
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Google Drive Folder URL Dialog */}
                <Dialog
                    open={isLoadingDialogOpen}
                    onOpenChange={setIsLoadingDialogOpen}
                >
                    <DialogContent className="bg-gray-800 text-white">
                        <DialogHeader>
                            <DialogTitle className="text-white">
                                Loading Shapes from Google Drive
                            </DialogTitle>
                            <DialogDescription className="text-gray-300">
                                Please wait while we load the shapes from your
                                Google Drive.
                            </DialogDescription>
                        </DialogHeader>
                        {errorMessage && (
                            <div className="mt-4">
                                <p className="text-red-400">{errorMessage}</p>
                                <Button
                                    onClick={() =>
                                        setIsLoadingDialogOpen(false)
                                    }
                                    className="mt-2"
                                >
                                    Close
                                </Button>
                            </div>
                        )}
                        {loadingProgress && (
                            <div className="mt-4 text-white">
                                <p>Loading: {loadingProgress.currentFile}</p>
                                <p>
                                    Progress: {loadingProgress.loadedFiles} /{" "}
                                    {loadingProgress.totalFiles}
                                </p>
                                <div className="w-full bg-gray-700 rounded-full h-2.5 mt-2">
                                    <div
                                        className="bg-blue-500 h-2.5 rounded-full"
                                        style={{
                                            width: `${
                                                (loadingProgress.loadedFiles /
                                                    loadingProgress.totalFiles) *
                                                100
                                            }%`
                                        }}
                                    ></div>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                <SettingsDialog
                    isOpen={isSettingsDialogOpen}
                    onClose={() => setIsSettingsDialogOpen(false)}
                    settings={settings}
                    canvasSize={canvasSize}
                    onSetCanvasSize={onSetCanvasSize}
                    onSetCanvasSettings={onSetCanvasSettings}
                    showAttachmentPoints={showAttachmentPoints}
                    setShowAttachmentPoints={setShowAttachmentPoints}
                />
                <LibraryManagerDialog
                    isOpen={isLibraryDialogOpen}
                    onClose={() => setIsLibraryDialogOpen(false)}
                    activeLibrary={activeLibrary}
                    onLibraryChange={onLibraryChange}
                    onUpdateShapes={onUpdateSvgLibrary}
                />
                <SaveDiagramDialog
                    isOpen={isSaveDiagramDialogOpen}
                    onClose={() => setIsSaveDiagramDialogOpen(false)}
                    onSave={handleSaveDiagram}
                    fileName={fileName}
                    setFileName={handleSetFileName}
                />
                <SaveComponentDialog
                    isOpen={isSaveComponentDialogOpen}
                    onClose={() => setIsSaveComponentDialogOpen(false)}
                    onSave={onSaveAsComponent}
                />

                {/* Save/Load Diagram Dialog */}
                <Dialog
                    open={isSaveLoadDialogOpen}
                    onOpenChange={setIsSaveLoadDialogOpen}
                >
                    <DialogContent className="bg-gray-800 text-white">
                        <DialogHeader>
                            <DialogTitle className="text-white">
                                Diagram Operation
                            </DialogTitle>
                            <DialogDescription className="text-gray-300">
                                {saveLoadMessage}
                            </DialogDescription>
                        </DialogHeader>
                    </DialogContent>
                </Dialog>
            </div>
        </ChatProvider>
    );
};

export default ImprovedLayout;
