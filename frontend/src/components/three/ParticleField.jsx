import { useMemo } from "react";

export default function ParticleField({
    count = 900,
}) {
    const positions = useMemo(() => {
        const data = new Float32Array(
            count * 3
        );

        for (let i = 0; i < count * 3; i += 1) {
            data[i] =
                (Math.random() - 0.5) * 14;
        }

        return data;
    }, [count]);

    return (
        <points>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={positions.length / 3}
                    array={positions}
                    itemSize={3}
                />
            </bufferGeometry>

            <pointsMaterial
                color="#8b5cf6"
                size={0.018}
                transparent
                opacity={0.45}
                sizeAttenuation
            />
        </points>
    );
}