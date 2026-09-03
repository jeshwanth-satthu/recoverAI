import PipelineNode from "./PipelineNode";

const stages = [
    {
        number: "01",
        title: "TRIGGER",
        description: "Failure detected",
        icon: "trigger",
    },
    {
        number: "02",
        title: "DIAGNOSE",
        description: "AI identifies cause",
        icon: "diagnose",
    },
    {
        number: "03",
        title: "DECIDE",
        description: "Recovery strategy",
        icon: "decide",
    },
    {
        number: "04",
        title: "GUARDRAIL",
        description: "Policy validation",
        icon: "guardrail",
    },
    {
        number: "05",
        title: "EXECUTE",
        description: "Recovery action",
        icon: "execute",
    },
    {
        number: "06",
        title: "VERIFY",
        description: "Outcome confirmed",
        icon: "verify",
    },
];

export default function RecoveryPipeline({
    activeStage = -1,
    completedStage = -1,
}) {
    return (
        <div className="pipeline-card">

            <div className="pipeline-track">

                {stages.map((stage, index) => {

                    const status =
                        completedStage >= index
                            ? "completed"
                            : activeStage === index
                                ? "active"
                                : "idle";

                    return (
                        <PipelineNode
                            key={stage.title}
                            {...stage}
                            index={index}
                            status={status}
                        />
                    );
                })}

            </div>

        </div>
    );
}