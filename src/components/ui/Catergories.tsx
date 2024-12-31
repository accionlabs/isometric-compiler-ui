import React, { useState } from "react";
import categoriesData from "../../assets/categories.json";

type Category = {
    _id: string;
    createdAt: string;
    updatedAt: string;
    status: string;
    name: string;
    description: string | null;
    parent: string | null;
    path: string;
    metadata: {
        displayOrder: number;
        icon: string;
        customProperties: {
            color: string;
            size: string;
        };
    } | null;
    ancestors: string[];
    children: Category[];
};

const CategoryMapper = () => {
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
            <div key={category._id} className={`ml-${level * 5}`}>
                <div
                    onClick={() => toggleCategory(category._id)}
                    className="flex items-center p-2 bg-gray-100 rounded-lg hover:bg-gray-200 cursor-pointer shadow-sm mb-2"
                >
                    <span className="mr-2 text-gray-600">
                        {category.children.length > 0
                            ? expandedCategories.has(category._id)
                                ? "▼"
                                : "▶"
                            : null}
                    </span>
                    <span className="text-gray-800 font-medium flex-1">
                        {category.name}
                    </span>
                    <button
                        className="ml-auto px-3 py-1 text-sm font-medium text-white bg-blue-500 rounded hover:bg-blue-600"
                        onClick={(e) => {
                            e.stopPropagation(); // Prevents triggering category toggle
                            alert(`Viewing category: ${category.name}`);
                        }}
                    >
                        View
                    </button>
                </div>
                {expandedCategories.has(category._id) &&
                    category.children.length > 0 && (
                        <div className="ml-6 mt-2 border-l-2 border-gray-300 pl-4">
                            {renderCategories(category.children, level + 1)}
                        </div>
                    )}
            </div>
        ));
    };

    return (
        <div className="p-6 min-h-screen">
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-4">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                    Categories
                </h1>
                <div className="h-[40vh] overflow-y-auto border border-gray-300 rounded-lg p-4">
                    {renderCategories(categoriesData.categories)}
                </div>
            </div>
        </div>
    );
};

export default CategoryMapper;
