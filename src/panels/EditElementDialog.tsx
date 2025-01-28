// @/components/LibraryManagerDialog.tsx

import React, { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/Dialog";
import LibraryManager from "@/panels/LibraryManager";
import { Component, Shape, UnifiedElement } from "@/Types";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { processSVGFile } from "@/lib/svgUtils";
import ChipInput from "@/components/ui/Chip";
import { getCategoriesFlat } from "@/services/categories";
import { RadixSelect } from "@/components/ui/Select";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { updateShapesComponent } from "@/services/shapes";
import { Textarea } from "@/components/ui/Textarea";

interface LibraryManagerDialogProps {
    isOpen: boolean;
    onClose: () => void;
    activeCategory: string;
    element: UnifiedElement;
}

const EditElementDialog: React.FC<LibraryManagerDialogProps> = ({
    isOpen,
    onClose,
    activeCategory,
    element
}) => {
    const [elementData, setElementData] = useState(element);
    const [category, setCategory] = useState<string>('');
        const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<string>(elementData.status || 'active'); 
    const queryClient = useQueryClient();

    
    const { data: categories } = useQuery({
            queryKey: ["categories_data_flat"],
            queryFn: getCategoriesFlat
        });

        useEffect(()=>{
            categories?.data.forEach((category)=>{
                if(category.path == elementData.path){
                    setCategory(category._id)
                }
            })
        }, [elementData, categories])

   
    const {mutate: shapeComponentMutation, isPending: isShapeMutationPending} = useMutation({mutationFn: updateShapesComponent, mutationKey:  ['updatedShape']})

   
    // Update tags handler
    const handleTagsChange = (updatedTags: string[]) => {
        setElementData((prev) => ({
            ...prev,
            tags: updatedTags
        }));
    };

    const handleStatusChange = (newStatus: string) => {
        setStatus(newStatus);
        setElementData((prev)=> ({
            ...prev,
            status: newStatus as "active" | "inactive"
        }))
    };
    
    const handleSubmit = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        if (!category.trim()) {
            setError("Category is required");
            return;
        }
        e.preventDefault()
        shapeComponentMutation({...elementData, category},{onSuccess:()=>{
            queryClient.setQueryData(['shapes_data', activeCategory], (oldData: { 
                shapes: Shape[];
                components: Component[];
                total: number;
            }) => {

                if (!oldData) return; // Ensure oldData exists
                const updatedShapes = oldData.shapes.map((shape) =>
                    shape.name === elementData.name ? ({...elementData, 
                        path: categories?.data.find((el)=>category == el._id)?.path
                    } as Shape) : shape
    
                  );
                
                  const updatedComponents = oldData.components.map((component) =>
                    component.name === elementData.name ? ({...elementData, 
                        path: categories?.data.find((el)=>category == el._id)?.path
                    } as Component) : component
                  );
                  return {shapes: updatedShapes, components: updatedComponents, total: oldData.total}
              });
            onClose()
        }})
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-[800px] max-h-[80vh] bg-gray-800 text-white overflow-hidden">
                <DialogHeader className="px-6 py-4">
                    <DialogTitle>Update : {elementData.name}</DialogTitle>
                </DialogHeader>

                <form className="space-y-4 mt-4">
 
                    {/* Version Field */}

                    <div>
                        <Label  className="block text-sm font-medium text-gray-200 mb-1">Version</Label>
                        <Input
                            value={elementData.version || ""}
                            onChange={(e) =>
                                setElementData((prev) => ({
                                    ...prev,
                                    version: e.target.value
                                }))
                            }
                            className="w-full bg-gray-700 text-white border-gray-600"
                        />
                    </div>


                    {/* Tags Field */}

                    <div >
                        <Label  className="block text-sm font-medium text-gray-200 mb-1">Tags</Label>
                        <ChipInput
                            id="tags-input"
                            currentValue={elementData.tags || []}
                            handleNewSkill={handleTagsChange}
                            placeholder="Add tags and press Enter"
                            label="Tags"
                        />
                    </div>

                    <div>
                        <Label className="block text-sm font-medium text-gray-200 mb-1">Description</Label>
                        <Textarea
                            id="description"
                            value={elementData.description}
                            onChange={(e) =>
                                setElementData((prev) => ({
                                    ...prev,
                                    description: e.target.value
                                }))
                            }
                            autoComplete="off"
                            placeholder="Enter description"
                            aria-describedby="description of element"
                            className="w-full  text-white bg-customLightGray"
                        />
                    </div>


                    <div>
                        <Label  className="block text-sm font-medium text-gray-200 mb-1">Category</Label>
                        <RadixSelect
                            options={
                                categories?.data.map((category) => ({
                                    label: category.name,
                                    value: category._id
                                })) ?? []
                            }
                            value={category}
                            onChange={(value) => setCategory(value)}
                            placeholder="Select categoty"
                        />
                        {error && (
                                <div className="text-red-400 text-sm mt-1">
                                    {error}
                                </div>
                            )}
                    </div>

                     {/* Status Field */}
                     <div>
                        <Label  className="block text-sm font-medium text-gray-200 mb-1">Status</Label>
                        <RadixSelect
                            options={[
                                { label: "Active", value: "active" },
                                { label: "Inactive", value: "inactive" }
                            ]}
                            value={status}
                            onChange={handleStatusChange}
                            placeholder="Select status"
                        />
                    </div>

                    {"type" in elementData && (
                        <div className="space-y-2 text-white">
                            <Label>upload svg</Label>
                            <Input
                                type="file"
                                accept=".svg"
                                onChange={async (e) => {
                                    if (e.target.files?.[0]) {
                                        const svg = await processSVGFile(
                                            e.target.files[0]
                                        );
                                        setElementData((prev) => ({
                                            ...prev,
                                            svgContent: svg || ""
                                        }));
                                    }
                                }}
                                className="w-full bg-gray-700 text-white border-gray-600"
                                aria-describedby="upload new svg"
                            />
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            className="bg-gray-700 hover:bg-gray-600"
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                        <Button
                        onClick={handleSubmit}
                        disabled={isShapeMutationPending}
                        >Update</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default EditElementDialog;
