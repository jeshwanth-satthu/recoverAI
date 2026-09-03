import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Animated energy pulse traveling along a 3D bezier curve
 */
function FlowPulse({ curve, speed = 1, color = "#059669", size = 0.09, offset = 0 }) {
  const meshRef = useRef();

  useFrame((state) => {
    if (!meshRef.current || !curve) return;
    const t = ((state.clock.elapsedTime * speed * 0.2 + offset) % 1);
    const point = curve.getPoint(t);
    meshRef.current.position.copy(point);
    const scale = 1 + Math.sin(state.clock.elapsedTime * 6 + offset * 10) * 0.25;
    meshRef.current.scale.setScalar(scale);
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[size, 16, 16]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

/**
 * 3D Bezier curve line connection with high contrast for white mode
 */
function ConnectionBeam({ start, control1, control2, end, color = "#0284c7", opacity = 0.45 }) {
  const curve = useMemo(() => {
    return new THREE.CubicBezierCurve3(
      new THREE.Vector3(...start),
      new THREE.Vector3(...control1),
      new THREE.Vector3(...control2),
      new THREE.Vector3(...end)
    );
  }, [start, control1, control2, end]);

  const lineGeometry = useMemo(() => {
    const points = curve.getPoints(50);
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [curve]);

  return (
    <group>
      <line geometry={lineGeometry}>
        <lineBasicMaterial color={color} transparent opacity={opacity} linewidth={1.5} />
      </line>
      <FlowPulse curve={curve} speed={0.9} color={color} offset={0} />
      <FlowPulse curve={curve} speed={0.9} color={color} offset={0.5} size={0.07} />
    </group>
  );
}

/**
 * Pulsing Transaction Node Sphere with orbital ring
 */
function TransactionNode({ position, color, ringColor, pulseSpeed = 2, size = 0.19 }) {
  const nodeRef = useRef();
  const ringRef = useRef();

  useFrame((state) => {
    if (!nodeRef.current) return;
    const pulse = 1 + Math.sin(state.clock.elapsedTime * pulseSpeed) * 0.12;
    nodeRef.current.scale.setScalar(pulse);
    if (ringRef.current) {
      ringRef.current.rotation.z += 0.015;
    }
  });

  return (
    <group position={position}>
      <mesh ref={nodeRef}>
        <sphereGeometry args={[size, 24, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.2}
          roughness={0.25}
          metalness={0.7}
        />
      </mesh>

      <mesh ref={ringRef} rotation={[Math.PI / 3, 0, 0]}>
        <ringGeometry args={[size * 1.6, size * 1.85, 32]} />
        <meshBasicMaterial
          color={ringColor || color}
          side={THREE.DoubleSide}
          transparent
          opacity={0.65}
        />
      </mesh>
    </group>
  );
}

export default function FlowNetwork() {
  const groupRef = useRef();
  const coreRef = useRef();
  const innerCoreRef = useRef();
  const ring1Ref = useRef();
  const ring2Ref = useRef();
  const ring3Ref = useRef();
  const mouseLightRef = useRef();

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        state.pointer.x * 0.25,
        delta * 2
      );
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        -state.pointer.y * 0.18,
        delta * 2
      );
    }

    if (coreRef.current) {
      coreRef.current.rotation.x += delta * 0.3;
      coreRef.current.rotation.y += delta * 0.4;
      const s = 1 + Math.sin(state.clock.elapsedTime * 2.5) * 0.08;
      coreRef.current.scale.set(s, s, s);
    }

    if (innerCoreRef.current) {
      innerCoreRef.current.rotation.y -= delta * 0.5;
    }

    if (ring1Ref.current) ring1Ref.current.rotation.z += delta * 0.4;
    if (ring2Ref.current) ring2Ref.current.rotation.x += delta * 0.35;
    if (ring3Ref.current) ring3Ref.current.rotation.y += delta * 0.25;

    if (mouseLightRef.current) {
      mouseLightRef.current.position.x = THREE.MathUtils.lerp(
        mouseLightRef.current.position.x,
        state.pointer.x * 6,
        0.05
      );
      mouseLightRef.current.position.y = THREE.MathUtils.lerp(
        mouseLightRef.current.position.y,
        state.pointer.y * 4,
        0.05
      );
    }
  });

  return (
    <group ref={groupRef}>
      <pointLight ref={mouseLightRef} position={[0, 0, 4]} intensity={20} distance={12} color="#0284c7" />

      <ambientLight intensity={0.75} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} />
      <pointLight position={[6, 4, 3]} intensity={14} color="#7c3aed" />
      <pointLight position={[-6, -3, 3]} intensity={12} color="#e11d48" />
      <pointLight position={[6, -4, 2]} intensity={14} color="#059669" />

      {/* 1. CENTRAL RECOVERAI NEURAL CORE */}
      <group position={[0, 0, 0]}>
        <mesh ref={coreRef}>
          <icosahedronGeometry args={[1.1, 1]} />
          <meshStandardMaterial
            color="#6d28d9"
            wireframe
            emissive="#7c3aed"
            emissiveIntensity={0.8}
          />
        </mesh>

        <mesh ref={innerCoreRef}>
          <octahedronGeometry args={[0.55, 0]} />
          <meshStandardMaterial
            color="#0284c7"
            emissive="#0284c7"
            emissiveIntensity={1.8}
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>

        <group ref={ring1Ref} rotation={[0.4, 0.2, 0]}>
          <mesh>
            <torusGeometry args={[1.7, 0.016, 16, 100]} />
            <meshBasicMaterial color="#7c3aed" transparent opacity={0.7} />
          </mesh>
        </group>

        <group ref={ring2Ref} rotation={[1.2, -0.4, 0.3]}>
          <mesh>
            <torusGeometry args={[2.0, 0.016, 16, 100]} />
            <meshBasicMaterial color="#0284c7" transparent opacity={0.65} />
          </mesh>
        </group>

        <group ref={ring3Ref} rotation={[-0.8, 0.7, 0.2]}>
          <mesh>
            <torusGeometry args={[2.3, 0.016, 16, 100]} />
            <meshBasicMaterial color="#059669" transparent opacity={0.6} />
          </mesh>
        </group>
      </group>

      {/* 2. AT-RISK TRANSACTION NODES (Rose / Amber) */}
      <TransactionNode position={[-4.2, 1.8, -1.2]} color="#e11d48" ringColor="#f43f5e" size={0.21} pulseSpeed={3} />
      <TransactionNode position={[-4.8, -0.8, -0.5]} color="#d97706" ringColor="#f59e0b" size={0.18} pulseSpeed={2.4} />
      <TransactionNode position={[-3.6, -2.4, -1.8]} color="#e11d48" ringColor="#fb7185" size={0.2} pulseSpeed={3.2} />

      {/* 3. RECOVERED REVENUE VAULT NODES (Emerald / Cyan) */}
      <TransactionNode position={[4.2, 1.6, -0.8]} color="#059669" ringColor="#10b981" size={0.23} pulseSpeed={1.8} />
      <TransactionNode position={[4.9, -1.2, -1.4]} color="#0284c7" ringColor="#38bdf8" size={0.19} pulseSpeed={2.2} />
      <TransactionNode position={[3.8, -2.6, -0.6]} color="#059669" ringColor="#34d399" size={0.21} pulseSpeed={1.6} />

      {/* 4. HIGH CONTRAST BEZIER PIPELINE DATA STREAMS */}
      <ConnectionBeam
        start={[-4.2, 1.8, -1.2]}
        control1={[-2.4, 2.2, 0]}
        control2={[-1.2, 1.0, 0.5]}
        end={[0, 0.2, 0]}
        color="#e11d48"
        opacity={0.45}
      />
      <ConnectionBeam
        start={[-4.8, -0.8, -0.5]}
        control1={[-3.0, -1.4, 0.2]}
        control2={[-1.5, -0.6, 0.4]}
        end={[0, -0.2, 0]}
        color="#d97706"
        opacity={0.45}
      />
      <ConnectionBeam
        start={[-3.6, -2.4, -1.8]}
        control1={[-2.2, -2.0, -0.5]}
        control2={[-1.0, -1.2, 0]}
        end={[0, -0.4, 0]}
        color="#7c3aed"
        opacity={0.45}
      />

      <ConnectionBeam
        start={[0, 0.2, 0]}
        control1={[1.2, 1.2, 0.5]}
        control2={[2.6, 2.0, 0]}
        end={[4.2, 1.6, -0.8]}
        color="#059669"
        opacity={0.5}
      />
      <ConnectionBeam
        start={[0, -0.1, 0]}
        control1={[1.6, -0.4, 0.4]}
        control2={[3.2, -1.6, 0.2]}
        end={[4.9, -1.2, -1.4]}
        color="#0284c7"
        opacity={0.5}
      />
      <ConnectionBeam
        start={[0, -0.4, 0]}
        control1={[1.4, -1.8, 0]}
        control2={[2.4, -2.4, -0.2]}
        end={[3.8, -2.6, -0.6]}
        color="#059669"
        opacity={0.5}
      />
    </group>
  );
}
