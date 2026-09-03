import { motion } from "framer-motion";
import {
    Zap,
    Brain,
    Activity,
    ShieldCheck,
    CheckCircle2,
} from "lucide-react";

const icons = {
    trigger: Zap,
    diagnose: Brain,
    decide: Activity,
    guardrail: ShieldCheck,
    execute: Zap,
    verify: CheckCircle2,
};

export default function PipelineNode({
    number,
    title,
    description,
    icon,
    index,
    status = "idle",
}) {
    const Icon = icons[icon] || Activity;

    const isActive = status === "active";
    const isCompleted = status === "completed";

    return (
        <div className="pipeline-node-wrapper">

            <motion.div
                className={`pipeline-node ${status}`}
                animate={{
                    scale: isActive ? 1.08 : 1,
                    opacity: 1,
                }}
                transition={{
                    duration: 0.35,
                }}
            >

                <span className="pipeline-number">
                    {number}
                </span>

                <motion.div
                    className="pipeline-icon"
                    animate={{
                        scale: isActive ? 1.15 : 1,
                        rotate: isActive ? [0, -5, 5, 0] : 0,
                    }}
                    transition={{
                        duration: 0.5,
                    }}
                >
                    <Icon size={18} />
                </motion.div>

                <strong>{title}</strong>

                <span>{description}</span>

                {isActive && (
                    <motion.div
                        className="pipeline-active-ring"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{
                            opacity: [0.4, 1, 0.4],
                            scale: [0.9, 1.15, 0.9],
                        }}
                        transition={{
                            duration: 1.2,
                            repeat: Infinity,
                        }}
                    />
                )}

                {isCompleted && (
                    <motion.div
                        className="pipeline-complete-mark"
                        initial={{
                            opacity: 0,
                            scale: 0,
                        }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                        }}
                        transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 20,
                        }}
                    >
                        ✓
                    </motion.div>
                )}

            </motion.div>

            {index < 5 && (
                <div className="pipeline-connector">
                    <motion.div
                        className="pipeline-connector-fill"
                        initial={{ scaleX: 0 }}
                        animate={{
                            scaleX:
                                isCompleted ? 1 : 0,
                        }}
                        transition={{
                            duration: 0.45,
                        }}
                        style={{
                            transformOrigin: "left",
                        }}
                    />
                </div>
            )}

        </div>
    );
}