import { LeftArrow, MenuIcon, RightArrow } from "@/components/ui/IconGroup";
import { useRef, useState } from "react";
import { Category } from "@/Types";
import { CUSTOM_SCROLLBAR } from "@/Constants";

export default function CategoriesPanel({
    categories,
    onCategoryChange
}: {
    categories: Category[];
    onCategoryChange: (id: string) => void;
}) {
    const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({}); // Correctly typed refs

    const [selected, setSelected] = useState<Category>(categories[0]);
    const [selectedChild, setSelectedChild] = useState<Category | null>();
    const [currentChildren, setCurrentChildren] = useState<Category[]>(
        categories[0].children || []
    );
    const [parentHistory, setParentHistory] = useState<string[]>([]);
    const selectedCategory = selectedChild || selected;
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
    const showPath = () => selectedCategory.path.split("/").slice(1).slice(-2);

    const handleSelect = (category: Category) => {
        onCategoryChange(category._id);
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
        if (!parentHistory.length) return;

        const previousParentId = parentHistory[parentHistory.length - 1];
        setParentHistory(parentHistory.slice(0, -1));
        setSelected(categoryMap[previousParentId]);
        setCurrentChildren(categoryMap[previousParentId].children || []);
    };
    const renderSVG = (svgContent: string) => {
        if (!svgContent) return "";
        // Parse the SVG content
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgContent, "image/svg+xml");
        const svgElement = svgDoc.documentElement;

        // Get the viewBox
        let viewBox = svgElement.getAttribute("viewBox");
        if (!viewBox) {
            // If viewBox is not present, create one based on width and height
            const width = svgElement.getAttribute("width") || "100";
            const height = svgElement.getAttribute("height") || "100";
            viewBox = `0 0 ${width} ${height}`;
        }
        // Create a new SVG element with our desired properties
        const newSvgContent = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
                ${svgElement.innerHTML}
            </svg>
        `;

        return newSvgContent;
    };
    const categoryCard = (category: Category) => {
        const isSelected = selectedCategory._id === category._id;

        return (
            <div
                className={`flex flex-col items-center justify-start gap-2 
                            p-2 rounded-lg h-32
                            ${
                                isSelected
                                    ? "bg-customBlue"
                                    : "bg-customLightGray"
                            }`}
            >
                {/* Icon */}
                {category?.metadata?.icon?.length > 0 ? (
                    <div
                        className="w-6 h-6 text-white"
                        dangerouslySetInnerHTML={{
                            __html: renderSVG(category.metadata.icon)
                        }}
                    />
                ) : (
                    <MenuIcon className="w-6 h-6" />
                )}

                <div className="flex flex-col min-w-20">
                    <span className="text-sm font-medium text-center whitespace-normal line-clamp-3">
                        {category.name}
                    </span>
                    <span className="text-xs mt-1">
                        {category.shapeCount} Shapes
                    </span>
                </div>
            </div>
        );
    };

    return (
        <section>
            <h1 className="text-md font-medium bg-customGray text-white">
                Categories
            </h1>
            <div className="flex">
                {showPath().map((path, index, array) => (
                    <div
                        key={index}
                        className="flex items-center text-xs font-thin bg-customGray text-white"
                    >
                        <p>{path}</p>
                        {index < array.length - 1 && (
                            <span className="mx-1"> / </span>
                        )}
                    </div>
                ))}
            </div>

            <div
                className={`flex items-center py-4 overflow-x-auto  w-full ${CUSTOM_SCROLLBAR}`}
            >
                {/* Parent / Selected */}
                <div className="flex items-center gap-2">
                    {parentHistory.length > 0 && (
                        <button
                            disabled={!(parentHistory.length > 0)}
                            className="h-10 text-white bg-customGray2 p-[0.125rem] rounded-sm  disabled:text-customLightGray"
                            onClick={handleBack}
                        >
                            <LeftArrow />
                        </button>
                    )}
                    <button onClick={() => handleSelect(selected)}>
                        {categoryCard(selected)}
                    </button>
                    <button
                        disabled
                        className=" text-white disabled:text-customLightGray"
                    >
                        <RightArrow />
                    </button>
                </div>

                {/* Children List */}
                <article className="flex gap-2 ml-2">
                    {currentChildren.map((child) => (
                        <button
                            key={child._id}
                            ref={(el) => (buttonRefs.current[child._id] = el)}
                            onClick={(e) => {
                                console.log();
                                if (!(child.children.length > 0)) {
                                    e.currentTarget.focus(); // Ensure focus
                                    buttonRefs.current[
                                        child._id
                                    ]?.scrollIntoView({
                                        behavior: "smooth",
                                        block: "center",
                                        inline: "center"
                                    });
                                }
                                handleSelect(child);
                            }}
                        >
                            {categoryCard(child)}
                        </button>
                    ))}
                </article>
            </div>
        </section>
    );
}
