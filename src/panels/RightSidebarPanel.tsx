import { CUSTOM_SCROLLBAR } from "@/Constants";
import { Component, DiagramComponent, Outcome, PersonaData, Scenario, Shape, Step, UnifiedElement } from "@/Types";
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
import { getSignedUrl } from "@/services/chat";
import { useQuery } from "@tanstack/react-query";

import clsx from "clsx";
import { useEffect, useState } from "react";
import { set } from "yaml/dist/schema/yaml-1.1/set";

interface RightSidebarPanelProps {
    setRightSidebarOpen: (value: boolean) => void;
    svgContent: string;
    reportData: PersonaData[];
    canvasSize: { width: number; height: number };
    componentData?: DiagramComponent
}

const defaultTabs = [
    { name: "Business", enabled: true },
    { name: "Design", enabled: false },
    { name: "Metrics", enabled: false },
    { name: "Technical", enabled: false },
]
export default function RightSidebarPanel({
    setRightSidebarOpen,
    reportData,
    svgContent,
    canvasSize,
    componentData
}: RightSidebarPanelProps) {
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
    useEffect(() => { 
        if(!reportData) {
            setSelectedPersona(null);
            setSelectedOutcome(null);
            setSelectedScenario(null);
            setSelectedStep(null);
            setActiveTab("")
        } else {
            setActiveTab(tabs[0].name)
        }
    }, [reportData])

    const {name, blueprint = {}} = componentData?.metadata || {}
    blueprint.name = name
    let component: Component | Shape | null = null;
    if(componentData?.source === 'shape') {
        component = shapesLibraryManager.getShape(componentData?.shape ?? '');
    }  else if (componentData?.source === 'component') {
        component = componentLibraryManager.getComponent(componentData?.shape ?? '');

    } 
    useEffect(() => {
        if(!!componentData) {
            setTabs((prev) => {
                if(prev.length === 4)
                    prev.unshift({ name: "Blueprint", enabled: true });
                return prev;
            });
            setActiveTab("Blueprint")
        } else {
            setActiveTab("Business")
            setTabs(defaultTabs)
        }
    }, [componentData])
    // const { data } = useQuery({
    //     queryKey: ["signedUrl", "IA User Story Document Version v0.3.pdf"],
    //     queryFn: () =>
    //         getSignedUrl("document", "IA User Story Document Version v0.3.pdf"),
    //     staleTime: 300000
    // });
    const handlePersonaClick = (persona: PersonaData): void => {
        setSelectedPersona(persona);
        setSelectedOutcome(null);
        setSelectedScenario(null);
        setTabs((prev) => {
            const temp = prev;
            temp[1].enabled = false;
            return temp;
        });
    };
    const handleOutcomeClick = (outcome: Outcome): void => {
        setSelectedOutcome(outcome);
        setSelectedScenario(null);
        setTabs((prev) => {
            const temp = prev;
            temp[1].enabled = false;
            return temp;
        });
    };
    const handleScenarioClick = (scenario: Scenario): void => {
        setSelectedScenario(scenario);
        setTabs((prev) => {
            const temp = prev;
            temp[1].enabled = true;
            return temp;
        });
    };
    const handleStepClick = (step: Step): void => {
        setSelectedStep(step);
    };

    return (
        <>
            {/* <div className="flex items-center justify-between px-4 pt-6 gap-5 pb-3">
                <div className="flex items-center gap-5">
                    <div className="h-14 w-14">
                        <SVGPreview
                            className="w-full h-full object-cover bg-white"
                            svgContent={composedSVG}
                        />
                    </div>
                    <span className="text-lg font-semibold">React App</span>
                </div>
                <button
                    onClick={() => setRightSidebarOpen(false)}
                    className=" bg-[#4A4A4A] p-1 rounded"
                >
                    <X size={16} />
                </button>
            </div> */}
            {/* toggle buttons */}

            <div className="flex gap-2 px-4 py-3 flex-wrap">
                {tabs.map((tab) => (
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
                ))}
            </div>
            {activeTab === "Business" ? (
                <div className={`flex-col flex overflow-auto flex-grow px-4 py-3 ${CUSTOM_SCROLLBAR}`}>
                    {/* component card */}

                    <Section title="Personas">
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-2 ">
                            {reportData?.map((item: any, index: number) => (
                                <PersonaCard
                                    key={item.persona + index}
                                    title={item.persona}
                                    subtitle=""
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
                            <div className="grid grid-cols-1  gap-2 ">
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
                                            <ContentButton
                                                key={citation.documentName}
                                                content={citation.documentName}
                                                onClick={() => {
                                                    console.log(
                                                        "citation",
                                                        citation
                                                    );
                                                }}
                                            />
                                        )
                                    )}
                                </div>
                            </Section>
                        </>
                    )}

                    {/* <Section
                    title="Contributors"
                    expanded={accordian}
                    onToggle={() => setAccordian(!accordian)}
                >
                    <div className="grid grid-cols-2 xl:grid-cols-3 gap-2 ">
                        <ContributorCard
                            name="Product Owner"
                            image="https://randomuser.me/api/portraits/women/44.jpg"
                        />
                        <ContributorCard
                            name="Product Ownerfdv"
                            image="https://randomuser.me/api/portraits/women/44.jpg"
                        />
                        <ContributorCard
                            name="Product Owner "
                            image="https://randomuser.me/api/portraits/women/44.jpg"
                        />
                    </div>
                </Section> */}
                </div>
            ) : activeTab === "Design" ? (
                <div className={`flex-col flex overflow-auto flex-grow px-4 py-3 ${CUSTOM_SCROLLBAR}`}>
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
                                        />
                                    ))}
                                </div>
                            </Section>
                        </>
                    )}
                </div>
            ) : (activeTab === 'Blueprint' && !!blueprint.name) ? (
                    
        
                <div className={`flex-col flex overflow-auto flex-grow px-4 py-3 ${CUSTOM_SCROLLBAR}`}>
                <div className="w-[106px] h-[106px] flex-shrink-0 pb-4">
                    <SVGPreview
                    svgContent={component?.svgContent ?? ''}
            className="w-full h-full object-cover bg-white"
        />
                </div>
                
                    {Object.entries(blueprint ?? {}).map(([key, value]) => (
                        <Section title={key.split('_').map(x => x.charAt(0).toUpperCase() + x.slice(1)).join(' ')} key={key}>
                        <div className="grid grid-cols-1 gap-2 text-left">
                            <ContentDiv
                                content={typeof value === 'object' ? <pre>{JSON.stringify(value, undefined, 2)}</pre> : String(value)}
                            />
                        </div>
                    </Section>
                    ))}
                </div>


            ) : null}
        </>
    );
}
