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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createComponent, getComponents, getShapes } from "./services/library";
import { config } from "./config";

const App: React.FC = () => {
    const queryClient = useQueryClient();

    // const [svgLibrary, setSvgLibrary] = useState<Shape[]>([]);
    const [diagramComponents, setDiagramComponents] = useState<
        DiagramComponent[]
    >([]);
    const [diagramComponentsTemp, setDiagramComponentsTemp] = useState<
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
    // const [activeLibrary, setActiveLibrary] = useState<string>(() => {
    //     const stored = localStorage.getItem("activeLibrary");
    //     return stored || "default";
    // });
    const [schemaUrl] = useState("/schemas/component-types.yaml"); // URL to your schema file
    const [storageType, setStorageType] = useState<StorageType>(
        StorageType.Local
    );

    // Add state for component library
    const [currentShapeLibraryId, setCurrentShapeLibraryId] = useState<string>(
        getLibrariesFromLocalStorage("shapes")
    );
    const [currentComponentLibraryId, setCurrentComponentLibraryId] =
        useState<string>(getLibrariesFromLocalStorage("components"));

    const [components, setComponents] = useState<Component[]>([]);

    const { data: svgShapes = [], isSuccess: isShapesLibFetched } = useQuery({
        queryKey: ["shapes", currentShapeLibraryId],
        queryFn: () => getShapes([currentShapeLibraryId])
    });
    const { data: componentsRes = [], isSuccess: isComponentsLibFetched } =
        useQuery({
            queryKey: ["components", currentComponentLibraryId],
            queryFn: () => getComponents([currentComponentLibraryId]),
            enabled: svgShapes.length > 0
        });

    const { mutate, isPending } = useMutation({
        mutationFn: createComponent,
        onError: (e) => {
            console.log("Error creating library", e);
        },
        onSuccess: (newComponent) => {
            if (newComponent) {
                if (selected3DShape) {
                    const selectedShape = diagramComponentsLib.get3DShape(
                        diagramComponents,
                        selected3DShape
                    );
                    const position = selectedShape?.position || "top";
                    const parentId =
                        selectedShape?.relativeToId || diagramComponents[0].id;
                    const updatedComponents =
                        diagramComponentsLib.remove3DShape(
                            diagramComponents,
                            selected3DShape
                        );
                    const result = diagramComponentsLib.addComponentToScene(
                        updatedComponents,
                        newComponent.name,
                        position,
                        null,
                        parentId
                    );
                    if (result.newComponent) {
                        console.log(
                            `App: replaced component ${result.newComponent.id}`
                        );
                        setDiagramComponents(result.updatedComponents);
                        updateSelected3DShape(result.newComponent);
                    } else {
                        console.error("Failed to replace new component");
                    }
                }
                return newComponent;
            }
            if (selected3DShape) {
                const selectedShape = diagramComponentsLib.get3DShape(
                    diagramComponents,
                    selected3DShape
                );
                const position = selectedShape?.position || "top";
                const parentId =
                    selectedShape?.relativeToId || diagramComponents[0].id;
                const updatedComponents = diagramComponentsLib.remove3DShape(
                    diagramComponents,
                    selected3DShape
                );
                const result = diagramComponentsLib.addComponentToScene(
                    updatedComponents,
                    newComponent.name,
                    position,
                    null,
                    parentId
                );
                if (result.newComponent) {
                    console.log(
                        `App: replaced component ${result.newComponent.id}`
                    );
                    setDiagramComponents(result.updatedComponents);
                    updateSelected3DShape(result.newComponent);
                } else {
                    console.error("Failed to replace new component");
                }
            }
            queryClient.invalidateQueries({ queryKey: ["components"] });
        }
    });
    // Update shapes when active library changes
    const handleLibraryChange = (
        libraryId: string,
        type: "components" | "shapes"
    ) => {
        if (
            type === "shapes" &&
            components?.[0].diagramComponents?.[0].libraryId !== libraryId
        ) {
            handleLibraryChange(
                components?.[0].diagramComponents?.[0].libraryId ?? "",
                "components"
            );
        }
        const key =
            type === "components"
                ? "active_components_library"
                : "active_shapes_library";
        const setLibraryId =
            type === "components"
                ? setCurrentComponentLibraryId
                : setCurrentShapeLibraryId;

        const libraryIdsString = JSON.stringify(libraryId);
        localStorage.setItem(key, libraryIdsString);
        setLibraryId(libraryId);
    };

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
    function getLibrariesFromLocalStorage(
        type: "shapes" | "components"
    ): string {
        const key =
            type === "shapes"
                ? "active_shapes_library"
                : "active_components_library";
        const defaultValue =
            type === "shapes"
                ? config.defaultShapesLibraryId
                : config.defaultComponentsLibraryId;

        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error(
                `Error parsing localStorage item for ${type}:`,
                error
            );
            return defaultValue;
        }
    }
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
                svgShapes,
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
            svgShapes,
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
        (shapeName: string, attachTo: string, libraryId: string) => {
            const updatedComponents = diagramComponentsLib.add2DShape(
                diagramComponents,
                selected3DShape,
                shapeName,
                attachTo,
                libraryId,
                selectedPosition,
                selectedAttachmentPoint
            );
            setDiagramComponents(updatedComponents);
        },
        [
            diagramComponents,
            selected3DShape,
            selectedPosition,
            selectedAttachmentPoint
        ]
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
                const parsedData = JSON.parse(loadedData);
                // Deserialize the loaded data to retrieve diagram components and library information
                const deserializedComponents =
                    diagramComponentsLib.deserializeDiagramComponents(
                        parsedData.serializedDiagramComponents
                    );
                const shapeLibIds = new Set<string>(); // To store unique IDs for source "shape"
                const componentLibIds = new Set<string>(); // To store unique IDs for source "component"
                console.log(
                    "deserializedComponentsdeserializedComponents",
                    deserializedComponents
                );
                const libraryIds = deserializedComponents.reduce(
                    (acc, component) => {
                        // Check if libraryId exists and is not null/undefined
                        if (component.libraryId) {
                            if (component.source === "shape") {
                                acc.shapeLibIds.add(
                                    component.libraryId.toString()
                                );
                            } else if (component.source === "component") {
                                acc.componentLibIds.add(
                                    component.libraryId.toString()
                                );
                            }
                        }
                        return acc;
                    },
                    {
                        shapeLibIds: new Set<string>(),
                        componentLibIds: new Set<string>()
                    }
                );

                // handleLibraryChange(
                //     Array.from(
                //         new Set([
                //             ...currentShapeLibraryId,
                //             ...Array.from(libraryIds.shapeLibIds)
                //         ])
                //     ),
                //     "shapes"
                // );
                // handleLibraryChange(
                //     Array.from(
                //         new Set([
                //             ...currentComponentLibraryId,
                //             ...Array.from(libraryIds.componentLibIds)
                //         ])
                //     ),
                //     "components"
                // );

                setDiagramComponentsTemp(deserializedComponents);
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
        [fileName, folderPath, storageType, svgShapes]
    );

    const handleLoadDiagramFromJSON = (
        loadedComponents: DiagramComponent[]
    ) => {
        console.log("Load From JSON", loadedComponents);
        const { svgContent, processedComponents } =
            diagramComponentsLib.compileDiagram(
                loadedComponents,
                canvasSize,
                svgShapes,
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
        (name: string, description: string, status: string, libId: string) => {
            try {
                if (isPending) return;

                let selectedShapes = diagramComponents;
                // if a shape is selected, then copy those shapes that are selected for saving as component
                if (selected3DShape) {
                    selectedShapes = diagramComponentsLib.copy3DShape(
                        diagramComponents,
                        selected3DShape
                    );
                }
                // Pass true for overwrite since user has already confirmed in dialog
                const newComponent = componentLibraryManager.createComponent(
                    name,
                    description,
                    selectedShapes,
                    canvasSize,
                    svgShapes,
                    true
                );
                mutate({
                    ...newComponent,
                    status: status,
                    libraryId: libId,
                    diagramComponents:
                        diagramComponentsLib.serializeDiagramComponents(
                            newComponent?.diagramComponents ?? [],
                            true
                        )
                } as Component);
                setComponents(componentLibraryManager.getAllComponents());
            } catch (error) {
                console.error("Error saving component:", error);
                setErrorMessage("Failed to save component. Please try again.");
                return null;
            }
        },
        [diagramComponents, selected3DShape, canvasSize, svgShapes]
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

    const handleDownloadOfNecessaryShapesLibsForComponents = () => {
        const librariesUsedInAllComponents =
            componentLibraryManager.extractUniqueLibraryIds(componentsRes);
        const librariesrequiredToDownload = Array.from(
            new Set([...currentShapeLibraryId, ...librariesUsedInAllComponents])
        );

        if (librariesrequiredToDownload.length > currentShapeLibraryId.length) {
            // handleLibraryChange(librariesrequiredToDownload, "shapes");
        }
        componentLibraryManager.clearLibrary();
        componentLibraryManager.deserializeComponentLib(componentsRes);
        setComponents(componentLibraryManager.getAllComponents());
    };

    useEffect(() => {
        // Trigger downloading necessary shape libraries when components are loaded
        if (componentsRes.length > 0) {
            handleDownloadOfNecessaryShapesLibsForComponents();
        } else {
            componentLibraryManager.clearLibrary();
            setComponents([]);
        }
    }, [componentsRes]);

    useEffect(() => {
        //trigger for setting diagram components when onload diagram
        // Check if all necessary conditions are met to set diagram components
        const canSetDiagramComponents =
            diagramComponentsTemp.length > 0 &&
            isShapesLibFetched &&
            isComponentsLibFetched;

        if (canSetDiagramComponents) {
            // Set diagram components and clear temporary storage
            setDiagramComponents(diagramComponentsTemp);
            setDiagramComponentsTemp([]);
        }
    }, [diagramComponentsTemp, isShapesLibFetched, isComponentsLibFetched]);

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
                svgShapes,
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
    }, [diagramComponents, canvasSize, svgShapes, showAttachmentPoints]);

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
            svgLibrary={svgShapes}
            activeShapesLibrary={currentShapeLibraryId}
            activeComponentsLibrary={currentComponentLibraryId}
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
            onUpdateSvgLibrary={() => {}}
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
