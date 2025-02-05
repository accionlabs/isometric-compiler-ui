import { MenuIcon } from "@/components/ui/IconGroup";
import { useState } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Category } from "@/Types";

export default function CategoriesPanel({
    categories,
    onCategoryChange
}: {
    categories: Category[];
    onCategoryChange: (id: string) => void;
}) {
    const [selected, setSelected] = useState<Category>(categories[0]);
    const [selectedChild, setSelectedChild] = useState<Category | null>();
    const [currentChildren, setCurrentChildren] = useState<Category[]>(
        categories[0].children || []
    );
    const [parentHistory, setParentHistory] = useState<string[]>([]);

    const categoryMap: Record<string, Category> = {};
    categories.forEach((cat) => {
        if (cat.children) {
            cat.children.forEach((child) => {
                child.parent = cat._id;
                categoryMap[child._id] = child;
            });
        }
        categoryMap[cat._id] = cat;
    });

    const handleSelect = (category: Category) => {
        // onCategoryChange(category._id);
        if (selected._id === category._id) {
            setSelectedChild(null);
            return;
        }
        if (category.children && category.children.length > 0) {
            setParentHistory([...parentHistory, selected._id]); // Store previous parent
            setSelected(category);

            setCurrentChildren(category.children);
            setSelectedChild(null);
        } else {
            setSelectedChild(category);
        }
    };

    const handleBack = () => {
        if (parentHistory.length > 0) {
            const previousParentId = parentHistory[parentHistory.length - 1];
            setParentHistory(parentHistory.slice(0, -1));
            setSelected(categoryMap[previousParentId]);
            setCurrentChildren(categoryMap[previousParentId].children || []);
        }
    };

    const categoryCard = (category: Category) => {
        const isSelected = selectedChild
            ? selectedChild?._id === category._id
            : selected?._id === category._id;

        return (
            <div
                className={`flex flex-col items-center justify-center gap-2 
                            h-32  p-2 rounded-lg shadow-md min-w-28 max-w-fit 
                            ${
                                isSelected
                                    ? "bg-customBlue"
                                    : "bg-customLightGray"
                            }`}
            >
                {/* Icon */}
                <MenuIcon className="w-6 h-6" />
                {/* Ensure icon doesn't shrink */}
                {/* Category Name - Centers & Ensures No Shrinking */}
                <div className="text-sm font-medium text-center line-clamp-2">
                    {category.name}
                </div>
                {/* Shape Count */}
                <div className="text-xs text-gray-500">
                    {category.shapeCount} Shapes
                </div>
            </div>
        );
    };

    return (
        <section>
            <h1 className="text-lg font-thin bg-customGray text-white">
                Categories
            </h1>
            <h2 className="text-lg font-thin bg-customGray text-white">
                {selected.path}
            </h2>
            <div className="flex items-center py-4 overflow-x-auto w-full">
                {/* Parent / Selected */}
                <div className="flex items-center gap-2">
                    <button
                        disabled={!(parentHistory.length > 0)}
                        className="w-6 h-6 text-white disabled:text-customLightGray"
                        onClick={handleBack}
                    >
                        <ChevronLeft />
                    </button>

                    <button onClick={() => handleSelect(selected)}>
                        {categoryCard(selected)}
                    </button>
                    <button
                        disabled
                        className="w-6 h-6 text-white disabled:text-customLightGray"
                    >
                        <ChevronRight />
                    </button>
                </div>

                {/* Children List */}
                <article className="flex gap-2 ml-2">
                    {currentChildren.map((child) => (
                        <button
                            key={child._id}
                            onClick={() => handleSelect(child)}
                        >
                            {categoryCard(child)}
                        </button>
                    ))}
                </article>
            </div>
        </section>
    );
}
