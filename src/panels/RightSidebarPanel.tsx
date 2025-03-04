import { CUSTOM_SCROLLBAR } from "@/Constants";
import {
    Component,
    DiagramComponent,
    Outcome,
    PersonaData,
    Scenario,
    Shape,
    Step
} from "@/Types";
import {
    CitationCard,
    ContentButton,
    ContentDiv,
    PersonaCard,
    Section
} from "@/components/ui/CardGroup";
import SVGPreview from "@/components/ui/SVGPreview";
import { componentLibraryManager } from "@/lib/componentLib";
import { shapesLibraryManager } from "@/lib/shapesLib";
import { getDocumentsSignedUrlById } from "@/services/chat";
import { useQueryClient } from "@tanstack/react-query";

import clsx from "clsx";
import { useEffect, useState } from "react";

interface RightSidebarPanelProps {
    setRightSidebarOpen: (value: boolean) => void;
    svgContent: string;
    reportData: PersonaData[];
    canvasSize: { width: number; height: number };
    componentData?: DiagramComponent;
}

const defaultTabs = [
    { name: "Blueprint", enabled: true, show: false },
    { name: "Business", enabled: true, show: true },
    { name: "Design", enabled: false, show: true },
    { name: "Metrics", enabled: false, show: true },
    { name: "Technical", enabled: false, show: true }
];

