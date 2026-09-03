import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

export default function EnergyRing({
    radius = 2,
    rotation = [0, 0, 0],
    speed = 0.3,
}) {
    const ring = useRef();

    useFrame((_, delta) => {
        if (!ring.current) return;

        ring.current.rotation.z +=
            delta * speed;
    });

    return (
        <mesh
            ref={ring}
            rotation={rotation}
        >
            <torusGeometry
                args={[
                    radius,
                    0.012,
                    12,
                    128,
                ]}
            />

            <meshBasicMaterial
                color="#6f52ff"
                transparent
                opacity={0.55}
            />
        </mesh>
    );
}