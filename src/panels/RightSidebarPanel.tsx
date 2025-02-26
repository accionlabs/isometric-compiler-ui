import { Outcome, PersonaData, Scenario } from "@/Types";
import {
    ContentButton,
    ContentDiv,
    PersonaCard,
    Section
} from "@/components/ui/CardGroup";

import clsx from "clsx";
import { useState } from "react";

interface RightSidebarPanelProps {
    setRightSidebarOpen: (value: boolean) => void;
    svgContent: string;
    reportData: PersonaData[];
    canvasSize: { width: number; height: number };
}
export default function RightSidebarPanel({
    setRightSidebarOpen,
    reportData,
    svgContent,
    canvasSize
}: RightSidebarPanelProps) {
    const [tabs, setTabs] = useState([
        { name: "Business", enabled: true },
        { name: "Design", enabled: false },
        { name: "Metrics", enabled: false },
        { name: "Technical", enabled: false }
    ]);
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
    //     const composedSVG = useMemo(() => {
    //         const boundingBox = calculateSVGBoundingBox(svgContent, canvasSize) || {
    //             x: 0,
    //             y: 0,
    //             width: "100%",
    //             height: "100%"
    //         };

    //         return `
    //     <svg xmlns="http://www.w3.org/2000/svg" viewBox="${boundingBox.x} ${boundingBox.y} ${boundingBox.width} ${boundingBox.height}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
    //         ${svgContent}
    //     </svg>
    // `;
    //     }, [svgContent, canvasSize]);

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
                <div className="flex-col flex overflow-auto flex-grow px-4 py-3">
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
                        <Section title="Scenarios">
                            <div className="grid grid-cols-1 gap-2 text-left">
                                {selectedOutcome.scenarios.map(
                                    (scenario, index) => (
                                        <ContentButton
                                            key={scenario.scenario + index}
                                            content={scenario.scenario}
                                            onClick={() =>
                                                handleScenarioClick(scenario)
                                            }
                                            isActive={
                                                selectedScenario?.scenario ===
                                                scenario.scenario
                                            }
                                        ></ContentButton>
                                    )
                                )}
                            </div>
                        </Section>
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
                <div className="flex-col flex overflow-auto flex-grow px-4 py-3">
                    {selectedScenario && (
                        <>
                            <Section title="Steps">
                                <div className="grid grid-cols-1 gap-2 text-left">
                                    {selectedScenario.steps.map(
                                        (step, index) => (
                                            <ContentDiv
                                                key={step.step + index}
                                                content={`${index + 1}. ${
                                                    step.step
                                                }`}
                                            />
                                        )
                                    )}
                                </div>
                            </Section>
                        </>
                    )}
                </div>
            ) : null}
        </>
    );
}
