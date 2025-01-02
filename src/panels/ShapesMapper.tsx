import { Grid, List } from "lucide-react";
import { useState } from "react";

export default function ShapesMapper() {
    const [layout, setLayout] = useState("grid");
    return (
        <div className="border-t-2 border-customBorderColor">
            <div className="flex items-center justify-between bg-customGray text-white p-4 rounded-lg ">
                <h1 className="text-lg text-white ">Shapes</h1>

                <div className="flex items-center ">
                    <button
                        onClick={() => setLayout("list")}
                        className={`p-2 rounded hover:bg-customLightGray ${
                            layout === "list"
                                ? "bg-customLightGray"
                                : "bg-customGray"
                        }`}
                    >
                        <List />
                    </button>

                    <button
                        onClick={() => setLayout("grid")}
                        className={`p-2 rounded hover:bg-customLightGray ${
                            layout === "grid"
                                ? "bg-customLightGray"
                                : "bg-customGray"
                        }`}
                    >
                        <Grid />
                    </button>
                </div>
            </div>
            <div className="mx-auto bg-customGray  rounded-lg shadow-lg ">
                <div className="flex h-[40vh] overflow-y-auto justify-center items-center">
                    <h2 className="text-white text-sm">
                        Select any category to see shapes
                    </h2>
                </div>
            </div>
        </div>
    );
}
