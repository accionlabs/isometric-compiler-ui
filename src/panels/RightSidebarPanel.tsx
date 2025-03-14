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
import { RadixSelect } from "@/components/ui/Select";
import { componentLibraryManager } from "@/lib/componentLib";
import { shapesLibraryManager } from "@/lib/shapesLib";
import { getDocumentsSignedUrlById } from "@/services/chat";
import { useQueryClient } from "@tanstack/react-query";

import clsx from "clsx";
import { Expand, X } from "lucide-react";
import { useEffect, useState } from "react";

interface RightSidebarPanelProps {
    setRightSidebarOpen: (value: boolean) => void;
    fullscreenControls: {
        fullScreenPanel: boolean;
        setFullScreenPanel: (value: boolean) => void;
    };
    svgContent: string;
    reportData: PersonaData[];
    canvasSize: { width: number; height: number };
    componentData?: DiagramComponent;
}

const defaultTabs = [
    { name: "Blueprint", enabled: true, show: false },
    { name: "Functional", enabled: true, show: true },
    // { name: "Design", enabled: false, show: true },
    { name: "Metrics", enabled: false, show: true },
    { name: "Technical", enabled: false, show: true }
];

export default function RightSidebarPanel({
    reportData,
    componentData,
    fullscreenControls
}: RightSidebarPanelProps) {
    const queryClient = useQueryClient();
    const { fullScreenPanel, setFullScreenPanel } = fullscreenControls;
    const [tabs, setTabs] = useState(defaultTabs);
    const [activeTab, setActiveTab] = useState("Functional");
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
            return prev === "Blueprint" ? "Functional" : prev; // Prevents unwanted resets
        });
    }, [componentData]);

    useEffect(() => {
        if (!reportData?.length) {
            setSelectedPersona(null);
            setSelectedOutcome(null);
            setSelectedScenario(null);
            setSelectedStep(null);
            setActiveTab((prev) => (prev === "Blueprint" ? "Blueprint" : ""));
            setTabs((prev) =>
                prev.map((tab) =>
                    tab.name === "Functional" ? { ...tab, enabled: false } : tab
                )
            );
        } else {
            setActiveTab((prev) => prev || "Functional");
            setTabs((prev) =>
                prev.map((tab) =>
                    tab.name === "Functional" ? { ...tab, enabled: true } : tab
                )
            );
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

    const handleOutcomeClick = (selectedValue: string): void => {
        const foundOutcome = selectedPersona?.outcomes.find(
            (outcome) => outcome.outcome === selectedValue
        );

        if (!foundOutcome) return;

        setSelectedOutcome(foundOutcome);
        setSelectedScenario(null);
        setTabs((prev) =>
            prev.map((tab) =>
                tab.name === "Design" ? { ...tab, enabled: false } : tab
            )
        );
    };

    const handleScenarioClick = (selectedValue: string): void => {
        const foundScenario = selectedOutcome?.scenarios.find(
            (scenario) => scenario.scenario === selectedValue
        );
        if (!foundScenario) return;
        setSelectedScenario(foundScenario);
        setSelectedStep(null);

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
            <div className="flex items-center justify-between px-4 py-3">
                <div className="flex gap-2  flex-wrap">
                    {tabs.map((tab) =>
                        tab.show ? (
                            <button
                                key={tab.name}
                                onClick={() => setActiveTab(tab.name)}
                                disabled={!tab.enabled}
                                className={clsx(
                                    "px-3 py-1 rounded  font-medium transition disabled:opacity-50",
                                    activeTab === tab.name
                                        ? "bg-blue-600 font-bold text-white"
                                        : "bg-gray-700 text-lightGray2",
                                    fullScreenPanel ? "text-xl" : "text-base"
                                )}
                            >
                                {tab.name}
                            </button>
                        ) : null
                    )}
                </div>
                <button
                    className="shrink-0"
                    onClick={() => setFullScreenPanel(!fullScreenPanel)}
                >
                    {fullScreenPanel ? <X size={20} /> : <Expand size={20} />}
                </button>
            </div>

            {/* Tab Content */}

            {activeTab === "Functional" && reportData && (
                <div
                    className={`flex-col flex overflow-auto flex-grow px-4 pt-3 ${CUSTOM_SCROLLBAR}`}
                >
                    <Section
                        title="Functional"
                        headerSize={fullScreenPanel ? "text-xl" : undefined}
                    >
                        <div className="flex flex-col gap-4">
                            <div>
                                <h6
                                    className={`mb-2 ${
                                        fullScreenPanel ? "text-lg" : "text-sm"
                                    }`}
                                >
                                    Persona
                                </h6>
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-2 text-">
                                    {reportData?.map((item, index) => (
                                        <PersonaCard
                                            key={item.persona + index}
                                            title={item.persona}
                                            onClick={() =>
                                                handlePersonaClick(item)
                                            }
                                            isActive={
                                                selectedPersona?.persona ===
                                                item.persona
                                            }
                                            headerSize={
                                                fullScreenPanel
                                                    ? "text-lg"
                                                    : undefined
                                            }
                                            contentSize={
                                                fullScreenPanel
                                                    ? "text-base"
                                                    : undefined
                                            }
                                        />
                                    ))}
                                </div>
                            </div>

                            {selectedPersona && (
                                <div>
                                    <h4
                                        className={`mb-2 ${
                                            fullScreenPanel
                                                ? "text-lg"
                                                : "text-sm"
                                        }`}
                                    >
                                        Tasks
                                    </h4>
                                    <RadixSelect
                                        placeholder="Select a task"
                                        options={selectedPersona.outcomes.map(
                                            (outcome) => ({
                                                value: outcome.outcome,
                                                label: outcome.outcome
                                            })
                                        )}
                                        value={selectedOutcome?.outcome ?? ""}
                                        onChange={(value) =>
                                            handleOutcomeClick(value)
                                        }
                                        textSize={
                                            fullScreenPanel
                                                ? "text-lg"
                                                : undefined
                                        }
                                    />
                                </div>
                            )}
                            {selectedOutcome && (
                                <>
                                    <div>
                                        <h4
                                            className={`mb-2 ${
                                                fullScreenPanel
                                                    ? "text-lg"
                                                    : "text-sm"
                                            }`}
                                        >
                                            Scenarios
                                        </h4>

                                        <RadixSelect
                                            placeholder="Select a scenario"
                                            options={selectedOutcome.scenarios.map(
                                                (scenario) => ({
                                                    value: scenario.scenario,
                                                    label: scenario.scenario
                                                })
                                            )}
                                            value={
                                                selectedScenario?.scenario ?? ""
                                            }
                                            onChange={(value) =>
                                                handleScenarioClick(value)
                                            }
                                            textSize={
                                                fullScreenPanel
                                                    ? "text-lg"
                                                    : undefined
                                            }
                                        />
                                    </div>
                                    <div>
                                        <h4
                                            className={`mb-2 ${
                                                fullScreenPanel
                                                    ? "text-lg"
                                                    : "text-sm"
                                            }`}
                                        >
                                            Links to Original Source
                                        </h4>
                                        <div className="grid grid-cols-1 gap-2 text-left">
                                            {selectedOutcome.citations.map(
                                                (citation) => (
                                                    <CitationCard
                                                        key={
                                                            citation.documentName
                                                        }
                                                        title={
                                                            citation.documentName
                                                        }
                                                        onClick={() =>
                                                            handleDocumentDownload(
                                                                citation.documentId
                                                            )
                                                        }
                                                        contentSize={
                                                            fullScreenPanel
                                                                ? "text-base"
                                                                : undefined
                                                        }
                                                    />
                                                )
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </Section>

                    {selectedScenario && (
                        <>
                            <Section
                                title="Design"
                                headerSize={
                                    fullScreenPanel ? "text-xl" : undefined
                                }
                            >
                                <div className="flex flex-col gap-4">
                                    <div>
                                        <h4
                                            className={`mb-2 ${
                                                fullScreenPanel
                                                    ? "text-lg"
                                                    : "text-sm"
                                            }`}
                                        >
                                            Steps
                                        </h4>
                                        <div className="grid grid-cols-1 gap-2 text-left">
                                            {selectedScenario.steps.map(
                                                (step, index) => (
                                                    <ContentButton
                                                        key={step.step + index}
                                                        content={`${
                                                            index + 1
                                                        }. ${step.step}`}
                                                        onClick={() =>
                                                            handleStepClick(
                                                                step
                                                            )
                                                        }
                                                        isActive={
                                                            selectedStep?.step ===
                                                            step.step
                                                        }
                                                        contentSize={
                                                            fullScreenPanel
                                                                ? "text-base"
                                                                : undefined
                                                        }
                                                    />
                                                )
                                            )}
                                        </div>
                                    </div>

                                    {selectedScenario?.steps &&
                                        selectedStep?.actions && (
                                            <div>
                                                <h4
                                                    className={`mb-2 ${
                                                        fullScreenPanel
                                                            ? "text-lg"
                                                            : "text-sm"
                                                    }`}
                                                >
                                                    Actions
                                                </h4>
                                                <div className="grid grid-cols-1 gap-2 text-left">
                                                    {selectedStep.actions.map(
                                                        (action, index) => (
                                                            <ContentDiv
                                                                contentSize={
                                                                    fullScreenPanel
                                                                        ? "text-base"
                                                                        : undefined
                                                                }
                                                                key={
                                                                    action.action +
                                                                    index
                                                                }
                                                                content={
                                                                    action.action
                                                                }
                                                            />
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                    {selectedStep?.citations && (
                                        <div>
                                            <h4
                                                className={`mb-2 ${
                                                    fullScreenPanel
                                                        ? "text-lg"
                                                        : "text-sm"
                                                }`}
                                            >
                                                Links to Original Source
                                            </h4>
                                            <div className="grid grid-cols-1 gap-2 text-left">
                                                {selectedStep.citations.map(
                                                    (citation) => (
                                                        <CitationCard
                                                            key={
                                                                citation.documentName
                                                            }
                                                            title={
                                                                citation.documentName
                                                            }
                                                            onClick={() =>
                                                                handleDocumentDownload(
                                                                    citation.documentId
                                                                )
                                                            }
                                                            contentSize={
                                                                fullScreenPanel
                                                                    ? "text-base"
                                                                    : undefined
                                                            }
                                                        />
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Section>
                        </>
                    )}
                </div>
            )}

            {/* <div className="flex-col flex overflow-auto flex-grow px-4 ">
              
            </div> */}

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
                            headerSize={fullScreenPanel ? "text-xl" : undefined}
                        >
                            <div className="grid grid-cols-1 gap-2 text-left">
                                <ContentDiv
                                    contentSize={
                                        fullScreenPanel
                                            ? "text-base"
                                            : undefined
                                    }
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