export default function RightSidebarPanel({
    reportData,
    componentData
}: RightSidebarPanelProps) {
    const queryClient = useQueryClient();
    const [tabs, setTabs] = useState(defaultTabs);
    const [activeTab, setActiveTab] = useState("Business");
    const [selectedPersona, setSelectedPersona] = useState<PersonaData | null>(
        null
    );
    const [selectedOutcome, setSelectedOutcome] = useState<Outcome | null>(
        null
    );
    const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(
        null
    );
    const [selectedStep, setSelectedStep] = useState<Step | null>(null);

    // Ensure `Blueprint` tab is shown/active when `componentData` is available
    useEffect(() => {
        setTabs((prev) =>
            prev.map((tab) =>
                tab.name === "Blueprint"
                    ? { ...tab, show: !!componentData }
                    : tab
            )
        );

        setActiveTab((prev) => {
            if (componentData) return "Blueprint"; // Always prioritize Blueprint if available
            return prev === "Blueprint" ? "Business" : prev; // Prevents unwanted resets
        });
    }, [componentData]);

    useEffect(() => {
        if (!reportData) {
            setSelectedPersona(null);
            setSelectedOutcome(null);
            setSelectedScenario(null);
            setSelectedStep(null);
            setActiveTab((prev) => (prev === "Blueprint" ? "Blueprint" : ""));
        } else {
            setActiveTab((prev) => prev || "Business");
        }
    }, [reportData]);

    const { name, blueprint = {} } = componentData?.metadata || {};
    blueprint.name = name;
    let component: Component | Shape | null = null;

    if (componentData?.source === "shape") {
        component = shapesLibraryManager.getShape(componentData.shape ?? "");
    } else if (componentData?.source === "component") {
        component = componentLibraryManager.getComponent(
            componentData.shape ?? ""
        );
    }

    const handlePersonaClick = (persona: PersonaData): void => {
        setSelectedPersona(persona);
        setSelectedOutcome(null);
        setSelectedScenario(null);
        setTabs((prev) =>
            prev.map((tab) =>
                tab.name === "Design" ? { ...tab, enabled: false } : tab
            )
        );
    };

    const handleOutcomeClick = (outcome: Outcome): void => {
        setSelectedOutcome(outcome);
        setSelectedScenario(null);
        setTabs((prev) =>
            prev.map((tab) =>
                tab.name === "Design" ? { ...tab, enabled: false } : tab
            )
        );
    };

    const handleScenarioClick = (scenario: Scenario): void => {
        setSelectedScenario(scenario);
        setTabs((prev) =>
            prev.map((tab) =>
                tab.name === "Design" ? { ...tab, enabled: true } : tab
            )
        );
    };

    const handleStepClick = (step: Step): void => {
        setSelectedStep(step);
    };

    const handleDocumentDownload = async (id: string) => {
        const signedUrl = await queryClient.fetchQuery({
            queryKey: ["getSignedDocUrl", id],
            queryFn: () => getDocumentsSignedUrlById(id),
            staleTime: 300000
        });
        window.open(signedUrl, "_blank", "noopener,noreferrer");
    };

    return (
        <>
            {/* Tab Selection Buttons */}
            <div className="flex gap-2 px-4 py-3 flex-wrap">
                {tabs.map((tab) =>
                    tab.show ? (
                        <button
                            key={tab.name}
                            onClick={() => setActiveTab(tab.name)}
                            disabled={!tab.enabled}
                            className={clsx(
                                "px-3 py-1 rounded text-base font-medium transition disabled:opacity-50",
                                activeTab === tab.name
                                    ? "bg-blue-600 font-bold text-white"
                                    : "bg-gray-700 text-lightGray2"
                            )}
                        >
                            {tab.name}
                        </button>
                    ) : null
                )}
            </div>

            {/* Tab Content */}
            {activeTab === "Business" && (
                <div
                    className={`flex-col flex overflow-auto flex-grow px-4 py-3 ${CUSTOM_SCROLLBAR}`}
                >
                    <Section title="Personas">
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
                            {reportData?.map((item, index) => (
                                <PersonaCard
                                    key={item.persona + index}
                                    title={item.persona}
                                    onClick={() => handlePersonaClick(item)}
                                    isActive={
                                        selectedPersona?.persona ===
                                        item.persona
                                    }
                                />
                            ))}
                        </div>
                    </Section>

                    {selectedPersona && (
                        <Section title="Outcomes">
                            <div className="grid grid-cols-1 gap-2">
                                {selectedPersona.outcomes.map(
                                    (outcome, index) => (
                                        <ContentButton
                                            key={outcome.outcome + index}
                                            onClick={() =>
                                                handleOutcomeClick(outcome)
                                            }
                                            content={outcome.outcome}
                                            isActive={
                                                selectedOutcome?.outcome ===
                                                outcome.outcome
                                            }
                                        />
                                    )
                                )}
                            </div>
                        </Section>
                    )}
                    {selectedOutcome && (
                        <>
                            <Section title="Scenarios">
                                <div className="grid grid-cols-1 gap-2 text-left">
                                    {selectedOutcome.scenarios.map(
                                        (scenario, index) => (
                                            <ContentButton
                                                key={scenario.scenario + index}
                                                content={scenario.scenario}
                                                onClick={() =>
                                                    handleScenarioClick(
                                                        scenario
                                                    )
                                                }
                                                isActive={
                                                    selectedScenario?.scenario ===
                                                    scenario.scenario
                                                }
                                            />
                                        )
                                    )}
                                </div>
                            </Section>
                            <Section title="Citations">
                                <div className="grid grid-cols-1 gap-2 text-left">
                                    {selectedOutcome.citations.map(
                                        (citation) => (
                                            <CitationCard
                                                key={citation.documentName}
                                                title={citation.documentName}
                                                onClick={() =>
                                                    handleDocumentDownload(
                                                        citation.documentId
                                                    )
                                                }
                                            />
                                        )
                                    )}
                                </div>
                            </Section>
                        </>
                    )}
                </div>
            )}
            {activeTab === "Design" && (
                <div className="flex-col flex overflow-auto flex-grow px-4 py-3">
                    {selectedScenario && (
                        <Section title="Steps">
                            <div className="grid grid-cols-1 gap-2 text-left">
                                {selectedScenario.steps.map((step, index) => (
                                    <ContentButton
                                        key={step.step + index}
                                        content={`${index + 1}. ${step.step}`}
                                        onClick={() => handleStepClick(step)}
                                        isActive={
                                            selectedStep?.step === step.step
                                        }
                                    />
                                ))}
                            </div>
                        </Section>
                    )}
                    {selectedStep && (
                        <>
                            <Section title="Actions">
                                <div className="grid grid-cols-1 gap-2 text-left">
                                    {selectedStep.actions.map(
                                        (action, index) => (
                                            <ContentDiv
                                                key={action.action + index}
                                                content={action.action}
                                            />
                                        )
                                    )}
                                </div>
                            </Section>
                            <Section title="Citations">
                                <div className="grid grid-cols-1 gap-2 text-left">
                                    {selectedStep.citations.map((citation) => (
                                        <CitationCard
                                            key={citation.documentName}
                                            title={citation.documentName}
                                            onClick={() =>
                                                handleDocumentDownload(
                                                    citation.documentId
                                                )
                                            }
                                        />
                                    ))}
                                </div>
                            </Section>
                        </>
                    )}
                </div>
            )}
            {activeTab === "Blueprint" && !!blueprint.name && (
                <div
                    className={`flex-col flex overflow-auto flex-grow px-4 py-3 ${CUSTOM_SCROLLBAR}`}
                >
                    <div className="h-28 w-28 pb-3 flex-shrink-0">
                        <SVGPreview
                            svgContent={component?.svgContent ?? ""}
                            className="w-full h-full object-cover bg-white"
                        />
                    </div>

                    {Object.entries(blueprint ?? {}).map(([key, value]) => (
                        <Section
                            title={key
                                .replace(/_/g, " ")
                                .replace(/\b\w/g, (l) => l.toUpperCase())}
                            key={key}
                        >
                            <div className="grid grid-cols-1 gap-2 text-left">
                                <ContentDiv
                                    content={
                                        typeof value === "object" ? (
                                            <pre>
                                                {JSON.stringify(
                                                    value,
                                                    undefined,
                                                    2
                                                )}
                                            </pre>
                                        ) : (
                                            String(value)
                                        )
                                    }
                                />
                            </div>
                        </Section>
                    ))}
                </div>
            )}
        </>
    );
}
