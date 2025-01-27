import { DiagramComponent, DiagramInfo } from "@/Types";
import { SquarePlus } from "lucide-react";
import React, { useState } from "react";
import SaveNewDiagram from "./SaveNewDiagram";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getDiagrams, saveDiagram } from "@/services/diagrams";

export default function DiagramPanel({
    diagramComponents
}: {
    diagramComponents: DiagramComponent[];
}) {
    const { data: diagrams, refetch } = useQuery({
        queryKey: ["saved-diagrams"],
        queryFn: getDiagrams
    });
    const { mutate } = useMutation({
        mutationFn: saveDiagram,
        onSettled: () => refetch()
    });
    const [isOpen, setIsOpen] = useState(false);
    const [currentDiagramInfo, setCurrentDiagramInfo] =
        useState<DiagramInfo | null>(null);

    const handleDiagramSave = (name: string, description: string) =>
        mutate({ name, description, diagramComponents });

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
                    {diagrams?.data.map((item) => (
                        <div key={item._id} className="space-y-4">
                            {item.name}
                        </div>
                    ))}
                </div>
            </div>
            <SaveNewDiagram
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                onSave={handleDiagramSave}
            />
        </div>
    );
}
