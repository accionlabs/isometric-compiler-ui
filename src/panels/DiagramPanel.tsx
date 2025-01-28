import { DiagramComponent, DiagramInfo } from "@/Types";
import { SquarePlus } from "lucide-react";
import React, { useState } from "react";
import SaveNewDiagram from "./SaveNewDiagram";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getDiagrams, saveDiagram, updateDiagram } from "@/services/diagrams";
import { calculateSVGBoundingBox } from "@/lib/svgUtils";
import SVGPreview from "@/components/ui/SVGPreview";
import useDebounce from "@/hooks/useDebounceHook";
export default function DiagramPanel({
    currentDiagramInfo,
    setCurrentDiagramInfo,
    diagramComponents,
    composedSVG,
    canvasSize,
    handleLoadDiagramFromJSON
}: {
    currentDiagramInfo: DiagramInfo | null;
    setCurrentDiagramInfo: (diagramInfo: DiagramInfo) => void;
    diagramComponents: DiagramComponent[];
    composedSVG: string;
    canvasSize: { width: number; height: number };
    handleLoadDiagramFromJSON: (loadedComponents: DiagramComponent[]) => void;
}) {
    const {
        data: diagrams,
        refetch,
        isLoading
    } = useQuery({
        queryKey: ["saved_diagrams"],
        queryFn: getDiagrams
    });
    const { mutate, isPending } = useMutation({
        mutationFn: saveDiagram,
        onSettled: (res) => {
            refetch();
            if (res?._id) setCurrentDiagramInfo(res);
            setIsOpen(false);
        }
    });

    const [isOpen, setIsOpen] = useState(false);

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

    const DiagramDetails = ({ result }: { result: DiagramInfo }) => {
        return (
            <li
                onClick={() => {
                    setCurrentDiagramInfo(result);
                    handleLoadDiagramFromJSON(result.diagramComponents);
                }}
                className={`flex items-center px-4 py-3 rounded-md gap-4 hover:bg-customLightGray cursor-pointer ${
                    result._id === currentDiagramInfo?._id
                        ? "bg-customLightGray"
                        : ""
                }`}
            >
                <div className="w-[76px] h-[76px]">
                    <SVGPreview
                        svgContent={result.metadata?.svgContent ?? ""}
                        className="w-full h-full object-cover bg-white"
                    />
                </div>
                <div>
                    <div className="text-white font-semibold">
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
                    <div className="w-[76px] h-[76px] bg-gray-300 rounded-md flex-shrink-0">
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
    return (
        <div className="flex flex-col h-full">
            <div className="flex-grow overflow-hidden flex flex-col">
                <div className="flex justify-between items-center p-4">
                    <h2 className="text-xl font-semibold">Diagrams</h2>
                    <button
                        onClick={() => setIsOpen(true)}
                        className="hover:bg-customLightGray rounded"
                    >
                        <SquarePlus />
                    </button>
                </div>
                <div className="flex-grow overflow-auto p-4">
                    {isLoading ? (
                        <LoaderSearchSkeleton />
                    ) : (
                        diagrams?.data.map((item) => (
                            <DiagramDetails key={item._id} result={item} />
                        ))
                    )}
                </div>
            </div>
            <SaveNewDiagram
                isOpen={isOpen}
                isPending={isPending}
                onClose={() => setIsOpen(false)}
                onSave={handleDiagramSave}
            />
        </div>
    );
}
