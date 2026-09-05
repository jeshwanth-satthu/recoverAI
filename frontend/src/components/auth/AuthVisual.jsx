import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { motion } from "framer-motion";

// Procedural 3D Scene for the Autonomous Recovery Core
function RecoveryCoreScene({ activeField, authStatus, onStageChange, prefersReducedMotion }) {
  const coreGroupRef = useRef();
  const innerPolyRef = useRef();
  const ring1Ref = useRef();
  const ring2Ref = useRef();
  const ticksRef = useRef();
  const particleRef = useRef();
  const laserBeamRef = useRef();
  const dustParticlesRef = useRef();
  const progressRef = useRef(0);

  // 5 Stage Nodes along a dimensional financial spine
  const curve = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(-2.8, -0.65, 0.2),  // 01 TRANSACTION (Ingress)
      new THREE.Vector3(-1.4, 0.55, -0.3),  // 02 DIAGNOSIS (AI Analysis)
      new THREE.Vector3(0.0, -0.25, 0.4),   // 03 STRATEGY (Optimization)
      new THREE.Vector3(1.4, 0.65, -0.2),   // 04 GUARDRAIL (Deterministic Cap)
      new THREE.Vector3(2.8, 0.05, 0.2),    // 05 RECOVERY (Settled)
    ]);
  }, []);

  const pathGeometry = useMemo(() => {
    const pts = curve.getPoints(100);
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [curve]);

  const nodes = useMemo(() => [
    { pos: new THREE.Vector3(-2.8, -0.65, 0.2), label: "01 TXN", code: "INGRESS" },
    { pos: new THREE.Vector3(-1.4, 0.55, -0.3), label: "02 DIAG", code: "AI_ANALYZE" },
    { pos: new THREE.Vector3(0.0, -0.25, 0.4), label: "03 STRAT", code: "OPTIMIZE" },
    { pos: new THREE.Vector3(1.4, 0.65, -0.2), label: "04 GUARD", code: "SAFETY_CAP" },
    { pos: new THREE.Vector3(2.8, 0.05, 0.2), label: "05 REC", code: "RESOLVED" },
  ], []);

  // Ambient dust particles in background
  const dustGeo = useMemo(() => {
    const count = 48;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 8.5;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 5.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4.0 - 1.0;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  // Laser beam connecting Core to Email form field
  const beamGeo = useMemo(() => {
    const pts = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(4.8, -0.1, 0),
    ];
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);

  useFrame((_, delta) => {
    if (prefersReducedMotion) return;

    // Determine speed multiplier based on auth and interaction states
    const isAccelerating = authStatus === "authenticating" || authStatus === "demo_initializing";
    const speed = isAccelerating ? 3.4 : activeField === "password" ? 1.35 : 1.0;

    // Slow, meditative central rotation
    if (innerPolyRef.current) {
      innerPolyRef.current.rotation.y += delta * 0.25 * speed;
      innerPolyRef.current.rotation.x += delta * 0.12 * speed;
    }

    // Concentric orbital rings with opposing axial tilts
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z += delta * 0.18 * speed;
      ring1Ref.current.rotation.x = 0.55 + Math.sin(Date.now() * 0.0006) * 0.08;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z -= delta * 0.14 * speed;
      ring2Ref.current.rotation.y = -0.35 + Math.cos(Date.now() * 0.0005) * 0.06;
    }
    if (ticksRef.current) {
      ticksRef.current.rotation.z += delta * 0.05 * speed;
    }

    // Password focus tightening animation (smooth scale interpolation)
    if (coreGroupRef.current) {
      const targetScale = activeField === "password" ? 0.94 : 1.0;
      coreGroupRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        delta * 6
      );
    }

    // Progress particle along the recovery spline
    const stepDelta = isAccelerating ? delta * 0.75 : delta * 0.14;
    progressRef.current = (progressRef.current + stepDelta) % 1;

    if (particleRef.current) {
      const pt = curve.getPointAt(progressRef.current);
      particleRef.current.position.copy(pt);

      const mat = particleRef.current.material;
      if (authStatus === "authenticated") {
        mat.color.set("#10b981");
      } else if (progressRef.current < 0.25) {
        // Stage 1 Ingress: Warning/Amber
        mat.color.set("#f59e0b");
      } else if (progressRef.current < 0.75) {
        // Stages 2 & 3: Intelligent diagnosis & strategy (Lake/Cyan blue)
        mat.color.set("#38bdf8");
      } else {
        // Stages 4 & 5: Guardrail verified & settled (Mint/Emerald)
        mat.color.set("#34d399");
      }

      // Notify parent of stage index (0 to 4)
      const stageIdx = Math.min(4, Math.floor(progressRef.current * 5));
      onStageChange?.(stageIdx);
    }

    // Gentle dust drift
    if (dustParticlesRef.current) {
      dustParticlesRef.current.rotation.y += delta * 0.02;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Background ambient data particles */}
      <points ref={dustParticlesRef} geometry={dustGeo}>
        <pointsMaterial
          size={0.035}
          color="#94a3b8"
          transparent
          opacity={0.25}
          sizeAttenuation
        />
      </points>

      {/* Central Interactive Core Group */}
      <group ref={coreGroupRef}>
        {/* Central Low-Poly Financial Geometry (Faceted Icosahedron Lattice) */}
        <group ref={innerPolyRef}>
          {/* Translucent Dark Body */}
          <mesh>
            <icosahedronGeometry args={[1.08, 0]} />
            <meshStandardMaterial
              color="#0a1a36"
              roughness={0.25}
              metalness={0.8}
              transparent
              opacity={0.6}
            />
          </mesh>

          {/* Glowing Outer Wireframe Edges */}
          <mesh>
            <icosahedronGeometry args={[1.09, 0]} />
            <meshBasicMaterial
              color="#38bdf8"
              wireframe
              transparent
              opacity={0.45}
            />
          </mesh>

          {/* Internal Geometric Concentric Nucleus */}
          <mesh>
            <octahedronGeometry args={[0.55, 0]} />
            <meshBasicMaterial
              color="#60a5fa"
              wireframe
              transparent
              opacity={0.65}
            />
          </mesh>
        </group>

        {/* Primary Thin Orbital Ring (Lake Blue) */}
        <mesh ref={ring1Ref} rotation={[0.55, 0.2, 0]}>
          <torusGeometry args={[2.05, 0.008, 16, 120]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.4} />
        </mesh>

        {/* Secondary Counter-Rotating Orbital Ring (Deep Cyan/Indigo) */}
        <mesh ref={ring2Ref} rotation={[-0.45, -0.3, 0]}>
          <torusGeometry args={[2.7, 0.007, 16, 120]} />
          <meshBasicMaterial color="#2b59d1" transparent opacity={0.35} />
        </mesh>

        {/* Outer Coordinate Ring Perimeter */}
        <group ref={ticksRef} rotation={[Math.PI / 2.2, 0, 0]}>
          <lineSegments>
            <edgesGeometry args={[new THREE.RingGeometry(3.3, 3.305, 64)]} />
            <lineBasicMaterial color="#475569" transparent opacity={0.22} />
          </lineSegments>
        </group>

        {/* Dynamic Connection Spline Path */}
        <primitive
          object={
            new THREE.Line(
              pathGeometry,
              new THREE.LineBasicMaterial({
                color: "#38bdf8",
                transparent: true,
                opacity: 0.35,
                linewidth: 1,
              })
            )
          }
        />

        {/* 5 Procedural Pipeline Nodes */}
        {nodes.map((node, i) => (
          <group key={i} position={node.pos}>
            {/* Coordinate Ring Bracket */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.22, 0.24, 32]} />
              <meshBasicMaterial color="#38bdf8" transparent opacity={0.28} />
            </mesh>

            {/* Core Node Glass Lens */}
            <mesh>
              <sphereGeometry args={[0.13, 20, 20]} />
              <meshPhysicalMaterial
                color="#061434"
                transmission={0.85}
                roughness={0.1}
                thickness={0.4}
                transparent
                opacity={0.85}
              />
            </mesh>

            {/* Inner Technical Luminescent Node */}
            <mesh>
              <sphereGeometry args={[0.065, 16, 16]} />
              <meshBasicMaterial
                color={
                  i === 0
                    ? "#f59e0b"
                    : i === 4
                    ? "#10b981"
                    : "#38bdf8"
                }
              />
            </mesh>
          </group>
        ))}

        {/* Active Traveling Particle */}
        <mesh ref={particleRef}>
          <sphereGeometry args={[0.11, 24, 24]} />
          <meshStandardMaterial
            color="#f59e0b"
            emissive="#f59e0b"
            emissiveIntensity={1.2}
            roughness={0.1}
          />
        </mesh>

        {/* Subtle Email Focus Connection Beam */}
        {activeField === "email" && (
          <primitive
            ref={laserBeamRef}
            object={
              new THREE.Line(
                beamGeo,
                new THREE.LineBasicMaterial({
                  color: "#38bdf8",
                  transparent: true,
                  opacity: 0.45,
                })
              )
            }
          />
        )}
      </group>

      {/* Lighting Rig */}
      <ambientLight intensity={0.9} />
      <directionalLight position={[4, 6, 5]} intensity={1.4} color="#93c5fd" />
      <pointLight position={[0, 0, 0]} intensity={1.6} distance={6} color="#38bdf8" />
    </group>
  );
}

