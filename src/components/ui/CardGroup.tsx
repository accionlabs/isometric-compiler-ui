import { ChevronUp } from "lucide-react";
import { ReactNode } from "react";

export const Section = ({
    title,
    expanded,
    onToggle,
    children
}: {
    title: string;
    expanded: boolean;
    onToggle: () => void;
    children: ReactNode;
}) => (
    <div className="bg-customGray2 flex flex-col  rounded-md p-3 mb-3">
        <div
            className="flex justify-between items-center cursor-pointer"
            onClick={onToggle}
        >
            <span className="text-sm">{title}</span>
            <ChevronUp
                size={16}
                className={`transition-transform ${
                    expanded ? "rotate-0" : "rotate-180"
                }`}
            />
        </div>
        {expanded && <div className="mt-2">{children}</div>}
    </div>
);

export const PersonaCard = ({
    title,
    subtitle
}: {
    title: string;
    subtitle: string;
}) => (
    <div className="bg-customGray p-2 rounded-md flex items-center text-sm  gap-2">
        {/* Prevent logo div from shrinking */}
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white flex-shrink-0">
            👤
        </div>

        {/* Wrap text content in a div to ensure proper spacing */}
        <div className="flex flex-col">
            <span className="text-sm line-clamp-1">{title}</span>
            <span className="text-lightGray2 text-xs line-clamp-1">
                {subtitle}
            </span>
        </div>
    </div>
);

export const ContributorCard = ({
    name,
    image
}: {
    name: string;
    image: string;
}) => (
    <div className="bg-customGray p-2 rounded-md flex flex-col items-center text-sm">
        <img src={image} alt={name} className="w-12 h-12 rounded-full mb-2" />
        <span className="text-sm text-center">{name} </span>
    </div>
);
