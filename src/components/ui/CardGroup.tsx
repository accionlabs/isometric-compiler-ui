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

// Define TypeScript interfaces for our data structure

export const Section: React.FC<SectionProps> = ({ title, children }) => {
    const [expanded, setExpanded] = useState(true);
    return (
        <div className="bg-customGray2 flex flex-col  rounded-md p-3 mb-3">
            <div
                className="flex justify-between items-center cursor-pointer"
                onClick={() => setExpanded(!expanded)}
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
};

export const PersonaCard: React.FC<PersonaCardProps> = ({
    title,
    subtitle,
    onClick,
    isActive
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
            <span className="text-sm line-clamp-2">{title}</span>
            <span className="text-lightGray2 text-xs line-clamp-1">
                {subtitle}
            </span>
        </div>
    </button>
);

export const CitationCard: React.FC<CitationCardProps> = ({
    title,
    onClick
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
            <span className="text-xs line-clamp-2">{title}</span>
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

export const ContentDiv: React.FC<ContentCardProps> = ({ content }) => (
    <div className={` p-2 text-xs rounded-md text-left  bg-customGray `}>
        {content}
    </div>
);

export const ContentButton: React.FC<ContentCardProps> = ({
    content,
    onClick,
    isActive
}) => (
    <button
        onClick={onClick}
        className={` p-2 text-xs rounded-md text-left ${
            isActive ? "bg-customBlue" : "bg-customGray"
        }`}
    >
        {content}
    </button>
);
