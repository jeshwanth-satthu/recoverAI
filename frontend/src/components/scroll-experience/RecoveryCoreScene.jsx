import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

/**
 * Stage definitions in 3D space with financial-tech aesthetic colors
 */
export const STAGES_3D = [
  {
    id: "01",
    key: "transaction",
    label: "TRANSACTION",
    sublabel: "Failed Payment Ingestion",
    pos: [-4.2, 0.6, 0],
    color: "#ff9473", // Coral / Red failure accent
    secondaryColor: "#f37a0a",
  },
  {
    id: "02",
    key: "diagnosis",
    label: "DIAGNOSIS",
    sublabel: "Telemetry & Cause Analysis",
    pos: [-2.8, -0.2, 0.4],
    color: "#a0b5eb", // Sky blue analysis
    secondaryColor: "#2b59d1",
  },
  {
    id: "03",
    key: "strategy",
    label: "ML STRATEGY",
    sublabel: "Policy Optimization Engine",
    pos: [-1.4, 0.4, -0.3],
    color: "#cfdaf5", // Periwinkle mist
    secondaryColor: "#2b59d1",
  },
  {
    id: "04",
    key: "guardrail",
    label: "GUARDRAIL",
    sublabel: "Deterministic Safety Gate",
    pos: [0, -0.1, 0.2],
    color: "#ecda98", // Gold / Amber caution
    secondaryColor: "#f37a0a",
  },
  {
    id: "05",
    key: "execution",
    label: "EXECUTION",
    sublabel: "Autonomous Dispatch Conduit",
    pos: [1.4, 0.5, -0.2],
    color: "#2b59d1", // Deep lake blue
    secondaryColor: "#a0b5eb",
  },
  {
    id: "06",
    key: "verification",
    label: "VERIFICATION",
    sublabel: "Settlement Ledger Audit",
    pos: [2.8, -0.3, 0.3],
    color: "#797776", // Neutral precision
    secondaryColor: "#a7fccd",
  },
  {
    id: "07",
    key: "recovery",
    label: "RECOVERED",
    sublabel: "Revenue Returned to Merchant",
    pos: [4.2, 0.4, 0],
    color: "#059669", // Mint / Emerald success
    secondaryColor: "#a7fccd",
  },
];

/**
 * 3D Spline Curve connecting all 7 stages seamlessly
 */
function usePipelineCurve() {
  return useMemo(() => {
    const points = STAGES_3D.map((s) => new THREE.Vector3(...s.pos));
    return new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.3);
  }, []);
}

/**
 * Animated transaction particle traversing the 7-stage spline
 */
function TransactionParticle({
  curve,
  currentProgress,
  isPaused,
  isBlocked,
  pulseRecovery,
}) {
  const meshRef = useRef();
  const ringRef = useRef();
  const trailRef = useRef([]);

  useFrame((state, delta) => {
    if (!meshRef.current || !curve) return;

    // Use currentProgress passed from scroll or animate smoothly
    const t = Math.max(0, Math.min(1, currentProgress));
    const point = curve.getPoint(t);
    meshRef.current.position.copy(point);

    const time = state.clock.elapsedTime;

    // Subtle breathing scale
    const baseScale = isBlocked ? 1.4 : 1.1;
    const pulse = isBlocked
      ? 1 + Math.sin(time * 8) * 0.25 // Fast amber caution pulse
      : pulseRecovery
      ? 1.5 + Math.sin(time * 12) * 0.4 // Big celebratory pulse
      : 1 + Math.sin(time * 3) * 0.15; // Calm financial pulse

    meshRef.current.scale.setScalar(baseScale * pulse);

    if (ringRef.current) {
      ringRef.current.position.copy(point);
      ringRef.current.rotation.z += delta * (isBlocked ? 4 : 1.5);
      ringRef.current.rotation.x = Math.PI / 3 + Math.sin(time * 2) * 0.2;
    }
  });

  const particleColor = isBlocked
    ? "#f37a0a" // Guardrail Amber
    : pulseRecovery
    ? "#059669" // Emerald Recovered
    : currentProgress > 0.88
    ? "#059669" // Stage 7
    : currentProgress > 0.43
    ? "#2b59d1" // Post-guardrail blue
    : "#ff9473"; // Pre-guardrail coral

  return (
    <group>
      {/* Central Transaction Nucleus */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.14, 24, 24]} />
        <meshStandardMaterial
          color={particleColor}
          emissive={particleColor}
          emissiveIntensity={2.5}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>

      {/* Orbital Trajectory Ring around Particle */}
      <mesh ref={ringRef}>
        <ringGeometry args={[0.22, 0.26, 32]} />
        <meshBasicMaterial
          color={particleColor}
          side={THREE.DoubleSide}
          transparent
          opacity={0.8}
        />
      </mesh>
    </group>
  );
}

