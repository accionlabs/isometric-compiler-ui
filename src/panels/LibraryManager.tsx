// @/panels/LibraryManager.tsx

import React, { useState, useEffect, useCallback } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "../components/ui/Dialog";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { SVGLibraryManager, ExtendedLibraryData } from "../lib/svgLibraryUtils";
import { Shape, LibraryData } from "../Types";
import { loadShapesFromGoogleDrive } from "../lib/googleDriveLib";
import { ToggleGroup } from "../components/ui/ToggleGroup";

interface LibraryFormData {
    name: string;
    description: string;
    source: "googledrive" | "local";
    spreadsheetUrl: string;
    folderUrl: string;
    indexFile: File | null;
    svgFiles: File[];
    updateMode: "replace" | "append";
}

interface LoadingProgress {
    currentFile: string;
    loadedFiles: number;
    totalFiles: number;
}

interface LibraryManagerProps {
    activeLibrary: string;
    onLibraryChange: (libraryId: string) => void;
    onUpdateShapes: (shapes: Shape[]) => void;
}

const sourceOptions = [
    { value: "local", label: "Local Files" },
    { value: "googledrive", label: "Google Drive" }
];

const updateModeOptions = [
    { value: "replace", label: "Replace All Shapes" },
    { value: "append", label: "Add New Shapes" }
];

