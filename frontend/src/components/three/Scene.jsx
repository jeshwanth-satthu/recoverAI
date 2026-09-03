import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

import RecoveryCore from "./RecoveryCore";
import ParticleField from "./ParticleField";
import EnergyRing from "./EnergyRing";

function MouseLight() {
    const lightRef = useRef();

    useFrame((state) => {
        if (!lightRef.current) return;
        // Follow mouse cursor in 3D scene space smoothly
        const x = (state.pointer.x * 6);
        const y = (state.pointer.y * 4);
        lightRef.current.position.set(x, y, 4);
    });

    return (
        <pointLight
            ref={lightRef}
            intensity={15}
            distance={10}
            color="#5ee7ff"
        />
    );
}

export default function Scene({ status = "active", viewMode = "core" }) {
    return (
        <Canvas
            camera={{
                position: [0, 0, 6.2],
                fov: 45,
            }}
            dpr={[1, 2]}
            gl={{ antialias: true, alpha: true }}
            style={{ width: "100%", height: "100%", position: "relative", zIndex: 1 }}
        >
            <color attach="background" args={["#f8fafc"]} />

            {/* LIGHTING SYSTEM */}
            <ambientLight intensity={0.4} />

            <pointLight
                position={[4, 4, 5]}
                intensity={16}
                color="#8b5cf6"
            />

            <pointLight
                position={[-5, -3, 3]}
                intensity={10}
                color="#5ee7ff"
            />

            <MouseLight />

            {/* MAIN CORE */}
            <RecoveryCore status={status} />

            {/* ENERGY RINGS */}
            <EnergyRing
                radius={2.1}
                rotation={[0.8, 0.3, 0]}
                speed={0.4}
                color="#8b5cf6"
            />

            <EnergyRing
                radius={2.5}
                rotation={[1.4, 0.2, 0.5]}
                speed={-0.3}
                color="#5ee7ff"
            />

            <EnergyRing
                radius={3.0}
                rotation={[-0.5, 0.9, 0.2]}
                speed={0.2}
                color="#a78bfa"
            />

            {/* PARTICLE MATRIX */}
            <ParticleField count={1200} />

            <Environment preset="city" />

            <OrbitControls
                enableZoom={false}
                enablePan={false}
                autoRotate
                autoRotateSpeed={0.35}
                maxPolarAngle={Math.PI / 1.5}
                minPolarAngle={Math.PI / 3}
            />
        </Canvas>
    );
}