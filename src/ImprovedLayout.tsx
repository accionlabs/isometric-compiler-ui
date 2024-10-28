import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './components/ui/Dialog';
import { Button } from './components/ui/Button';
// import SVGDisplay from './SVGDisplay';
import FlowSVGDisplay from './FlowSVGDIsplay';
import ShapesPanel from './panels/ShapesPanel';
import CompositionPanel from './panels/CompositionPanel';
import SettingsPanel from './panels/SettingsPanel';
import AttachmentOptionsPanel from './panels/AttachmentOptionsPanel';
import { DiagramComponent, Shape } from './Types';

interface ImprovedLayoutProps {
    svgLibrary: Shape[];
    activeLibrary: string;
    diagramComponents: DiagramComponent[];
    isCopied: boolean;
    canvasSize: { width: number; height: number };
    onSetCanvasSize: (size: { width: number; height: number }) => void;
    composedSVG: string;
    onAdd3DShape: (shapeName: string) => void;
    onAdd2DShape: (shapeName: string, attachTo: string) => void;
    onRemove3DShape: (id: string) => void;
    onRemove2DShape: (parentId: string, shapeIndex: number) => void;
    selected3DShape: string | null;
    onSelect3DShape: (id: string | null) => void;
    selectedPosition: string,
    onSelectedPosition: (id: string) => void;
    selectedAttachmentPoint: string | null,
    onSelectedAttachmentPoint: (id: string | null) => void;
    onCut3DShape: (id: string) => void;
    onCopy3DShape: (id: string) => void;
    onCancelCut3DShape: (id: string) => void;
    onPaste3DShape: (id: string) => void;
    onUpdateSvgLibrary: (newLibrary: Shape[]) => void;
    onDownloadSVG: () => void;
    fileName: string;
    setFileName: (name: string) => void;
    onGetBoundingBox: (boundingBox: { x: number, y: number, width: number, height: number } | null) => void;
    availableAttachmentPoints: string[];
    errorMessage: string | null;
    setErrorMessage: (message: string | null) => void;
    onSaveDiagram: () => Promise<void>;
    onLoadDiagram: () => Promise<void>;
    folderPath: string;
    setFolderPath: (path: string) => void;
    showAttachmentPoints: boolean;
    setShowAttachmentPoints: (show: boolean) => void;
    onLibraryChange: (libraryId: string) => void;
}

