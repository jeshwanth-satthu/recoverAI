import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

function GlobeMesh() {
    const sphereRef = useRef();
    const dotsRef = useRef();

    useFrame((state, delta) => {
        if (sphereRef.current) {
            sphereRef.current.rotation.y += delta * 0.2;
        }
        if (dotsRef.current) {
            dotsRef.current.rotation.y -= delta * 0.15;
        }
    });

    return (
        <group>
            {/* Holographic Planet Wireframe */}
            <mesh ref={sphereRef}>
                <sphereGeometry args={[1.8, 28, 28]} />
                <meshStandardMaterial
                    color="#8b5cf6"
                    emissive="#32177d"
                    emissiveIntensity={1.2}
                    wireframe
                    transparent
                    opacity={0.35}
                />
            </mesh>

            {/* Glowing inner core */}
            <mesh scale={1.2}>
                <sphereGeometry args={[1, 32, 32]} />
                <meshBasicMaterial color="#5ee7ff" transparent opacity={0.1} />
            </mesh>

            {/* Active Transaction Gateway Pings */}
            <group ref={dotsRef}>
                {[
                    [1.2, 1.1, 0.8, "#36e2a0"],
                    [-1.4, 0.6, -0.9, "#ff7185"],
                    [0.8, -1.2, 1.0, "#5ee7ff"],
                    [-0.9, -1.1, -1.2, "#ffbf67"],
                    [1.5, -0.4, -0.7, "#a78bfa"],
                ].map(([x, y, z, col], idx) => (
                    <mesh key={idx} position={[x, y, z]}>
                        <sphereGeometry args={[0.08, 16, 16]} />
                        <meshBasicMaterial color={col} />
                    </mesh>
                ))}
            </group>
        </group>
    );
}

export default function CyberGlobe() {
    return (
        <div style={{ width: "100%", height: "240px", position: "relative" }}>
            <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
                <color attach="background" args={["#f8fafc"]} />
                <ambientLight intensity={0.5} />
                <pointLight position={[3, 3, 3]} intensity={12} color="#5ee7ff" />

                <Float speed={1.8} rotationIntensity={0.2} floatIntensity={0.3}>
                    <GlobeMesh />
                </Float>

                <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
            </Canvas>

            <div style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                fontSize: "10px",
                fontFamily: "DM Mono",
                color: "#7c3aed",
                background: "rgba(255, 255, 255, 0.9)",
                padding: "3px 8px",
                borderRadius: "6px",
                border: "1px solid rgba(124, 58, 237, 0.2)"
            }}>
                LIVE GATEWAY NODES: 5 ONLINE
            </div>
        </div>
    );
}
