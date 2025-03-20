import { Input } from "@/components/ui/Input";
import React from "react";

export default function EditUnifiedModel({
    fullScreenPanel,
    edit,
    setEdit
}: {
    fullScreenPanel: boolean;
    edit: {
        key: string;
        value: any[];
    };
    setEdit: React.Dispatch<
        React.SetStateAction<{
            key: string;
            value: any[];
        }>
    >;
}) {
    const editSelection = {
        Persona: "persona",
        Tasks: "outcome",
        Scenarios: "scenario",
        Steps: "step",
        Actions: "action"
    };

    return (
        <div className=" px-4 py-3">
            <div className="flex justify-between items-center mb-2">
                <h6 className={`${fullScreenPanel ? "text-lg" : "text-sm"}`}>
                    {edit.key}
                </h6>
                <button
                    onClick={() => setEdit({ key: "", value: [] })}
                    className="bg-customBlue px-[0.375rem] py-[0.125rem] rounded text-xs"
                >
                    Back
                </button>
            </div>
            <div className="flex flex-col gap-2">
                {edit.value.map((item: string, index) => (
                    <Input
                        onChange={(e) =>
                            setEdit((prev) => {
                                const newValue = [...prev.value];
                                newValue[index] = e.target.value;
                                return { ...prev, value: newValue };
                            })
                        }
                        className="flex-1"
                    />
                ))}
            </div>
        </div>
    );
}