const LibraryManager: React.FC<LibraryManagerProps> = ({
    activeLibrary,
    onLibraryChange,
    onUpdateShapes
}) => {
    const [libraries, setLibraries] = useState<LibraryData[]>([]);
    const [loadingStatus, setLoadingStatus] = useState<string | null>(null);
    const [loadingProgress, setLoadingProgress] =
        useState<LoadingProgress | null>(null);
    const [isLoadingDialogOpen, setIsLoadingDialogOpen] = useState(false);
    const [isLibraryDialogOpen, setIsLibraryDialogOpen] = useState(false);
    const [editingLibraryId, setEditingLibraryId] = useState<string | null>(
        null
    );
    const [libraryForm, setLibraryForm] = useState<LibraryFormData>({
        name: "",
        description: "",
        source: "local",
        spreadsheetUrl: "",
        folderUrl: "",
        indexFile: null,
        svgFiles: [],
        updateMode: "replace"
    });

    // Initialize libraries
    useEffect(() => {
        const initializeLibraries = async () => {
            await SVGLibraryManager.initializeDefaultLibrary();
            const loadedLibraries = SVGLibraryManager.getLibraries();
            setLibraries(loadedLibraries);
        };
        initializeLibraries();
    }, []);

    const resetForm = () => {
        setLibraryForm({
            name: "",
            description: "",
            source: "local",
            spreadsheetUrl: "",
            folderUrl: "",
            indexFile: null,
            svgFiles: [],
            updateMode: "replace"
        });
        setEditingLibraryId(null);
    };

    const handleEditLibrary = (libraryId: string) => {
        const library = SVGLibraryManager.getLibrary(libraryId);
        if (!library) return;

        setLibraryForm({
            name: library.name,
            description: library.description,
            source: library.source?.type || "local",
            spreadsheetUrl: library.source?.googleDrive?.spreadsheetUrl || "",
            folderUrl: library.source?.googleDrive?.folderUrl || "",
            indexFile: null,
            svgFiles: [],
            updateMode: "replace"
        });
        setEditingLibraryId(libraryId);
        setIsLibraryDialogOpen(true);
    };

    const handleProgressUpdate = useCallback((progress: LoadingProgress) => {
        setLoadingProgress(progress);
        setLoadingStatus(
            `Loading ${progress.currentFile} (${progress.loadedFiles}/${progress.totalFiles})`
        );
    }, []);

    const handleLoadShapes = useCallback(
        async (
            libraryId: string,
            spreadsheetUrl: string,
            folderUrl: string
        ) => {
            try {
                const shapes = await loadShapesFromGoogleDrive(
                    spreadsheetUrl,
                    folderUrl,
                    handleProgressUpdate
                );

                SVGLibraryManager.addShapesToLibrary(libraryId, shapes);
                setLibraries(SVGLibraryManager.getLibraries());
                return shapes;
            } catch (error) {
                console.error("Error loading shapes:", error);
                throw error;
            }
        },
        []
    );

    const handleActivateLibrary = useCallback(
        async (libraryId: string) => {
            setLoadingStatus("Activating library...");
            setIsLoadingDialogOpen(true);

            try {
                const library = SVGLibraryManager.getLibrary(libraryId);
                if (!library) {
                    throw new Error("Library not found");
                }

                let shapes = library.shapes;

                // If library has no shapes and has source configuration, try to load them
                if (shapes.length === 0 && library.source) {
                    if (
                        library.source.type === "googledrive" &&
                        library.source.googleDrive?.spreadsheetUrl &&
                        library.source.googleDrive?.folderUrl
                    ) {
                        shapes = await handleLoadShapes(
                            libraryId,
                            library.source.googleDrive.spreadsheetUrl,
                            library.source.googleDrive.folderUrl
                        );
                    } else if (library.source.type === "local") {
                        // For local libraries, we can't automatically reload shapes
                        // User needs to use the edit function to reload shapes
                        setLoadingStatus(
                            "Please use Edit function to load local shapes"
                        );
                        setTimeout(() => {
                            setIsLoadingDialogOpen(false);
                            setLoadingStatus(null);
                        }, 2000);
                        return;
                    }
                }

                // Update active library
                onLibraryChange(libraryId);
                onUpdateShapes(shapes);

                setLoadingStatus("Library activated successfully!");
            } catch (error) {
                setLoadingStatus(
                    `Error activating library: ${
                        error instanceof Error ? error.message : "Unknown error"
                    }`
                );
            } finally {
                setTimeout(() => {
                    setIsLoadingDialogOpen(false);
                    setLoadingStatus(null);
                }, 2000);
            }
        },
        [handleLoadShapes, onLibraryChange, onUpdateShapes]
    );

    const handleReloadLibrary = useCallback(
        async (libraryId: string) => {
            setLoadingStatus("Reloading library...");
            setIsLoadingDialogOpen(true);

            try {
                const library = SVGLibraryManager.getLibrary(libraryId);
                if (!library || !library.source) {
                    throw new Error(
                        "Library not found or has no source configuration"
                    );
                }

                let shapes: Shape[] = [];
                if (
                    library.source.type === "googledrive" &&
                    library.source.googleDrive?.spreadsheetUrl &&
                    library.source.googleDrive?.folderUrl
                ) {
                    shapes = await handleLoadShapes(
                        libraryId,
                        library.source.googleDrive.spreadsheetUrl,
                        library.source.googleDrive.folderUrl
                    );
                }

                if (libraryId === activeLibrary) {
                    onUpdateShapes(shapes);
                }

                setLoadingStatus("Library reloaded successfully!");
            } catch (error) {
                setLoadingStatus(
                    `Error reloading library: ${
                        error instanceof Error ? error.message : "Unknown error"
                    }`
                );
            } finally {
                setTimeout(() => {
                    setIsLoadingDialogOpen(false);
                    setLoadingStatus(null);
                }, 2000);
            }
        },
        [activeLibrary, handleLoadShapes, onUpdateShapes]
    );

    const processLocalFiles = async (
        indexContent: string,
        svgFiles: File[],
        existingShapes: Shape[] = [],
        updateMode: "replace" | "append"
    ): Promise<Shape[]> => {
        const shapes: Shape[] = [];
        const rows = indexContent.split("\n").slice(1); // Skip header row
        const existingShapeMap = new Map(
            existingShapes.map((shape) => [shape.name, shape])
        );

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i].trim();
            if (!row) continue;

            const [name, svgFile, type, attachTo] = row
                .split(",")
                .map((s) => s.trim());
            const svgFileObj = svgFiles.find((f) => f.name === svgFile);

            if (svgFileObj) {
                handleProgressUpdate({
                    currentFile: svgFile,
                    loadedFiles: i + 1,
                    totalFiles: rows.length
                });

                const svgContent = await SVGLibraryManager.readFileAsText(
                    svgFileObj
                );
                if (updateMode === "append" && existingShapeMap.has(name)) {
                    // Skip existing shapes in append mode
                    shapes.push(existingShapeMap.get(name)!);
                } else {
                    shapes.push({
                        name,
                        type: type as "2D" | "3D",
                        attachTo,
                        svgContent,
                        svgFile: svgFile
                    });
                }
            }
        }

        if (updateMode === "append") {
            // Add remaining existing shapes that weren't in the new index
            existingShapes.forEach((shape) => {
                if (!shapes.some((s) => s.name === shape.name)) {
                    shapes.push(shape);
                }
            });
        }

        return shapes;
    };

    const handleUpdateLibrary = useCallback(
        async (
            libraryId: string,
            shapes: Shape[],
            source: {
                type: "googledrive" | "local";
                googleDrive?: any;
                local?: any;
            }
        ) => {
            SVGLibraryManager.updateLibrary(libraryId, {
                shapes,
                source,
                lastUpdated: new Date()
            });

            setLibraries(SVGLibraryManager.getLibraries());
            if (libraryId === activeLibrary) {
                onUpdateShapes(shapes);
            }
        },
        [activeLibrary, onUpdateShapes]
    );

    const handleDeleteLibrary = useCallback(
        async (libraryId: string) => {
            SVGLibraryManager.deleteLibrary(libraryId);

            setLibraries(SVGLibraryManager.getLibraries());
        },
        [activeLibrary, onUpdateShapes]
    );

    const handleSubmitLibrary = useCallback(async () => {
        try {
            setLoadingStatus(
                editingLibraryId
                    ? "Updating library..."
                    : "Creating new library..."
            );
            setIsLoadingDialogOpen(true);

            const sourceData =
                libraryForm.source === "googledrive"
                    ? {
                          type: "googledrive" as const,
                          googleDrive: {
                              spreadsheetUrl: libraryForm.spreadsheetUrl,
                              folderUrl: libraryForm.folderUrl
                          }
                      }
                    : {
                          type: "local" as const,
                          local: {
                              indexFilename: libraryForm.indexFile?.name || "",
                              svgFilenames: libraryForm.svgFiles.map(
                                  (file) => file.name
                              )
                          }
                      };

            let libraryId: string;
            let existingShapes: Shape[] = [];

            if (editingLibraryId) {
                libraryId = editingLibraryId;
                const library = SVGLibraryManager.getLibrary(editingLibraryId);
                if (library) {
                    existingShapes = library.shapes;
                }
            } else {
                const newLibrary = SVGLibraryManager.createLibrary({
                    name: libraryForm.name,
                    description: libraryForm.description,
                    source: sourceData
                });
                SVGLibraryManager.addLibrary(newLibrary);
                libraryId = newLibrary.id;
            }

            let shapes: Shape[] = [];
            if (libraryForm.source === "googledrive") {
                if (libraryForm.spreadsheetUrl && libraryForm.folderUrl) {
                    shapes = await loadShapesFromGoogleDrive(
                        libraryForm.spreadsheetUrl,
                        libraryForm.folderUrl,
                        handleProgressUpdate
                    );
                }
            } else {
                if (libraryForm.indexFile && libraryForm.svgFiles.length > 0) {
                    const indexContent = await SVGLibraryManager.readFileAsText(
                        libraryForm.indexFile
                    );
                    shapes = await processLocalFiles(
                        indexContent,
                        libraryForm.svgFiles,
                        existingShapes,
                        libraryForm.updateMode
                    );
                }
            }

            await handleUpdateLibrary(libraryId, shapes, sourceData);

            setIsLibraryDialogOpen(false);
            resetForm();
            setLoadingStatus("Library processed successfully!");
        } catch (error) {
            setLoadingStatus(
                `Error processing library: ${
                    error instanceof Error ? error.message : "Unknown error"
                }`
            );
        } finally {
            setTimeout(() => {
                setIsLoadingDialogOpen(false);
                setLoadingStatus(null);
            }, 2000);
        }
    }, [libraryForm, editingLibraryId, handleUpdateLibrary]);


    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">Shape Libraries</h3>
                <Button
                    onClick={() => setIsLibraryDialogOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                >
                    Create New Library
                </Button>
            </div>

            <div className="flex-grow overflow-y-auto mt-4">
                <div className="space-y-4">
                    {libraries.map((library) => (
                        <div
                            key={library.id}
                            className={`p-4 rounded-lg border ${
                                activeLibrary === library.id
                                    ? "border-blue-500 bg-blue-900/20"
                                    : "border-gray-700"
                            }`}
                        >
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-white text-lg font-medium">
                                        {library.name}
                                    </h3>
                                    <p className="text-sm text-gray-400">
                                        {library.description}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Shapes: {library.shapes.length} • Last
                                        updated:{" "}
                                        {new Date(
                                            library.lastUpdated
                                        ).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex space-x-2">
                                    <Button
                                        onClick={() =>
                                            handleEditLibrary(library.id)
                                        }
                                        className="bg-gray-600 hover:bg-gray-700"
                                        disabled={library.id === "default"}
                                    >
                                        Edit
                                    </Button>
                                    <Button
                                        onClick={() =>
                                            onLibraryChange(library.id)
                                        }
                                        disabled={activeLibrary === library.id}
                                    >
                                        {activeLibrary === library.id
                                            ? "Active"
                                            : "Activate"}
                                    </Button>
                                    {library.id !== "default" &&
                                        activeLibrary !== library.id && (
                                            <Button
                                                onClick={() =>
                                                    handleDeleteLibrary(
                                                        library.id
                                                    )
                                                }
                                                className="bg-red-600 hover:bg-red-700"
                                            >
                                                Delete
                                            </Button>
                                        )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <Dialog
                open={isLibraryDialogOpen}
                onOpenChange={(open) => {
                    if (!open) resetForm();
                    setIsLibraryDialogOpen(open);
                }}
            >
                <DialogContent className="bg-gray-800 border border-gray-700">
                    <DialogHeader>
                        <DialogTitle className="text-white">
                            {editingLibraryId
                                ? "Edit Library"
                                : "Create New Library"}
                        </DialogTitle>
                        <DialogDescription className="text-gray-400">
                            {editingLibraryId
                                ? "Update library details and manage shapes."
                                : "Create a new shape library and configure your preferred source."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-200 mb-1">
                                Library Name
                            </label>
                            <Input
                                value={libraryForm.name}
                                onChange={(e) =>
                                    setLibraryForm((prev) => ({
                                        ...prev,
                                        name: e.target.value
                                    }))
                                }
                                placeholder="My Custom Library"
                                className="w-full bg-gray-700 text-white border-gray-600"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-200 mb-1">
                                Description
                            </label>
                            <Input
                                value={libraryForm.description}
                                onChange={(e) =>
                                    setLibraryForm((prev) => ({
                                        ...prev,
                                        description: e.target.value
                                    }))
                                }
                                placeholder="A collection of custom shapes..."
                                className="w-full bg-gray-700 text-white border-gray-600"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-200 mb-2">
                                Source
                            </label>
                            <ToggleGroup
                                options={sourceOptions}
                                value={libraryForm.source}
                                onValueChange={(value) =>
                                    setLibraryForm((prev) => ({
                                        ...prev,
                                        source: value as "googledrive" | "local"
                                    }))
                                }
                            />
                        </div>

                        {editingLibraryId && (
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">
                                    Update Mode
                                </label>
                                <ToggleGroup
                                    options={updateModeOptions}
                                    value={libraryForm.updateMode}
                                    onValueChange={(value) =>
                                        setLibraryForm((prev) => ({
                                            ...prev,
                                            updateMode: value as
                                                | "replace"
                                                | "append"
                                        }))
                                    }
                                />
                            </div>
                        )}

                        {libraryForm.source === "googledrive" ? (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-200 mb-1">
                                        Google Spreadsheet URL
                                    </label>
                                    <Input
                                        value={libraryForm.spreadsheetUrl}
                                        onChange={(e) =>
                                            setLibraryForm((prev) => ({
                                                ...prev,
                                                spreadsheetUrl: e.target.value
                                            }))
                                        }
                                        placeholder="https://docs.google.com/spreadsheets/d/..."
                                        className="w-full bg-gray-700 text-white border-gray-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-200 mb-1">
                                        Google Drive Folder URL
                                    </label>
                                    <Input
                                        value={libraryForm.folderUrl}
                                        onChange={(e) =>
                                            setLibraryForm((prev) => ({
                                                ...prev,
                                                folderUrl: e.target.value
                                            }))
                                        }
                                        placeholder="https://drive.google.com/drive/folders/..."
                                        className="w-full bg-gray-700 text-white border-gray-600"
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-200 mb-1">
                                        Index File (CSV)
                                    </label>
                                    <Input
                                        type="file"
                                        accept=".csv"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                setLibraryForm((prev) => ({
                                                    ...prev,
                                                    indexFile: file
                                                }));
                                            }
                                        }}
                                        className="w-full bg-gray-700 text-white border-gray-600"
                                    />
                                    {editingLibraryId &&
                                        !libraryForm.indexFile && (
                                            <p className="text-sm text-gray-400 mt-1">
                                                Leave empty to keep existing
                                                index
                                            </p>
                                        )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-200 mb-1">
                                        SVG Files
                                    </label>
                                    <Input
                                        type="file"
                                        accept=".svg"
                                        multiple
                                        onChange={(e) => {
                                            const files = Array.from(
                                                e.target.files || []
                                            );
                                            setLibraryForm((prev) => ({
                                                ...prev,
                                                svgFiles: files
                                            }));
                                        }}
                                        className="w-full bg-gray-700 text-white border-gray-600"
                                    />
                                    {editingLibraryId &&
                                        libraryForm.svgFiles.length === 0 && (
                                            <p className="text-sm text-gray-400 mt-1">
                                                {libraryForm.updateMode ===
                                                "append"
                                                    ? "Upload only new or modified SVG files"
                                                    : "Upload all SVG files to replace existing ones"}
                                            </p>
                                        )}
                                </div>
                            </>
                        )}

                        <div className="flex justify-end space-x-2">
                            <Button
                                onClick={() => setIsLibraryDialogOpen(false)}
                                className="bg-gray-600 hover:bg-gray-700 text-white"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSubmitLibrary}
                                disabled={
                                    !libraryForm.name.trim() ||
                                    (libraryForm.source === "googledrive"
                                        ? !libraryForm.spreadsheetUrl ||
                                          !libraryForm.folderUrl
                                        : !editingLibraryId &&
                                          (!libraryForm.indexFile ||
                                              libraryForm.svgFiles.length ===
                                                  0))
                                }
                                className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-800 disabled:opacity-50"
                            >
                                {editingLibraryId
                                    ? "Update Library"
                                    : "Create Library"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Loading Dialog */}
            <Dialog
                open={isLoadingDialogOpen}
                onOpenChange={setIsLoadingDialogOpen}
            >
                <DialogContent className="bg-gray-800 text-white">
                    <DialogHeader>
                        <DialogTitle>Library Operation</DialogTitle>
                        <DialogDescription className="text-gray-300">
                            {loadingStatus}
                            {loadingProgress && (
                                <div className="mt-4">
                                    <div className="w-full bg-gray-700 rounded-full h-2">
                                        <div
                                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                            style={{
                                                width: `${
                                                    (loadingProgress.loadedFiles /
                                                        loadingProgress.totalFiles) *
                                                    100
                                                }%`
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default LibraryManager;