/**
 * 3D Stage Architectural Node
 */
function StageNode({ stage, index, activeIndex, isBlocked }) {
  const groupRef = useRef();
  const ringRef = useRef();
  const isActive = activeIndex === index;
  const isPast = activeIndex > index;
  const isGuardrailBlocked = stage.key === "guardrail" && isBlocked;

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const time = state.clock.elapsedTime + index * 0.4;

    if (ringRef.current) {
      ringRef.current.rotation.z += delta * (isActive ? 0.8 : 0.2);
    }

    if (isActive) {
      groupRef.current.position.y =
        stage.pos[1] + Math.sin(time * 2.5) * 0.08;
    } else {
      groupRef.current.position.y = stage.pos[1];
    }
  });

  const nodeColor = isGuardrailBlocked
    ? "#f37a0a"
    : isActive
    ? stage.secondaryColor || stage.color
    : isPast
    ? "#059669"
    : "#cecac8";

  return (
    <group ref={groupRef} position={stage.pos}>
      {/* Outer Floating Architectural Panel */}
      <mesh rotation={[0, 0.2, 0]}>
        <boxGeometry args={[0.42, 0.72, 0.04]} />
        <meshPhysicalMaterial
          color={isActive ? "#ffffff" : "#f6f3f1"}
          transmission={0.85}
          opacity={isActive ? 0.95 : 0.65}
          transparent
          roughness={0.15}
          metalness={0.1}
          reflectivity={0.9}
          clearcoat={1}
        />
      </mesh>

      {/* Outer Hairline Border */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(0.42, 0.72, 0.04)]} />
        <lineBasicMaterial
          color={isActive ? stage.color : "#cecac8"}
          transparent
          opacity={isActive ? 0.9 : 0.4}
        />
      </lineSegments>

      {/* Internal Core Node Indicator */}
      <mesh position={[0, 0, 0.03]}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial
          color={nodeColor}
          emissive={nodeColor}
          emissiveIntensity={isActive ? 2.2 : 0.4}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Rotating Concentric Ground Ring under node */}
      <mesh
        ref={ringRef}
        position={[0, -0.48, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[0.22, 0.26, 32]} />
        <meshBasicMaterial
          color={isActive ? stage.color : "#cecac8"}
          side={THREE.DoubleSide}
          transparent
          opacity={isActive ? 0.7 : 0.2}
        />
      </mesh>

      {/* Stage Number Label Indicator */}
      {isGuardrailBlocked && (
        <mesh position={[0, 0.52, 0]}>
          <octahedronGeometry args={[0.12, 0]} />
          <meshStandardMaterial
            color="#f37a0a"
            emissive="#f37a0a"
            emissiveIntensity={3}
          />
        </mesh>
      )}
    </group>
  );
}

/**
 * Central Abstract Architectural Ring Platform
 */
