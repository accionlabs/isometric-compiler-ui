import React, { useState, useMemo, useEffect } from "react";
import { Button } from "../components/ui/Button";
import { CanvasSize, DiagramComponent, Shape, Component } from "../Types";
import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent
} from "../components/ui/Accordion";
import SVGPreview from "../components/ui/SVGPreview";
import { SVGLibraryManager } from "../lib/svgLibraryUtils";
import { componentLibraryManager } from "../lib/componentLib";
import { updateComponent, updateShape } from "@/services/library";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/Checkbox";

interface ShapesPanelProps {
    svgLibrary: Shape[];
    canvasSize: CanvasSize;
    onAdd3DShape: (shapeName: string) => void;
    onAdd2DShape: (
        shapeName: string,
        attachTo: string,
        libraryId: string
    ) => void;
    onAddComponent: (componentId: string) => void;
    onDeleteComponent: (componentId: string) => void;
    selected3DShape: string | null;
    diagramComponents: DiagramComponent[];
    components: Component[];
}

const ShapesPanel: React.FC<ShapesPanelProps> = ({
    svgLibrary,
    canvasSize,
    onAdd3DShape,
    onAdd2DShape,
    onAddComponent,
    onDeleteComponent,
    selected3DShape,
    diagramComponents,
    components
}) => {
    const queryClient = useQueryClient();
    const { mutate, isPending } = useMutation({
        mutationFn: (payload: Shape) => {
            return updateShape(payload);
        }
    });
    const { mutate: update, isPending: isUpdatePending } = useMutation({
        mutationFn: updateComponent
    });

    const [openPanels, setOpenPanels] = useState<string>("components");
    const [isShapeEditDialogOpen, setIsShapeEditDialogOpen] = useState(false);
    const [isComponentEditDialogOpen, setIsComponentEditDialogOpen] =
        useState(false);
    const [shapeToEdit, setShapeToEdit] = useState<Shape | undefined>(
        undefined
    );
    const [componentToEdit, setComponentToEdit] = useState<
        Component | undefined
    >(undefined);
    const shouldDisable3DShapeButtons = () => {
        return diagramComponents.length > 0 && selected3DShape === null;
    };

    const handleAccordionChange = (value: string) => {
        setOpenPanels(value);
    };

    const handleDeleteComponent = (componentId: string) => {
        setComponentToEdit(undefined);
        // TODO: check if this component is inserted in diagramComponents and do not allow delete
        onDeleteComponent(componentId);
    };
    const processSVGFile = async (svgFile: File): Promise<string> => {
        try {
            // Read the content of the SVG file as a string
            const svgContent = await SVGLibraryManager.readFileAsText(svgFile);
            return svgContent;
        } catch (error) {
            console.error("Error processing SVG file:", error);
            throw new Error("Failed to read SVG file content.");
        }
    };

    const handleUpdate3D2DShape = () => {
        shapeToEdit?.name &&
            mutate(shapeToEdit, {
                onSettled: () => {
                    queryClient.invalidateQueries({ queryKey: ["shapes"] });
                    setIsShapeEditDialogOpen(false);
                }
            });
    };

    const handleUpdateComponent = () => {
        componentToEdit?.name &&
            update(componentToEdit, {
                onSettled: () => {
                    queryClient.invalidateQueries({ queryKey: ["components"] });
                    setIsComponentEditDialogOpen(false);
                }
            });
    };

    // Temporary function to show SVG preview content for a component
    const getComponentPreview = (component: Component): string => {
        if (!component.svgContent || component.svgContent === "") {
            return componentLibraryManager.renderComponent(
                component.id,
                canvasSize,
                svgLibrary
            );
        }
        return component.svgContent;
    };

    const render3DShapesContent = () => (
        <div className="space-y-2">
            <div className="overflow-auto">
                <table className="w-full">
                    <thead className="sticky top-0 bg-gray-800">
                        <tr>
                            <th className="text-left">Preview</th>
                            <th className="text-left">Name</th>
                            <th className="w-20 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {svgLibrary
                            .filter((shape) => shape.type === "3D")
                            .map((shape) => (
                                <tr key={shape.name}>
                                    <td className="w-16">
                                        <SVGPreview
                                            svgContent={shape.svgContent}
                                            className="w-12 h-12 mr-2"
                                        />
                                    </td>
                                    <td>{shape.name}</td>
                                    <td className="text-right flex gap-1">
                                        <Button
                                            onClick={() => {
                                                setShapeToEdit(shape);
                                                setIsShapeEditDialogOpen(true);
                                            }}
                                            disabled={shouldDisable3DShapeButtons()}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            onClick={() =>
                                                onAdd3DShape(shape.name)
                                            }
                                            disabled={
                                                shape.status !== "active" ||
                                                shouldDisable3DShapeButtons()
                                            }
                                        >
                                            Add
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderComponentsContent = () => (
        <div className="space-y-2">
            <div className="overflow-auto">
                {components.length === 0 ? (
                    <div className="text-center text-gray-400 py-4">
                        No components available. Save a composition to create
                        components.
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="sticky top-0 bg-gray-800">
                            <tr>
                                <th className="text-left">Preview</th>
                                <th className="text-left">Name</th>
                                <th className="text-left">Description</th>
                                <th className="w-40 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {components.map((component) => (
                                <tr key={component.id}>
                                    <td className="w-16">
                                        <SVGPreview
                                            svgContent={getComponentPreview(
                                                component
                                            )}
                                            className="w-12 h-12 mr-2"
                                        />
                                    </td>
                                    <td>{component.name}</td>
                                    <td className="text-gray-400">
                                        {component.description}
                                    </td>
                                    <td className="text-right">
                                        <Button
                                            onClick={() => {
                                                setComponentToEdit(component);
                                                setIsComponentEditDialogOpen(
                                                    true
                                                );
                                            }}
                                            className="mr-2"
                                        >
                                            Edit
                                        </Button>
                                        {/* <Button
                                            onClick={() =>
                                                handleDeleteComponent(
                                                    component.id
                                                )
                                            }
                                            className="mr-2"
                                        >
                                            Del
                                        </Button> */}
                                        <Button
                                            onClick={() =>
                                                onAddComponent(component.id)
                                            }
                                            disabled={
                                                (component.status &&
                                                    component.status !==
                                                        "active") ||
                                                shouldDisable3DShapeButtons()
                                            }
                                        >
                                            Add
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );

    const render2DShapesContent = () => (
        <div className="overflow-auto">
            <table className="w-full">
                <thead className="sticky top-0 bg-gray-800">
                    <tr>
                        <th className="text-left">Preview</th>
                        <th className="text-left">Name</th>
                        <th className="text-left">Attach To</th>
                        <th className="w-20 text-right">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {svgLibrary
                        .filter((shape) => shape.type === "2D")
                        .map((shape) => (
                            <tr key={shape.name}>
                                <td className="w-16">
                                    <SVGPreview
                                        svgContent={shape.svgContent}
                                        className="w-12 h-12 mr-2"
                                    />
                                </td>
                                <td>{shape.name}</td>
                                <td>{shape.attachTo}</td>
                                <td className="text-right flex gap-1">
                                    <Button
                                        onClick={() => {
                                            setShapeToEdit(shape);
                                            setIsShapeEditDialogOpen(true);
                                        }}
                                    >
                                        Edit
                                    </Button>
                                    <Button
                                        onClick={() =>
                                            onAdd2DShape(
                                                shape.name,
                                                shape.attachTo || "",
                                                shape.libraryId
                                            )
                                        }
                                        disabled={
                                            shape.status !== "active" ||
                                            selected3DShape === null
                                        }
                                    >
                                        Add
                                    </Button>
                                </td>
                            </tr>
                        ))}
                </tbody>
            </table>
        </div>
    );

    const renderEditShapeDialog = () => (
        <Dialog
            open={isShapeEditDialogOpen}
            onOpenChange={(state) => setIsShapeEditDialogOpen(state)}
        >
            <DialogContent
                aria-describedby="dialog-header"
                className="bg-gray-800 border border-gray-700"
            >
                <DialogHeader>
                    <DialogTitle className="text-white">
                        {"Edit Shape - " + shapeToEdit?.name}
                    </DialogTitle>
                </DialogHeader>

                <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">
                        Shape Description
                    </label>
                    <Input
                        placeholder="My Custom Library"
                        className="w-full bg-gray-700 text-white border-gray-600"
                        value={shapeToEdit?.description ?? ""}
                        onChange={(e) =>
                            setShapeToEdit((prev) => {
                                if (prev)
                                    return {
                                        ...prev,
                                        description: e.target.value
                                    };
                            })
                        }
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">
                        SVG File
                    </label>
                    <Input
                        onChange={async (e) => {
                            const files = Array.from(e.target.files || []);
                            if (files[0]) {
                                const svgContent = await processSVGFile(
                                    files[0]
                                );
                                setShapeToEdit(
                                    (prev) =>
                                        prev && {
                                            ...prev,
                                            svgContent
                                        }
                                );
                            }
                        }}
                        type="file"
                        accept=".svg"
                        className="w-full bg-gray-700 text-white border-gray-600"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">
                        Toggle Shape State
                    </label>
                    <div className="flex gap-2 ">
                        <Checkbox
                            id="show-shape-active-state"
                            className="text-white mt-0.5"
                            checked={shapeToEdit?.status === "active"}
                            onCheckedChange={(checked) =>
                                setShapeToEdit(
                                    (prev) =>
                                        prev && {
                                            ...prev,
                                            status: (checked as boolean)
                                                ? "active"
                                                : "inactive"
                                        }
                                )
                            }
                        />
                        <span className="block text-sm font-medium text-gray-200">
                            {shapeToEdit?.status}
                        </span>
                    </div>
                </div>
                <SVGPreview
                    svgContent={shapeToEdit?.svgContent ?? ""}
                    className="w-full"
                />
                <div className="flex justify-end space-x-2">
                    <Button
                        onClick={() => setIsShapeEditDialogOpen(false)}
                        className="bg-gray-600 hover:bg-gray-700 text-white"
                    >
                        Cancel
                    </Button>
                    <Button
                        disabled={isPending}
                        onClick={handleUpdate3D2DShape}
                        className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-800 disabled:opacity-50"
                    >
                        Confirm
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );

    const renderEditComponentDialog = () => (
        <Dialog
            open={isComponentEditDialogOpen}
            onOpenChange={(state) => setIsComponentEditDialogOpen(state)}
        >
            <DialogContent
                aria-describedby="dialog-header"
                className="bg-gray-800 border border-gray-700"
            >
                <DialogHeader>
                    <DialogTitle className="text-white">
                        {"Edit Component - " + componentToEdit?.name}
                    </DialogTitle>
                </DialogHeader>
                <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">
                        Component Description
                    </label>
                    <Input
                        placeholder="My Custom Library"
                        className="w-full bg-gray-700 text-white border-gray-600"
                        value={componentToEdit?.description ?? ""}
                        onChange={(e) =>
                            setComponentToEdit(
                                (prev) =>
                                    prev && {
                                        ...prev,
                                        description: e.target.value
                                    }
                            )
                        }
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">
                        Toggle Component State
                    </label>
                    <div className="flex gap-2 ">
                        <Checkbox
                            id="show-shape-active-state"
                            className="text-white mt-0.5"
                            checked={componentToEdit?.status === "active"}
                            onCheckedChange={(checked) =>
                                setComponentToEdit(
                                    (prev) =>
                                        prev && {
                                            ...prev,
                                            status: (checked as boolean)
                                                ? "active"
                                                : "inactive"
                                        }
                                )
                            }
                        />
                        <span className="block text-sm font-medium text-gray-200">
                            {componentToEdit?.status || "inactive"}
                        </span>
                    </div>
                </div>
                <div className="w-full h-96 bg-white border border-gray-200 rounded-lg shadow-md overflow-auto">
                    <SVGPreview
                        svgContent={
                            componentToEdit
                                ? getComponentPreview(componentToEdit)
                                : ""
                        }
                        className="w-full h-full"
                    />
                </div>

                <div className="flex justify-end space-x-2">
                    <Button
                        onClick={() => setIsComponentEditDialogOpen(false)}
                        className="bg-gray-600 hover:bg-gray-700 text-white"
                    >
                        Cancel
                    </Button>
                    <Button
                        disabled={isUpdatePending}
                        onClick={handleUpdateComponent}
                        className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-800 disabled:opacity-50"
                    >
                        Confirm
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
    const accordionItems = [
        {
            name: "3D Shapes",
            value: "3d-shapes",
            render: render3DShapesContent
        },
        {
            name: "Components",
            value: "components",
            render: renderComponentsContent
        },
        { name: "2D Shapes", value: "2d-shapes", render: render2DShapesContent }
    ];
    return (
        <div className="flex flex-col h-full">
            <Accordion
                type="single"
                collapsible
                value={openPanels}
                onValueChange={handleAccordionChange}
                className="flex flex-col h-full"
            >
                <div className="flex flex-col h-full">
                    {accordionItems.map((item) => (
                        <AccordionItem
                            key={item.value}
                            value={item.value}
                            className="flex flex-col min-h-12 border-b border-gray-500"
                        >
                            <AccordionTrigger className="p-2 text-xl font-semibold">
                                {item.name}
                            </AccordionTrigger>
                            <AccordionContent className="flex-grow overflow-auto">
                                <div className="p-2">{item.render()}</div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </div>
            </Accordion>
            {renderEditShapeDialog()}

            {renderEditComponentDialog()}
        </div>
    );
};

export default ShapesPanel;
