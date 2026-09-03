import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Text, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

const STAGES = [
    { title: "TRIGGER", color: "#ff7185" },
    { title: "DIAGNOSE", color: "#ffbf67" },
    { title: "DECIDE", color: "#5ee7ff" },
    { title: "GUARDRAIL", color: "#a78bfa" },
    { title: "EXECUTE", color: "#8b5cf6" },
    { title: "VERIFY", color: "#36e2a0" },
];

function PipelineNode3D({ position, stage, index, activeStage, completedStage }) {
    const meshRef = useRef();

    const isCurrent = activeStage === index;
    const isDone = completedStage >= index;

    useFrame((state, delta) => {
        if (!meshRef.current) return;
        meshRef.current.rotation.y += delta * (isCurrent ? 1.5 : 0.4);
        meshRef.current.rotation.x += delta * 0.2;

        const time = state.clock.elapsedTime;
        if (isCurrent) {
            const scale = 0.55 + Math.sin(time * 5) * 0.08;
            meshRef.current.scale.setScalar(scale);
        } else {
            meshRef.current.scale.setScalar(0.45);
        }
    });

    const activeColor = isDone ? "#36e2a0" : isCurrent ? "#5ee7ff" : stage.color;

    return (
        <group position={position}>
            <Float speed={2} rotationIntensity={0.2} floatIntensity={0.4}>
                <mesh ref={meshRef}>
                    <octahedronGeometry args={[1, 0]} />
                    <meshStandardMaterial
                        color={activeColor}
                        emissive={activeColor}
                        emissiveIntensity={isCurrent ? 2.5 : isDone ? 1.8 : 0.6}
                        roughness={0.2}
                        metalness={0.8}
                        wireframe={!isDone && !isCurrent}
                    />
                </mesh>
            </Float>

            {/* Glowing ring under active node */}
            {isCurrent && (
                <mesh position={[0, -0.7, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[0.6, 0.75, 32]} />
                    <meshBasicMaterial color="#5ee7ff" side={THREE.DoubleSide} transparent opacity={0.8} />
                </mesh>
            )}

            <Text
                position={[0, -1.2, 0]}
                fontSize={0.25}
                color={isCurrent || isDone ? "#ffffff" : "#687184"}
                anchorX="center"
                anchorY="middle"
            >
                {stage.title}
            </Text>
        </group>
    );
}

function EnergyBeam3D() {
    const beamRef = useRef();

    useFrame((state, delta) => {
        if (beamRef.current) {
            beamRef.current.rotation.z += delta * 0.2;
        }
    });

    return (
        <mesh ref={beamRef} position={[0, 0, 0]} rotation={[0, 0, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 10, 16]} />
            <meshBasicMaterial color="#5ee7ff" transparent opacity={0.4} wireframe />
        </mesh>
    );
}

export default function Pipeline3DScene({ activeStage = -1, completedStage = -1 }) {
    return (
        <div style={{ width: "100%", height: "260px", position: "relative", borderRadius: "16px", overflow: "hidden", background: "rgba(241, 245, 249, 0.8)" }}>
            <Canvas camera={{ position: [0, 0, 7], fov: 45 }}>
                <color attach="background" args={["#f1f5f9"]} />
                <ambientLight intensity={0.5} />
                <pointLight position={[0, 5, 5]} intensity={10} color="#5ee7ff" />

                {/* Energy beam connecting all stages */}
                <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.03, 0.03, 9, 16]} />
                    <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={2} />
                </mesh>

                {STAGES.map((stage, i) => {
                    // Spread 6 nodes along X axis from -4.2 to 4.2
                    const x = -4.2 + (i / 5) * 8.4;
                    return (
                        <PipelineNode3D
                            key={stage.title}
                            position={[x, 0, 0]}
                            stage={stage}
                            index={i}
                            activeStage={activeStage}
                            completedStage={completedStage}
                        />
                    );
                })}

                <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.2} maxPolarAngle={Math.PI / 1.8} minPolarAngle={Math.PI / 2.5} />
            </Canvas>

            <div style={{
                position: "absolute",
                bottom: "10px",
                left: "50%",
                transform: "translateX(-50%)",
                fontSize: "11px",
                fontFamily: "DM Mono",
                letterSpacing: "1px",
                color: "#7c3aed",
                background: "rgba(255, 255, 255, 0.9)",
                padding: "4px 12px",
                borderRadius: "20px",
                border: "1px solid rgba(124, 58, 237, 0.2)",
                pointerEvents: "none"
            }}>
                3D AUTONOMOUS EXECUTION PIPELINE MATRIX
            </div>
        </div>
    );
}