function ArchitecturalPedestal({ pulseRecovery }) {
  const ringsRef = useRef();

  useFrame((_, delta) => {
    if (ringsRef.current) {
      ringsRef.current.rotation.y += delta * 0.08;
    }
  });

  return (
    <group position={[0, -1.2, 0]} ref={ringsRef}>
      {/* Concentric Base Stepped Discs */}
      {[1.8, 2.6, 3.4].map((radius, idx) => (
        <mesh
          key={idx}
          position={[0, -idx * 0.06, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[radius - 0.02, radius, 64]} />
          <meshBasicMaterial
            color={pulseRecovery ? "#a7fccd" : "#cecac8"}
            side={THREE.DoubleSide}
            transparent
            opacity={0.35 - idx * 0.08}
          />
        </mesh>
      ))}

      {/* Dotted Ambient Wireframe Globe at Platform Base */}
      <mesh position={[0, 0.15, 0]}>
        <sphereGeometry args={[0.35, 16, 12]} />
        <meshBasicMaterial
          color="#797776"
          wireframe
          transparent
          opacity={0.3}
        />
      </mesh>
    </group>
  );
}

/**
 * 3D Spline Pipeline Ribbon
 */
function PipelineDataStream({ curve, activeProgress }) {
  const linePoints = useMemo(() => {
    if (!curve) return [];
    return curve.getPoints(120);
  }, [curve]);

  const lineGeometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(linePoints);
  }, [linePoints]);

  return (
    <group>
      {/* Thin Technical Guide Line */}
      <line geometry={lineGeometry}>
        <lineBasicMaterial
          color="#cecac8"
          transparent
          opacity={0.5}
          linewidth={1}
        />
      </line>

      {/* Active Laser Core Line */}
      <line geometry={lineGeometry}>
        <lineBasicMaterial
          color="#2b59d1"
          transparent
          opacity={0.7}
          linewidth={1.5}
        />
      </line>
    </group>
  );
}

/**
 * Master 3D Recovery Core Scene Component
 */
export default function RecoveryCoreScene({
  progress = 0,
  activeStageIndex = 0,
  isBlocked = false,
  pulseRecovery = false,
  onSelectStage,
}) {
  const curve = usePipelineCurve();

  return (
    <div className="relative w-full h-[380px] sm:h-[420px] md:h-[460px] select-none rounded-[32px] overflow-hidden">
      <Canvas
        camera={{ position: [0, 0.6, 6.8], fov: 48 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        style={{ width: "100%", height: "100%" }}
      >
        <color attach="background" args={["#f6f3f1"]} />
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 10, 7]} intensity={1.4} color="#ffffff" />
        <pointLight position={[-4, 2, 3]} intensity={1.5} color="#ff9473" />
        <pointLight position={[4, 2, 3]} intensity={1.8} color="#a7fccd" />

        {/* 3D Curve Ribbon */}
        <PipelineDataStream curve={curve} activeProgress={progress} />

        {/* Animated Moving Transaction Particle */}
        <TransactionParticle
          curve={curve}
          currentProgress={progress}
          isBlocked={isBlocked}
          pulseRecovery={pulseRecovery}
        />

        {/* 7 Stage Architectural Nodes */}
        {STAGES_3D.map((stage, idx) => (
          <StageNode
            key={stage.id}
            stage={stage}
            index={idx}
            activeIndex={activeStageIndex}
            isBlocked={isBlocked}
          />
        ))}

        {/* Architectural Pedestal */}
        <ArchitecturalPedestal pulseRecovery={pulseRecovery} />

        {/* Restrained Orbit Controls for Interactive Pan/Tilt */}
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          maxPolarAngle={Math.PI / 1.8}
          minPolarAngle={Math.PI / 2.3}
          maxAzimuthAngle={Math.PI / 8}
          minAzimuthAngle={-Math.PI / 8}
        />
      </Canvas>

      {/* Floating System Rationale Overlay Badge */}
      <div className="absolute top-4 right-4 z-10 pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#cecac8] bg-[#f6f3f1]/90 backdrop-blur-md text-[10px] font-mono uppercase tracking-wider text-[#242424]">
          <span
            className={`size-1.5 rounded-full ${
              isBlocked ? "bg-[#f37a0a] animate-ping" : "bg-[#059669] animate-pulse"
            }`}
          />
          <span>
            {isBlocked
              ? "GUARDRAIL INTERCEPT ACTIVE"
              : STAGES_3D[activeStageIndex]?.sublabel || "AUTONOMOUS CORE"}
          </span>
        </div>
      </div>
    </div>
  );
}
