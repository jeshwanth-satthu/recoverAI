import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function ParticleAtmosphere({ count = 800 }) {
  const pointsRef = useRef();

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    const palette = [
      new THREE.Color("#7c3aed"), // AI Violet
      new THREE.Color("#0284c7"), // Flow Cyan
      new THREE.Color("#059669"), // Recovered Emerald
      new THREE.Color("#e11d48"), // At-Risk Rose
      new THREE.Color("#94a3b8"), // Soft Slate Dust
    ];

    for (let i = 0; i < count; i++) {
      const radius = 5 + Math.random() * 13;
      const theta = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 15;

      pos[i * 3] = radius * Math.cos(theta);
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = radius * Math.sin(theta) - 4;

      const chosenColor = palette[Math.floor(Math.random() * palette.length)];
      col[i * 3] = chosenColor.r;
      col[i * 3 + 1] = chosenColor.g;
      col[i * 3 + 2] = chosenColor.b;
    }

    return [pos, col];
  }, [count]);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y += delta * 0.025;
    pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.03;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.065}
        vertexColors
        transparent
        opacity={0.65}
        depthWrite={false}
      />
    </points>
  );
}