const ImprovedLayout: React.FC<ImprovedLayoutProps> = ({
    svgLibrary,
    activeLibrary,
    onLibraryChange,
    diagramComponents,
    selected3DShape,
    canvasSize,
    composedSVG,
    onAdd3DShape,
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
    onUpdateSvgLibrary,
    onDownloadSVG,
    fileName,
    setFileName,
    onGetBoundingBox,
    availableAttachmentPoints,
    errorMessage,
    setErrorMessage,
    onSaveDiagram,
    onLoadDiagram,
    folderPath,
    setFolderPath,
    showAttachmentPoints,
    setShowAttachmentPoints,
}) => {
    const [activePanel, setActivePanel] = useState<'shapes' | 'composition' | 'settings'>('shapes');
    const [isLoadingDialogOpen, setIsLoadingDialogOpen] = useState(false);
    const [isSaveLoadDialogOpen, setIsSaveLoadDialogOpen] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState<{ currentFile: string; loadedFiles: number; totalFiles: number } | null>(null);
    const [saveLoadMessage, setSaveLoadMessage] = useState<string | null>(null);

    const handleSelect3DShape = useCallback((id: string | null) => {
        console.log(`Improved Layout: selected 3D Shape ${id}`);
        onSelect3DShape(id);
    }, [onSelect3DShape]);

    const handleSelectedPosition = useCallback((position: string | null) => {
        if (position) {
            console.log(`Improved Layout: position ${position}`);
            onSelectedPosition(position);
        }
    }, [onSelectedPosition, selectedPosition]);

    const handleSelectedAttachmentPoint = useCallback((point: string | null) => {
        onSelectedAttachmentPoint(point);
        console.log('Improved Layout: attachment point', point);
    }, [onSelectedAttachmentPoint]);

    const handleAdd3DShape = useCallback((shapeName: string) => {
        onAdd3DShape(shapeName);
    }, [onAdd3DShape]);

    const handleCopy3DShape = useCallback((id: string) => {
        onCopy3DShape(id);
    }, [onCopy3DShape]);

    const handlePaste3DShape = useCallback((id: string) => {
        onPaste3DShape(id);
    }, [onPaste3DShape]);

    const handleSaveDiagram = async () => {
        setIsSaveLoadDialogOpen(true);
        setSaveLoadMessage('Saving diagram...');
        try {
            await onSaveDiagram();
            setSaveLoadMessage('Diagram saved successfully!');
        } catch (error) {
            setSaveLoadMessage('Failed to save diagram. Please try again.');
        } finally {
            setTimeout(() => setIsSaveLoadDialogOpen(false), 5000);
        }
    };

    const handleLoadDiagram = async () => {
        setIsSaveLoadDialogOpen(true);
        setSaveLoadMessage('Loading diagram...');
        try {
            await onLoadDiagram();
            setSaveLoadMessage('Diagram loaded successfully!');
        } catch (error) {
            setSaveLoadMessage('Failed to load diagram. Please check the file and try again.');
        } finally {
            setTimeout(() => setIsSaveLoadDialogOpen(false), 5000);
        }
    };

    return (
        <div className="flex flex-row h-screen w-screen bg-gray-900 text-white">
            {/* Left side control panels */}
            <div className="flex flex-col border-r border-gray-700 w-1/3">
                {/* Tab buttons */}
                <div className="flex flex-row h-14 px-2 pt-2 space-x-2 border-b border-gray-700">
                    <button
                        className={`flex-col h-12 w-1/3 py-2 ${activePanel === 'shapes' ? 'bg-blue-600' : 'bg-gray-800'}`}
                        onClick={() => setActivePanel('shapes')}
                    >
                        Shapes
                    </button>
                    <button
                        className={`flex-col h-12 w-1/3 py-2 ${activePanel === 'composition' ? 'bg-blue-600' : 'bg-gray-800'}`}
                        onClick={() => setActivePanel('composition')}
                    >
                        Composition
                    </button>
                    <button
                        className={`flex-col h-12 w-1/3 py-2 ${activePanel === 'settings' ? 'bg-blue-600' : 'bg-gray-800'}`}
                        onClick={() => setActivePanel('settings')}
                    >
                        Settings
                    </button>
                </div>

                {/* Panel content */}
                <div className="flex-grow overflow-hidden">
                    {activePanel === 'shapes' && (
                        <ShapesPanel
                            svgLibrary={svgLibrary}
                            activeLibrary={activeLibrary}
                            onAdd3DShape={handleAdd3DShape}
                            onAdd2DShape={onAdd2DShape}
                            selected3DShape={selected3DShape}
                            diagramComponents={diagramComponents}
                        />
                    )}
                    {activePanel === 'composition' && (
                        <CompositionPanel
                            diagramComponents={diagramComponents}
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
                        />
                    )}
                    {activePanel === 'settings' && (
                        <SettingsPanel
                            canvasSize={canvasSize}
                            onSetCanvasSize={onSetCanvasSize}
                            fileName={fileName}
                            setFileName={setFileName}
                            onSaveDiagram={handleSaveDiagram}
                            onLoadDiagram={handleLoadDiagram}
                            activeLibrary={activeLibrary}
                            onLibraryChange={onLibraryChange}
                            folderPath={folderPath}
                            setFolderPath={setFolderPath}
                            onDownloadSVG={onDownloadSVG}
                            showAttachmentPoints={showAttachmentPoints}
                            setShowAttachmentPoints={setShowAttachmentPoints}
                            onUpdateShapes={onUpdateSvgLibrary}
                        />
                    )}
                </div>
            </div>

            <div className="flex-grow flex flex-col relative">
                {/* Heading */}
                <h2 className="text-xl h-14 font-semibold p-4 bg-gray-800 z-10">Composed SVG</h2>

                {/* Relative container for SVG Display and Attachment Options Panel */}
                <div className="relative flex-grow overflow-hidden">
                    {/* SVG Display */}
                    <FlowSVGDisplay
                        svgContent={composedSVG}
                        selected3DShape={selected3DShape}
                        diagramComponents={diagramComponents}
                        isCopied={isCopied}
                        onSelect3DShape={handleSelect3DShape}
                        onGetBoundingBox={onGetBoundingBox}
                        canvasSize={canvasSize}
                        setSelectedPosition={handleSelectedPosition}
                        setSelectedAttachmentPoint={handleSelectedAttachmentPoint}
                    />

                    {/* Attachment Options Panel - slides behind the heading */}
                    <div
                        className={`absolute top-0 left-0 right-0 transition-transform duration-300 ease-in-out transform ${selected3DShape ? 'translate-y-0' : '-translate-y-full'
                            }`}
                        style={{ top: '-1px' }} // Slight overlap to prevent gap
                    >
                        <AttachmentOptionsPanel
                            selectedPosition={selectedPosition}
                            setSelectedPosition={handleSelectedPosition}
                            selectedAttachmentPoint={selectedAttachmentPoint}
                            setSelectedAttachmentPoint={handleSelectedAttachmentPoint}
                            availableAttachmentPoints={availableAttachmentPoints}
                        />
                    </div>
                </div>
            </div>

            {/* Google Drive Folder URL Dialog */}
            <Dialog open={isLoadingDialogOpen} onOpenChange={setIsLoadingDialogOpen}>
                <DialogContent className="bg-gray-800 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-white">Loading Shapes from Google Drive</DialogTitle>
                        <DialogDescription className="text-gray-300">
                            Please wait while we load the shapes from your Google Drive.
                        </DialogDescription>
                    </DialogHeader>
                    {errorMessage && (
                        <div className="mt-4">
                            <p className="text-red-400">{errorMessage}</p>
                            <Button onClick={() => setIsLoadingDialogOpen(false)} className="mt-2">
                                Close
                            </Button>
                        </div>
                    )}
                    {loadingProgress && (
                        <div className="mt-4 text-white">
                            <p>Loading: {loadingProgress.currentFile}</p>
                            <p>Progress: {loadingProgress.loadedFiles} / {loadingProgress.totalFiles}</p>
                            <div className="w-full bg-gray-700 rounded-full h-2.5 mt-2">
                                <div
                                    className="bg-blue-500 h-2.5 rounded-full"
                                    style={{ width: `${(loadingProgress.loadedFiles / loadingProgress.totalFiles) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Save/Load Diagram Dialog */}
            <Dialog open={isSaveLoadDialogOpen} onOpenChange={setIsSaveLoadDialogOpen}>
                <DialogContent className="bg-gray-800 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-white">Diagram Operation</DialogTitle>
                        <DialogDescription className="text-gray-300">
                            {saveLoadMessage}
                        </DialogDescription>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ImprovedLayout;