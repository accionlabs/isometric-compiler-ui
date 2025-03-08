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
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 scrollbar-hide ">
            {Array.from({ length: 12 }).map((_, index) => (
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

export const SearchLoadingSkeleton = () => (
    <ul>
        {Array.from({ length: 10 }).map((_, index) => (
            <li
                key={index}
                className="animate-pulse flex items-center p-4 rounded-md gap-4 hover:bg-customLightGray cursor-pointer"
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
