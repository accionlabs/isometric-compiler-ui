import {
    CitationCardProps,
    ContentCardProps,
    ContributorCardProps,
    PersonaCardProps,
    ScenarioCardProps,
    SectionProps
} from "@/Types";
import { ChevronUp } from "lucide-react";
import { useState } from "react";
import { PersonaIcon } from "./IconGroup";
import pdf from "../../assets/pdf.png";
import image from "../../assets/image.png";
import { Message } from "@/hooks/useChatProvider";

// Define TypeScript interfaces for our data structure

export const Section: React.FC<SectionProps> = ({
    title,
    children,
    headerSize = "text-base"
}) => {
    const [expanded, setExpanded] = useState(true);
    return (
        <div className="mb-3">
            <div
                className={`bg-customLightGray flex flex-col  ${
                    expanded ? "rounded-t-md" : "rounded-md"
                } p-3 `}
            >
                <div
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => setExpanded(!expanded)}
                >
                    <span className={headerSize}>{title}</span>
                    <ChevronUp
                        size={16}
                        className={`transition-transform ${
                            expanded ? "rotate-0" : "rotate-180"
                        }`}
                    />
                </div>
            </div>
            {expanded && (
                <div className="p-3 bg-customGray2 rounded-b-md ">
                    {children}
                </div>
            )}
        </div>
    );
};

export const PersonaCard: React.FC<PersonaCardProps> = ({
    title,
    subtitle,
    onClick,
    isActive,
    headerSize = "text-sm",
    contentSize = "text-xs"
}) => (
    <button
        className={`${
            isActive ? "bg-customBlue" : "bg-customGray"
        } p-2 rounded-md flex items-center text-sm gap-2 text-left`}
        onClick={onClick}
    >
        {/* Prevent logo div from shrinking */}
        <div
            className={`w-8 h-8 ${
                isActive ? "bg-[#1961E4]" : "bg-customGray2"
            } rounded-full flex items-center justify-center text-white flex-shrink-0`}
        >
            <PersonaIcon />
        </div>

        {/* Wrap text content in a div to ensure proper spacing */}
        <div className="flex flex-col">
            <span className={`${headerSize} line-clamp-2`}>{title}</span>
            <span className={`text-lightGray2 ${contentSize} line-clamp-1`}>
                {subtitle}
            </span>
        </div>
    </button>
);

export const CitationCard: React.FC<CitationCardProps> = ({
    title,
    onClick,
    contentSize = "text-xs"
}) => (
    <button
        className={`bg-customGray p-2 rounded-md flex items-center text-sm gap-2 text-left`}
        onClick={onClick}
    >
        {/* Prevent logo div from shrinking */}
        <div
            className={`w-8 h-8 bg-customGray2 rounded flex items-center justify-center text-white flex-shrink-0`}
        >
            <img
                src={title.toLowerCase().endsWith(".pdf") ? pdf : image}
                alt={title}
                className=" object-contain "
            />
        </div>

        {/* Wrap text content in a div to ensure proper spacing */}
        <div className="flex flex-col">
            <span className={`${contentSize}  line-clamp-2`}>{title}</span>
        </div>
    </button>
);
// ScenarioCard component
export const ScenarioCard: React.FC<ScenarioCardProps> = ({ scenario }) => (
    <div className="bg-customGray rounded p-3 mb-2">
        <h4 className="font-medium mb-2">{scenario.scenario}</h4>
        <p className="text-sm mb-2">{scenario.description}</p>

        {scenario.steps.map((step, index) => (
            <div key={index} className="mb-3">
                <h5 className="text-sm font-medium mb-1">{step.step}</h5>

                <div className="pl-3 border-l-2 border-gray-300">
                    {step.actions.map((action, actionIdx) => (
                        <div key={actionIdx} className="mb-2">
                            <p className="text-xs">{action.action}</p>
                        </div>
                    ))}
                </div>
            </div>
        ))}
    </div>
);

// ContributorCard component
export const ContributorCard: React.FC<ContributorCardProps> = ({
    name,
    image
}) => (
    <div className="bg-customGray p-2 rounded-md flex flex-col items-center text-sm">
        <img src={image} alt={name} className="w-12 h-12 rounded-full mb-2" />
        <span className="text-sm text-center">{name} </span>
    </div>
);

export const ContentDiv: React.FC<ContentCardProps> = ({
    content,
    isActive = false,
    contentSize = "text-xs"
}) => (
    <div
        className={` p-2 ${contentSize} rounded-md text-left  ${
            isActive ? "bg-customBlue" : "bg-customGray"
        }`}
    >
        {content}
    </div>
);

export const ContentButton: React.FC<ContentCardProps> = ({
    content,
    onClick,
    isActive,
    contentSize = "text-xs"
}) => (
    <button
        onClick={onClick}
        className={` p-2 ${contentSize} rounded-md text-left ${
            isActive ? "bg-customBlue" : "bg-customGray"
        }`}
    >
        {content}
    </button>
);

export const UserMessage: React.FC<Message> = () => <div></div>;
