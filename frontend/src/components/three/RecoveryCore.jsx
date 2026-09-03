import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";

export default function RecoveryCore({ status = "active", hoverEffect = false }) {
    const coreRef = useRef();
    const wireframeRef = useRef();
    const glowRef = useRef();
    const satellitesGroup = useRef();

    useFrame((state, delta) => {
        if (!coreRef.current || !wireframeRef.current) return;

        const time = state.clock.elapsedTime;

        // Core rotations
        coreRef.current.rotation.y += delta * 0.35;
        coreRef.current.rotation.x += delta * 0.15;

        wireframeRef.current.rotation.y -= delta * 0.25;
        wireframeRef.current.rotation.z += delta * 0.1;

        if (glowRef.current) {
            glowRef.current.rotation.y -= delta * 0.08;
            const glowScale = 1.6 + Math.sin(time * 2.5) * 0.05;
            glowRef.current.scale.setScalar(glowScale);
        }

        // Orbiting satellites rotation
        if (satellitesGroup.current) {
            satellitesGroup.current.rotation.y += delta * 0.5;
            satellitesGroup.current.rotation.x = Math.sin(time * 0.5) * 0.2;
        }

        // Dynamic pulsing
        const coreScale = (hoverEffect ? 1.35 : 1.25) + Math.sin(time * 2) * 0.03;
        coreRef.current.scale.setScalar(coreScale);
    });

    const isSuccess = status === "recovered";
    const coreColor = isSuccess ? "#36e2a0" : "#8b5cf6";
    const emissiveColor = isSuccess ? "#0e6e46" : "#32177d";

    return (
        <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.6}>
            <group>
                {/* INNER DISPLACED GLOWING AI NUCLEUS */}
                <mesh ref={coreRef} scale={1.25}>
                    <icosahedronGeometry args={[1.2, 5]} />
                    <MeshDistortMaterial
                        color={coreColor}
                        emissive={emissiveColor}
                        emissiveIntensity={2.5}
                        roughness={0.15}
                        metalness={0.8}
                        distort={0.28}
                        speed={2.2}
                    />
                </mesh>

                {/* OUTER FUTURISTIC HOLOGRAPHIC WIREFRAME MATRIX */}
                <mesh ref={wireframeRef} scale={1.65}>
                    <icosahedronGeometry args={[1.2, 2]} />
                    <meshBasicMaterial
                        color="#5ee7ff"
                        wireframe
                        transparent
                        opacity={0.35}
                    />
                </mesh>

                {/* AMBIENT GLOW SPHERE */}
                <mesh ref={glowRef} scale={1.6}>
                    <sphereGeometry args={[1, 32, 32]} />
                    <meshBasicMaterial
                        color={coreColor}
                        transparent
                        opacity={0.06}
                    />
                </mesh>

                {/* ORBITING DATA NODES / SATELLITES */}
                <group ref={satellitesGroup}>
                    {[0, 1, 2, 3].map((index) => {
                        const angle = (index / 4) * Math.PI * 2;
                        const radius = 2.4;
                        const x = Math.cos(angle) * radius;
                        const z = Math.sin(angle) * radius;
                        return (
                            <mesh key={index} position={[x, (index % 2 === 0 ? 0.3 : -0.3), z]} scale={0.15}>
                                <boxGeometry args={[1, 1, 1]} />
                                <meshStandardMaterial
                                    color="#5ee7ff"
                                    emissive="#5ee7ff"
                                    emissiveIntensity={3}
                                    roughness={0.1}
                                />
                            </mesh>
                        );
                    })}
                </group>
            </group>
        </Float>
    );
}