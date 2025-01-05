import { useState } from "react";
import categoriesData from "../../assets/categories.json";
import { Category } from "@/Types";
import { Folder, Grid, List } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getCategories } from "@/services/categories";

const CategoryMapper = () => {
    // const { data: categories } = useQuery({
    //     queryKey: ["categories_data"],
    //     queryFn: getCategories
    // });
    const [layout, setLayout] = useState("list");
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
        new Set()
    );

    const toggleCategory = (id: string) => {
        setExpandedCategories((prev) => {
            const newExpanded = new Set(prev);
            if (newExpanded.has(id)) {
                newExpanded.delete(id);
            } else {
                newExpanded.add(id);
            }
            return newExpanded;
        });
    };

    const renderCategories = (categories: Category[], level = 0) => {
        return categories.map((category) => (
            <div key={category._id}>
                <div className="flex items-center justify-between bg-customGray text-white py-1 px-2">
                    {/* Left Section: Icon and Text */}

                    <div className="flex items-center space-x-1">
                        {category.allDescendants?.length > 0 && (
                            <button
                                onClick={() => toggleCategory(category._id)}
                                className="p-2 bg-customGray rounded hover:bg-gray-600"
                            >
                                {expandedCategories.has(category._id)
                                    ? "▼"
                                    : "▶"}
                            </button>
                        )}
                        <div className="flex items-center space-x-3 hover:bg-customLightGray p-2 rounded-lg cursor-pointer">
                            {/* Folder Icon */}
                            <Folder className="p-2 rounded" size={"40px"} />

                            {/* Title and Subtitle */}
                            <div>
                                <h3 className="text-base">{category.name}</h3>
                                <p className="text-sm">54 shapes</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Section: view button */}

                    {/* <button
                            onClick={() => toggleCategory(category._id)}
                            className="p-2 bg-gray-700 rounded hover:bg-gray-600"
                        >
                          view
                        </button>
                */}
                </div>
                {/* <div className="flex items-center p-2 rounded-lg hover:bg-customLightGray cursor-pointer shadow-sm mb-2">
                    <span className="mr-2 text-white"></span>
                    <span className="text-white font-medium flex-1"></span>
                    <button
                        className="ml-auto px-3 py-1 text-sm font-medium text-white bg-blue-500 rounded hover:bg-customLightGray"
                        onClick={(e) => {
                            e.stopPropagation(); // Prevents triggering category toggle
                            alert(`Viewing category: ${category.name}`);
                        }}
                    >
                        View
                    </button>
                </div> */}
                {expandedCategories.has(category._id) &&
                    category.allDescendants.length > 0 && (
                        <div className="ml-6 mt-2 border-l-2 border-gray-300 pl-4">
                            {renderCategories(
                                category.allDescendants,
                                level + 1
                            )}
                        </div>
                    )}
            </div>
        ));
    };

    return (
        <div className="border-t-2 border-customBorderColor">
            <div className="flex items-center justify-between bg-customGray text-white p-4 rounded-lg ">
                <h1 className="text-lg text-white ">Categories</h1>

                <div className="flex items-center">
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
                <div className="h-[40vh] overflow-y-auto">
                    {renderCategories(categoriesData.categories as Category[])}
                </div>
            </div>
        </div>
    );
};

export default CategoryMapper;
