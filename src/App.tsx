import React, { useState, useEffect, useCallback } from "react";
import { Shape, DiagramComponent, Component } from "./Types";
import ImprovedLayout from "./ImprovedLayout";
import { cleanupSVG, clipSVGToContents } from "./lib/svgUtils";
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
    const [boundingBox, setBoundingBox] = useState<{
        x: number;
        y: number;
        width: number;
        height: number;
    } | null>(null);
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
            console.log(`App: set selected ${selectedComponent.id}`);
        } else {
            console.log("App: cannot select", selectedComponent);
            setAvailableAttachmentPoints([]);
        }
    };

    const handleSelect3DShape = useCallback(
        (id: string | null) => {
            console.log(`App: Select component ${id}`);
            console.log("App: diagram components", diagramComponents);
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
                console.log(`App: position: ${position}`);
                setSelectedPosition(position);
            }
        },
        [setSelectedPosition, selectedPosition]
    );

    const handleSelectedAttachmentPoint = useCallback(
        (point: string | null) => {
            if (point) {
                console.log(`App: atttachment point: ${point}`);
                setSelectedAttachmentPoint(point);
            }
        },
        [setSelectedAttachmentPoint, selectedAttachmentPoint]
    );

    const handleAdd3DShape = useCallback(
        (shapeName: string) => {
            console.log(
                `App: add3DShape ${selectedPosition} ${selectedAttachmentPoint}`
            );
            const result = diagramComponentsLib.add3DShape(
                diagramComponents,
                svgLibrary,
                shapeName,
                selectedPosition,
                selectedAttachmentPoint,
                selected3DShape
            );

            if (result.newComponent) {
                console.log(`App: added 3D Shape ${result.newComponent.id}`);
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
            console.log(
                `App: add component ${componentId}`,
                selectedPosition,
                selectedAttachmentPoint
            );
            const result = diagramComponentsLib.addComponentToScene(
                diagramComponents,
                componentId,
                selectedPosition,
                selectedAttachmentPoint,
                selected3DShape
            );
            if (result.newComponent) {
                console.log(`App: added component ${result.newComponent.id}`);
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
                attachTo
            );
            setDiagramComponents(updatedComponents);
        },
        [diagramComponents, selected3DShape]
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
            const serializedData =
                diagramComponentsLib.serializeDiagramComponents(
                    diagramComponents,
                    components
                );
            await saveFile(
                storageType,
                jsonFileName,
                serializedData,
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
            console.log("handleLoadDiagram called with:", fileOrPath); // Debug log
            console.log("Current storage type:", storageType); // Debug log

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
                // Deserialize the loaded data to retrieve diagram components and library information
                const loadedComponents =
                    diagramComponentsLib.deserializeDiagramComponents(
                        loadedData
                    );
                // Load each component from the serialized component library into the component manager
                loadedComponents.serializedComponentLibrary.forEach(
                    (component) => {
                        componentLibraryManager.loadPremadeComponent(
                            component,
                            true
                        );
                    }
                );

                setComponents(componentLibraryManager.getAllComponents());
                setDiagramComponents(loadedComponents.serializedComponents);
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
        console.log("Load From JSON", loadedComponents);
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

    // get the bounding box for clipping the SVG to the content
    const handleGetBoundingBox = useCallback(
        (
            newBoundingBox: {
                x: number;
                y: number;
                width: number;
                height: number;
            } | null
        ) => {
            setBoundingBox(newBoundingBox);
        },
        []
    );

    const handleDownloadSVG = useCallback(() => {
        let svgToDownload: string;
        if (boundingBox) {
            svgToDownload = clipSVGToContents(composedSVG, boundingBox);
        } else {
            svgToDownload = cleanupSVG(composedSVG);
            svgToDownload = `<svg xmlns="http://www.w3.org/2000/svg">${svgToDownload}</svg>`;
        }

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
    }, [composedSVG, fileName, boundingBox]);

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
        (
            name: string,
            description: string,
            components?: DiagramComponent[]
        ) => {
            try {
                // Pass true for overwrite since user has already confirmed in dialog
                const newComponent = componentLibraryManager.createComponent(
                    name,
                    description,
                    components || diagramComponents,
                    true
                );

                if (newComponent) {
                    componentLibraryManager.renderComponent(
                        newComponent.id,
                        canvasSize,
                        svgLibrary
                    );
                    setComponents(componentLibraryManager.getAllComponents());
                    return newComponent;
                }
                return null;
            } catch (error) {
                console.error("Error saving component:", error);
                setErrorMessage("Failed to save component. Please try again.");
                return null;
            }
        },
        [diagramComponents, canvasSize, svgLibrary]
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
            onGetBoundingBox={handleGetBoundingBox}
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

const compooo: Component = {
    id: "group-1",
    name: "group-1",
    description: "",
    attachmentPoints: [
        {
            name: "attach-back-left",
            x: 514.153503,
            y: 517.309624
        },
        {
            name: "attach-back-right",
            x: 553.343536,
            y: 517.316872
        },
        {
            name: "attach-front-right",
            x: 550.873039,
            y: 538.170723
        },
        {
            name: "attach-front-left",
            x: 515.58271,
            y: 538.845299
        },
        {
            name: "attach-bottom",
            x: 532.916672,
            y: 542.742165
        },
        {
            name: "attach-top",
            x: 532.92057,
            y: 495.981515
        }
    ],
    created: new Date("2024-11-18T15:51:26.802Z"),
    lastModified: new Date("2024-11-18T15:51:26.802Z"),
    diagramComponents: [
        {
            id: "shape-1731945070002-1whwxao0m",
            shape: "service",
            position: "top",
            source: "3D",
            relativeToId: null,
            attached2DShapes: [],
            attachmentPoints: [
                {
                    name: "attach-back-left",
                    x: 14.153503,
                    y: 17.309624
                },
                {
                    name: "attach-back-right",
                    x: 53.343536,
                    y: 17.316872
                },
                {
                    name: "attach-front-right",
                    x: 50.873039,
                    y: 38.170723
                },
                {
                    name: "attach-front-left",
                    x: 15.58271,
                    y: 38.845299
                },
                {
                    name: "attach-bottom",
                    x: 32.916672,
                    y: 42.742165
                },
                {
                    name: "attach-top",
                    x: 32.918617,
                    y: 19.361839
                }
            ]
        },
        {
            id: "shape-1731945070337-s4tv1uni8",
            shape: "database",
            position: "top",
            source: "3D",
            relativeToId: "shape-1731945070002-1whwxao0m",
            attached2DShapes: [
                {
                    name: "process",
                    attachedTo: "top"
                }
            ],
            attachmentPoints: [
                {
                    name: "attach-back-left",
                    x: 5.7323637,
                    y: 13.059323
                },
                {
                    name: "attach-back-right",
                    x: 44.922405,
                    y: 13.066586
                },
                {
                    name: "attach-front-right",
                    x: 42.451908,
                    y: 33.920422
                },
                {
                    name: "attach-front-left",
                    x: 7.1615705,
                    y: 34.594997
                },
                {
                    name: "attach-bottom",
                    x: 24.495531,
                    y: 38.491863
                },
                {
                    name: "attach-top",
                    x: 24.497484,
                    y: 15.111539
                }
            ]
        }
    ]
};
