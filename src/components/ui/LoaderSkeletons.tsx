import SVGPreview from "./SVGPreview";

export function Loader() {
    return (
        <div className="flex justify-center items-center h-screen bg-customBlack w-screen">
            <div className="w-12 h-12 border-4 border-blue-700 border-t-transparent border-b-transparent rounded-full animate-spin"></div>
        </div>
    );
}

export const ShapesGroupLoadingSkeleton = () => {
    return (
        <div className="grid grid-cols-1 scrollbar-hide sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
            {Array.from({ length: 16 }).map((_, index) => (
                <div
                    key={index}
                    className="flex flex-col p-1 rounded-lg hover:bg-customLightGray mb-2 relative aspect-[3/2] transition-all hover:scale-105 focus:outline-none  animate-pulse"
                >
                    <SVGPreview
                        className="w-full h-full object-cover bg-white"
                        svgContent=""
                    />
                    <div className="h-2 bg-gray-300 rounded-md my-1"></div>
                    <div className="h-1 bg-gray-300 rounded-md w-1/4"></div>
                </div>
            ))}
        </div>
    );
};
