import React, { useState, useEffect, useCallback } from "react";
import { Shape, DiagramComponent, Component } from "./Types";
import ImprovedLayout from "./ImprovedLayout";
import {
    calculateSVGBoundingBox,
    cleanupSVG,
    clipSVGToContents
} from "./lib/svgUtils";
import * as diagramComponentsLib from "./lib/diagramComponentsLib";
import { componentLibraryManager } from "./lib/componentLib";
import { createKeyboardShortcuts } from "./KeyboardShortcuts";
import { SVGLibraryManager } from "./lib/svgLibraryUtils";
import { schemaLoader } from "./lib/componentSchemaLib";
import { StorageType, loadFile, saveFile } from "./lib/fileOperations";

const App: React.FC = () => {
    const [svgLibrary, setSvgLibrary] = useState<Shape[]>([]);
    const [diagramComponents, setDiagramComponents] = useState<
        DiagramComponent[]
    >([]);
    const [canvasSize, setCanvasSize] = useState({ width: 1000, height: 1000 });
    const [composedSVG, setComposedSVG] = useState<string>("");
    const [selected3DShape, setSelected3DShape] = useState<string | null>(null);
    const [selectedPosition, setSelectedPosition] = useState<string>("top");
    const [selectedAttachmentPoint, setSelectedAttachmentPoint] = useState<
        string | null
    >(null);
    const [availableAttachmentPoints, setAvailableAttachmentPoints] = useState<
        string[]
    >([]);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const [isCopied, setIsCopied] = useState<boolean>(false);
    const [fileName, setFileName] = useState(() => {
        return localStorage.getItem("fileName") || "diagram.svg";
    });
    const [folderPath, setFolderPath] = useState(() => {
        return localStorage.getItem("folderPath") || "My Diagrams";
    });
    const [showAttachmentPoints, setShowAttachmentPoints] = useState(() => {
        return localStorage.getItem("showAttachmentPoints") === "true";
    });
    const [activeLibrary, setActiveLibrary] = useState<string>(() => {
        const stored = localStorage.getItem("activeLibrary");
        return stored || "default";
    });
    const [schemaUrl] = useState("/schemas/component-types.yaml"); // URL to your schema file
    const [storageType, setStorageType] = useState<StorageType>(
        StorageType.Local
    );

    // Add state for component library
    const [components, setComponents] = useState<Component[]>([]);

    // Update shapes when active library changes
    const handleLibraryChange = useCallback((libraryId: string) => {
        setActiveLibrary(libraryId);
        localStorage.setItem("activeLibrary", libraryId);

        const library = SVGLibraryManager.getLibrary(libraryId);
        if (library) {
            setSvgLibrary(library.shapes);
            // render all components, if any
            componentLibraryManager.renderAllComponents(
                canvasSize,
                library.shapes
            );
        }
    }, []);

    // update diagram component metadata when added
    const handleUpdateMetadata = useCallback(
        (id: string, type: string | undefined, metadata: any) => {
            setDiagramComponents((prevComponents) =>
                prevComponents.map((component) => {
                    if (component.id === id) {
                        return {
                            ...component,
                            type,
                            metadata: type ? metadata : undefined
                        };
                    }
                    return component;
                })
            );
        },
        []
    );

    // on selection of storage type for saving and loading the diagram
    const handleStorageTypeChange = useCallback((type: StorageType) => {
        setStorageType(type);
    }, []);

    // handle select 3D shape from Composition panel or SVG diagram
    const updateSelected3DShape = (
        selectedComponent: DiagramComponent | null
    ) => {
        if (selectedComponent && !selectedComponent.cut) {
            setSelected3DShape(selectedComponent.id);
            const updatedAttachmentPoints =
                diagramComponentsLib.updateAvailableAttachmentPoints(
                    selectedComponent
                );
            setAvailableAttachmentPoints(updatedAttachmentPoints);
        } else {
            console.log("App: cannot select", selectedComponent);
            setAvailableAttachmentPoints([]);
        }
    };

    const handleSelect3DShape = useCallback(
        (id: string | null) => {
            if (!id) {
                setSelected3DShape(null);
                setAvailableAttachmentPoints([]);
            } else {
                const selectedComponent = diagramComponentsLib.get3DShape(
                    diagramComponents,
                    id
                );
                updateSelected3DShape(selectedComponent);
            }
        },
        [diagramComponents]
    );

    const handleSelectedPosition = useCallback(
        (position: string | null) => {
            if (position) {
                setSelectedPosition(position);
            }
        },
        [setSelectedPosition, selectedPosition]
    );

    const handleSelectedAttachmentPoint = useCallback(
        (point: string | null) => {
            if (point) {
                setSelectedAttachmentPoint(point);
            }
        },
        [setSelectedAttachmentPoint, selectedAttachmentPoint]
    );

    const handleAdd3DShape = useCallback(
        (shapeName: string) => {
            const result = diagramComponentsLib.add3DShape(
                diagramComponents,
                svgLibrary,
                shapeName,
                selectedPosition,
                selectedAttachmentPoint,
                selected3DShape
            );

            if (result.newComponent) {
                setDiagramComponents(result.updatedComponents);
                updateSelected3DShape(result.newComponent);
            } else {
                console.error("Failed to add new 3D shape");
            }
        },
        [
            diagramComponents,
            svgLibrary,
            selected3DShape,
            selectedPosition,
            selectedAttachmentPoint
        ]
    );

    const handleAddComponent = useCallback(
        (componentId: string) => {
            const result = diagramComponentsLib.addComponentToScene(
                diagramComponents,
                componentId,
                selectedPosition,
                selectedAttachmentPoint,
                selected3DShape
            );
            if (result.newComponent) {
                setDiagramComponents(result.updatedComponents);
                updateSelected3DShape(result.newComponent);
            } else {
                console.error("Failed to add new component");
            }
        },
        [
            diagramComponents,
            selectedPosition,
            selectedAttachmentPoint,
            selected3DShape
        ]
    );

    const handleAdd2DShape = useCallback(
        (shapeName: string, attachTo: string) => {
            const updatedComponents = diagramComponentsLib.add2DShape(
                diagramComponents,
                selected3DShape,
                shapeName,
                attachTo,
                selectedPosition,
                selectedAttachmentPoint
            );
            setDiagramComponents(updatedComponents);
        },
        [diagramComponents, selected3DShape, selectedPosition, selectedAttachmentPoint]
    );

    const handleRemove3DShape = useCallback(
        (id: string | null) => {
            if (!id) {
                id = selected3DShape;
            }
            if (id) {
                const updatedComponents = diagramComponentsLib.remove3DShape(
                    diagramComponents,
                    id
                );
                setDiagramComponents(updatedComponents);

                // if removed component was currently selected, then select last component or none
                if (selected3DShape === id) {
                    if (updatedComponents.length > 0) {
                        updateSelected3DShape(
                            updatedComponents[updatedComponents.length - 1]
                        );
                    } else {
                        updateSelected3DShape(null);
                    }
                }
            }
        },
        [diagramComponents, selected3DShape, handleSelect3DShape]
    );

    const handleRemove2DShape = useCallback(
        (parentId: string, shapeIndex: number) => {
            const updatedComponents = diagramComponentsLib.remove2DShape(
                diagramComponents,
                parentId,
                shapeIndex
            );
            setDiagramComponents(updatedComponents);
        },
        [diagramComponents]
    );

    const handleCut3DShape = useCallback(
        (id: string | null) => {
            if (!id) {
                id = selected3DShape;
            }
            if (id) {
                setDiagramComponents((prev) =>
                    diagramComponentsLib.cut3DShape(prev, id as string)
                );
                setSelected3DShape(null);
            }
        },
        [selected3DShape]
    );

    const handleCancelCut3DShape = useCallback(
        (id: string | null) => {
            setDiagramComponents((prev) =>
                diagramComponentsLib.cancelCut(prev, id)
            );
            setIsCopied(false);
        },
        [isCopied]
    );

    const handleCopy3DShape = useCallback(
        (id: string | null) => {
            if (!id) {
                id = selected3DShape;
            }
            if (id) {
                setIsCopied(true);
                setDiagramComponents((prev) =>
                    diagramComponentsLib.cut3DShape(prev, id as string)
                );
            }
        },
        [diagramComponents, selected3DShape, isCopied, setIsCopied]
    );

    const handlePaste3DShape = useCallback(
        (id: string | null) => {
            if (selected3DShape) {
                let result = null;
                // if any copied components, paste them
                if (isCopied) {
                    const copiedShapes = diagramComponentsLib.cancelCut(
                        diagramComponentsLib.copy3DShape(
                            diagramComponents,
                            null
                        ),
                        null
                    );
                    result = diagramComponentsLib.pasteCopied3DShapes(
                        diagramComponents,
                        copiedShapes,
                        selected3DShape,
                        selectedPosition,
                        selectedAttachmentPoint
                    );
                } else {
                    result = diagramComponentsLib.pasteCut3DShapes(
                        diagramComponents,
                        id,
                        selected3DShape,
                        selectedPosition,
                        selectedAttachmentPoint
                    );
                }
                if (result.pastedComponent) {
                    setDiagramComponents(result.updatedComponents);
                    updateSelected3DShape(result.pastedComponent);
                } else {
                    console.error("Failed to paste 3D shape");
                }
            }
        },
        [selected3DShape, isCopied, selectedPosition, selectedAttachmentPoint]
    );

    const getJsonFileName = useCallback((svgFileName: string) => {
        return svgFileName.replace(/\.svg$/, ".json");
    }, []);

    const handleSetFolderPath = useCallback((newPath: string) => {
        setFolderPath(newPath);
    }, []);
    const handleSaveDiagram = useCallback(async () => {
        try {
            const jsonFileName = getJsonFileName(fileName);
            const serializedDiagramComponents =
                diagramComponentsLib.serializeDiagramComponents(
                    diagramComponents
                );
            const serializedComponentLib =
                componentLibraryManager.serializeComponentLib();
            await saveFile(
                storageType,
                jsonFileName,
                JSON.stringify(
                    {
                        serializedDiagramComponents,
                        serializedComponentLib
                    },
                    null,
                    2
                ),
                folderPath
            );
            setErrorMessage(null);
        } catch (error) {
            console.error("Error saving diagram:", error);
            setErrorMessage("Failed to save diagram. Please try again.");
        }
    }, [diagramComponents, fileName, folderPath, storageType]);

    const handleLoadDiagram = useCallback(
        async (fileOrPath?: File) => {
            try {
                let loadedData: string;

                if (storageType === StorageType.Local) {
                    if (!fileOrPath) {
                        throw new Error("No file selected for local storage");
                    }
                    loadedData = await loadFile(StorageType.Local, fileOrPath);
                } else {
                    const jsonFileName = getJsonFileName(fileName);
                    loadedData = await loadFile(StorageType.GoogleDrive, {
                        fileName: jsonFileName,
                        folderPath
                    });
                }
                const parsedData = JSON.parse(loadedData);
                // Deserialize the loaded data to retrieve diagram components and library information
                const deserializedComponents =
                    diagramComponentsLib.deserializeDiagramComponents(
                        parsedData.serializedDiagramComponents
                    );

                componentLibraryManager.deserializeComponentLib(
                    parsedData.serializedComponentLib
                );

                setComponents(componentLibraryManager.getAllComponents());
                setDiagramComponents(deserializedComponents);
                setErrorMessage(null);
            } catch (error) {
                console.error("Error loading diagram:", error);
                setErrorMessage(
                    error instanceof Error
                        ? error.message
                        : "Failed to load diagram. Please check the file and try again."
                );
            }
        },
        [fileName, folderPath, storageType, svgLibrary]
    );

    const handleLoadDiagramFromJSON = (
        loadedComponents: DiagramComponent[]
    ) => {
        const { svgContent, processedComponents } =
            diagramComponentsLib.compileDiagram(
                loadedComponents,
                canvasSize,
                svgLibrary,
                showAttachmentPoints
            );
        setDiagramComponents(processedComponents);
        setComposedSVG(svgContent);
        setErrorMessage(null);

        // Reset selection and update available attachment points
        updateSelected3DShape(null);
    };

    const handleSetCanvasSize = useCallback(
        (newSize: { width: number; height: number }) => {
            setCanvasSize(newSize);
            localStorage.setItem("canvasSize", JSON.stringify(newSize));
        },
        []
    );

    const handleSetFileName = useCallback((newFileName: string) => {
        setFileName(newFileName);
        localStorage.setItem("fileName", newFileName);
    }, []);

    const handleDownloadSVG = useCallback(() => {
        const boundingBox = calculateSVGBoundingBox(
            composedSVG,
            canvasSize
        ) || {
            x: 0,
            y: 0,
            width: "100%",
            height: "100%"
        };

        const svgToDownload: string = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="${boundingBox.x} ${boundingBox.y} ${boundingBox.width} ${boundingBox.height}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
                ${composedSVG}
            </svg>
        `;

        const blob = new Blob([svgToDownload], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;

        // Ensure fileName ends with .svg
        let adjustedFileName = fileName.trim();
        if (!adjustedFileName.toLowerCase().endsWith(".svg")) {
            adjustedFileName += ".svg";
        }

        link.download = adjustedFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, [composedSVG, fileName]);

    const handleSetShowAttachmentPoints = useCallback((show: boolean) => {
        setShowAttachmentPoints(show);
    }, []);

    const handleKeyboardShortcuts = useCallback(() => {
        return createKeyboardShortcuts(
            handleSaveDiagram,
            handleRemove3DShape,
            handleCut3DShape,
            handleCopy3DShape,
            handlePaste3DShape,
            handleCancelCut3DShape,
            selected3DShape,
            diagramComponents,
            selectedPosition,
            selectedAttachmentPoint
        );
    }, [
        handleSaveDiagram,
        handleRemove3DShape,
        handleCut3DShape,
        handlePaste3DShape,
        selected3DShape,
        diagramComponents,
        selectedPosition,
        selectedAttachmentPoint
    ]);

    // New handler to save current composition as a component
    const handleSaveAsComponent = useCallback(
        (name: string, description: string) => {
            try {
                let selectedShapes = diagramComponents;
                // if a shape is selected, then copy those shapes that are selected for saving as component
                if (selected3DShape) {
                    selectedShapes = diagramComponentsLib.copy3DShape(diagramComponents,selected3DShape);
                }
                // Pass true for overwrite since user has already confirmed in dialog
                const newComponent = componentLibraryManager.createComponent(
                    name,
                    description,
                    selectedShapes,
                    canvasSize,
                    svgLibrary,
                    true
                );

                if (newComponent) {
                    componentLibraryManager.renderComponent(
                        newComponent.id,
                        canvasSize,
                        svgLibrary
                    );
                    setComponents(componentLibraryManager.getAllComponents());

                    // if a shape was selected and we created a component from it, replace the existing shapes with the component
                    if (selected3DShape) {
                        const selectedShape = diagramComponentsLib.get3DShape(
                            diagramComponents,
                            selected3DShape
                        );
                        const position = selectedShape?.position || 'top';
                        const parentId = selectedShape?.relativeToId || diagramComponents[0].id;
                        const updatedComponents = diagramComponentsLib.remove3DShape(
                            diagramComponents,
                            selected3DShape
                        );
                        const result = diagramComponentsLib.addComponentToScene(
                            updatedComponents,
                            newComponent.id,
                            position,
                            null,
                            parentId
                        );
                        if (result.newComponent) {
                            setDiagramComponents(result.updatedComponents);
                            updateSelected3DShape(result.newComponent);
                        } else {
                            console.error("Failed to replace new component");
                        }
            
                    }
                    return newComponent;
                }
                return null;
            } catch (error) {
                console.error("Error saving component:", error);
                setErrorMessage("Failed to save component. Please try again.");
                return null;
            }
        },
        [diagramComponents, selected3DShape, canvasSize, svgLibrary]
    );

    // New handler to delete a component
    const handleDeleteComponent = useCallback((componentId: string) => {
        try {
            componentLibraryManager.deleteComponent(componentId);
            setComponents(componentLibraryManager.getAllComponents());
        } catch (error) {
            console.error("Error deleting component:", error);
            setErrorMessage("Failed to delete component. Please try again.");
        }
    }, []);

    // New handler to update a component
    const handleUpdateComponent = useCallback(
        (
            componentId: string,
            updates: Partial<Omit<Component, "id" | "created">>
        ) => {
            try {
                componentLibraryManager.updateComponent(componentId, updates);
                setComponents(componentLibraryManager.getAllComponents());
            } catch (error) {
                console.error("Error updating component:", error);
                setErrorMessage(
                    "Failed to update component. Please try again."
                );
            }
        },
        []
    );

    // load the component metadata schema
    useEffect(() => {
        const loadComponentSchema = async () => {
            try {
                await schemaLoader.loadSchema(schemaUrl);
            } catch (error) {
                console.error("Failed to load component schema:", error);
                setErrorMessage("Failed to load component schema");
            }
        };

        loadComponentSchema();
    }, [schemaUrl]);

    // Load components and shapes library on mount
    useEffect(() => {
        // load components on mount
        setComponents(componentLibraryManager.getAllComponents());
        // initiatlize libraries
        const initializeLibraries = async () => {
            console.log("Initializing libraries...");
            // First make sure default library exists and is loaded
            await SVGLibraryManager.initializeDefaultLibrary();

            // Get the active library ID from localStorage or use default
            const activeLibraryId =
                localStorage.getItem("activeLibrary") || "default";
            console.log("Active library ID:", activeLibraryId);

            // Get the active library
            const library = SVGLibraryManager.getLibrary(activeLibraryId);

            if (library) {
                console.log("Setting active library:", library.id);
                setActiveLibrary(library.id);
                setSvgLibrary(library.shapes);
                // render all components if any
                componentLibraryManager.renderAllComponents(
                    canvasSize,
                    library.shapes
                );
            } else {
                // Fallback to default library if active library not found
                console.log("Falling back to default library");
                const defaultLibrary = SVGLibraryManager.getLibrary("default");
                if (defaultLibrary) {
                    setActiveLibrary("default");
                    setSvgLibrary(defaultLibrary.shapes);
                }
            }
        };

        initializeLibraries();
    }, []); // Empty dependency array - only run once on mount

    useEffect(() => {
        const { handleKeyDown } = handleKeyboardShortcuts();

        const keyDownListener = (event: KeyboardEvent) => {
            handleKeyDown(event);
        };

        window.addEventListener("keydown", keyDownListener);

        return () => {
            window.removeEventListener("keydown", keyDownListener);
        };
    }, [handleKeyboardShortcuts]);

    useEffect(() => {
        const { svgContent, processedComponents } =
            diagramComponentsLib.compileDiagram(
                diagramComponents,
                canvasSize,
                svgLibrary,
                showAttachmentPoints
            );
        setComposedSVG(svgContent);
        // Only update if the processed components are different
        if (
            !diagramComponentsLib.areComponentArraysEqual(
                processedComponents,
                diagramComponents
            )
        ) {
            setDiagramComponents(processedComponents);
        }
    }, [diagramComponents, canvasSize, svgLibrary, showAttachmentPoints]);

    useEffect(() => {
        localStorage.setItem("canvasSize", JSON.stringify(canvasSize));
    }, [canvasSize]);

    useEffect(() => {
        localStorage.setItem("fileName", fileName);
    }, [fileName]);

    useEffect(() => {
        localStorage.setItem("folderPath", folderPath);
    }, [folderPath]);

    useEffect(() => {
        localStorage.setItem(
            "showAttachmentPoints",
            showAttachmentPoints.toString()
        );
    }, [showAttachmentPoints]);

    return (
        <ImprovedLayout
            svgLibrary={svgLibrary}
            activeLibrary={activeLibrary}
            onLibraryChange={handleLibraryChange}
            diagramComponents={diagramComponents}
            components={components}
            isCopied={isCopied}
            selected3DShape={selected3DShape}
            composedSVG={composedSVG}
            onAdd3DShape={handleAdd3DShape}
            onAdd2DShape={handleAdd2DShape}
            onRemove3DShape={handleRemove3DShape}
            onRemove2DShape={handleRemove2DShape}
            onSelect3DShape={handleSelect3DShape}
            selectedPosition={selectedPosition}
            onSelectedPosition={handleSelectedPosition}
            selectedAttachmentPoint={selectedAttachmentPoint}
            onSelectedAttachmentPoint={handleSelectedAttachmentPoint}
            onCut3DShape={handleCut3DShape}
            onCopy3DShape={handleCopy3DShape}
            onCancelCut3DShape={handleCancelCut3DShape}
            onPaste3DShape={handlePaste3DShape}
            canvasSize={canvasSize}
            onSetCanvasSize={handleSetCanvasSize}
            onUpdateSvgLibrary={setSvgLibrary}
            onDownloadSVG={handleDownloadSVG}
            fileName={fileName}
            setFileName={handleSetFileName}
            availableAttachmentPoints={availableAttachmentPoints}
            errorMessage={errorMessage}
            setErrorMessage={setErrorMessage}
            onSaveDiagram={handleSaveDiagram}
            onLoadDiagram={handleLoadDiagram}
            handleLoadDiagramFromJSON={handleLoadDiagramFromJSON}
            folderPath={folderPath}
            setFolderPath={handleSetFolderPath}
            showAttachmentPoints={showAttachmentPoints}
            setShowAttachmentPoints={handleSetShowAttachmentPoints}
            onUpdateMetadata={handleUpdateMetadata}
            storageType={storageType}
            onStorageTypeChange={handleStorageTypeChange}
            onSaveAsComponent={handleSaveAsComponent}
            onAddComponent={handleAddComponent}
            onDeleteComponent={handleDeleteComponent}
        />
    );
};

export default App;