export default function AuthVisual({ activeField = null, authStatus = "idle" }) {
  const [activeStageIdx, setActiveStageIdx] = useState(0);
  const [hasWebGLError, setHasWebGLError] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const stages = [
    { num: "01", label: "TRANSACTION", desc: "Atomic webhook ingress & idempotency lock" },
    { num: "02", label: "DIAGNOSIS", desc: "Gemini diagnostic model identifies failure root cause" },
    { num: "03", label: "STRATEGY", desc: "Adaptive strategy selects bounded recovery action" },
    { num: "04", label: "GUARDRAIL", desc: "Deterministic safety constraints evaluate autonomy cap" },
    { num: "05", label: "RECOVERY", desc: "Verified resolution & attributed revenue settlement" },
  ];

  // Subtle Generative Technical Field (low-opacity abstract characters around the core)
  const technicalField = [
    { text: "TX.INGRESS // IDEMP_LOCK", top: "14%", left: "8%" },
    { text: "PAY → CAPTURE", top: "24%", left: "42%" },
    { text: "AI.GEMINI // ROOT_CAUSE", top: "18%", right: "12%" },
    { text: "ML.BANDIT // STRATEGY", top: "70%", left: "10%" },
    { text: "GUARD.CAP // CEILING_CHECK", top: "66%", right: "14%" },
    { text: "RECOVER // SETTLED ✓", top: "78%", right: "26%" },
    { text: "01 · 02 · 03 · 04 · 05", bottom: "24%", left: "36%" },
    { text: "• 14.288 // 0x4F9B", top: "42%", left: "4%" },
    { text: "SYS.REC // AUTON_3", top: "44%", right: "6%" },
    { text: "PIPE.01 // ACTIVE", bottom: "16%", left: "14%" },
  ];

  return (
    <div className="relative flex flex-col justify-between w-full h-full p-4 sm:p-8 lg:p-10 select-none overflow-hidden font-mono">
      
      {/* 1. TOP LABEL: CONCEPT HEADLINE (RESTRAINED, RESEARCH-LAB FEEL) */}
      <div className="relative z-10 space-y-1.5 max-w-lg">
        <div className="flex items-center gap-2 text-[10px] sm:text-[11px] uppercase tracking-widest text-slate-400">
          <span className="size-1.5 rounded-full bg-[#38bdf8] animate-pulse" />
          <span>AUTONOMOUS REVENUE RECOVERY</span>
        </div>
        <h2 className="text-lg sm:text-2xl lg:text-3xl text-slate-100 font-normal tracking-tight leading-snug">
          The recovery engine is already running.
        </h2>
        <p className="hidden sm:block text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md">
          Continuous telemetry diagnosis, autonomous action selection, and deterministic safety guardrails.
        </p>
      </div>

      {/* 2. CENTER: PROCEDURAL RECOVERY CORE + GENERATIVE ASCII DATA LAYER */}
      <div className="relative w-full h-[180px] sm:h-[260px] lg:h-[440px] my-auto flex items-center justify-center">
        
        {/* Subtle Ethereal Radial Glow behind Recovery Core */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.08) 0%, rgba(43, 89, 209, 0.04) 40%, transparent 70%)",
          }}
        />

        {/* Generative ASCII / Technical Data Layer (very low opacity, discovered subtly) */}
        <div className="absolute inset-0 pointer-events-none select-none z-0">
          {technicalField.map((item, idx) => (
            <span
              key={idx}
              className="absolute text-[10px] tracking-wider text-slate-400/20 font-mono transition-opacity duration-500 hover:text-slate-300/40"
              style={{
                top: item.top,
                bottom: item.bottom,
                left: item.left,
                right: item.right,
              }}
            >
              {item.text}
            </span>
          ))}
        </div>

        {/* 3D Canvas */}
        {!hasWebGLError ? (
          <div className="w-full h-full relative z-10">
            <Canvas
              dpr={[1, 1.5]}
              camera={{ position: [0, 0, 6.2], fov: 46 }}
              gl={{
                antialias: true,
                alpha: true,
                powerPreference: "high-performance",
              }}
              onCreated={({ gl }) => {
                gl.setClearColor(0x000000, 0);
              }}
              onError={() => setHasWebGLError(true)}
            >
              <RecoveryCoreScene
                activeField={activeField}
                authStatus={authStatus}
                onStageChange={setActiveStageIdx}
                prefersReducedMotion={prefersReducedMotion}
              />
            </Canvas>
          </div>
        ) : (
          /* Graceful Fallback */
          <div className="flex flex-wrap items-center justify-center gap-2 p-6 rounded-lg bg-slate-900/60 border border-slate-800">
            {stages.map((st, i) => (
              <span
                key={i}
                className={`px-3 py-1 text-xs rounded border ${
                  i === activeStageIdx
                    ? "border-sky-500 text-sky-400 bg-sky-950/40"
                    : "border-slate-800 text-slate-500"
                }`}
              >
                {st.num} {st.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 3. RECOVERY FLOW PIPELINE STAGES TRACK */}
      <div className="relative z-10 space-y-3 pt-4 border-t border-slate-800/70">
        
        {/* Milestone Indicator Bar */}
        <div className="grid grid-cols-5 gap-1 sm:gap-2">
          {stages.map((st, i) => {
            const isActive = i === activeStageIdx;
            const isPassed = i < activeStageIdx;
            return (
              <div
                key={i}
                className={`flex flex-col p-2 rounded transition-all duration-300 ${
                  isActive
                    ? "bg-[#162238]/90 border border-[#38bdf8]/40 shadow-sm"
                    : "bg-[#0b1222]/40 border border-slate-800/50"
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className={isActive ? "text-[#38bdf8]" : isPassed ? "text-slate-400" : "text-slate-600"}>
                    {st.num}
                  </span>
                  <span
                    className={`size-1.5 rounded-full ${
                      isActive
                        ? "bg-[#38bdf8] animate-ping"
                        : isPassed
                        ? "bg-emerald-500"
                        : "bg-slate-700"
                    }`}
                  />
                </div>
                <span
                  className={`text-[10px] sm:text-[11px] font-mono tracking-wider truncate mt-0.5 ${
                    isActive ? "text-slate-100 font-medium" : "text-slate-500"
                  }`}
                >
                  {st.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Abstract System Flow Caption (No Fake Telemetry) */}
        <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-mono text-slate-500">
          <span className="tracking-wider">
            FAILED PAYMENT → DIAGNOSIS → STRATEGY → GUARDRAIL → RECOVERY
          </span>
          <span className="hidden sm:inline text-slate-400">
            STAGE 0{activeStageIdx + 1} / 05
          </span>
        </div>
      </div>
    </div>
  );
}
