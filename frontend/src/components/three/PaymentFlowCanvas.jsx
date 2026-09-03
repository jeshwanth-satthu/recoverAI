import { Canvas } from "@react-three/fiber";
import FlowNetwork from "./FlowNetwork";
import ParticleAtmosphere from "./ParticleAtmosphere";

export default function PaymentFlowCanvas() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#f8fafc]">
      {/* Soft pearl ambient vignette overlay */}
      <div className="absolute inset-0 bg-vignette pointer-events-none z-10" />
      <div className="absolute inset-0 bg-cyber-grid opacity-30 pointer-events-none z-10" />

      <Canvas
        camera={{
          position: [0, 0, 7.6],
          fov: 46,
        }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          top: 0,
          left: 0,
        }}
      >
        <color attach="background" args={["#f8fafc"]} />
        <fog attach="fog" args={["#f8fafc", 7, 22]} />

        {/* 3D Payment Flow Network */}
        <FlowNetwork />

        {/* Floating Atmospheric Particle Field */}
        <ParticleAtmosphere count={900} />
      </Canvas>
    </div>
  );
}
