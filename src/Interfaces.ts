import {
    CanvasSettings,
    Category,
    Component,
    DiagramComponent,
    Shape,
    UnifiedElement
} from "./Types";
import { StorageType } from "./lib/fileOperations";

export interface ImprovedLayoutProps {
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
    handleLoadDiagramFromJSON: (
        loadedComponents: DiagramComponent[]
    ) => Promise<void>;
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
