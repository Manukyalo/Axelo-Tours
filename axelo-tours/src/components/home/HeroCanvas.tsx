"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";

function Particles() {
  const ref = useRef<THREE.Points>(null!);
  
  // Create random points for savannah dust
  const points = useMemo(() => {
    const p = new Float32Array(2000 * 3);
    for (let i = 0; i < 2000; i++) {
        p[i * 3] = (Math.random() - 0.5) * 10;
        p[i * 3 + 1] = (Math.random() - 0.5) * 10;
        p[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return p;
  }, []);

  useFrame((state, delta) => {
    if (ref.current) {
        // Subtle rotation and drift
        ref.current.rotation.x += delta * 0.05;
        ref.current.rotation.y += delta * 0.03;
        
        // Gentle y-axis floating
        ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <Points ref={ref} positions={points} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#C8962E" // Gold/Accent color for sunlit dust
        size={0.015}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.4}
      />
    </Points>
  );
}

function SunriseEffect() {
    return (
        <>
            <ambientLight intensity={0.2} />
            <directionalLight 
                position={[5, 5, 5]} 
                intensity={1.5} 
                color="#FF9E4D" // Sunrise orange
            />
            <spotLight 
                position={[-5, 10, 10]} 
                angle={0.15} 
                penumbra={1} 
                intensity={1} 
                color="#C8962E" // Gold light
            />
        </>
    );
}

export default function HeroCanvas() {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        gl={{ antialias: true, alpha: true }}
      >
        <SunriseEffect />
        <Particles />
        <fog attach="fog" args={["#0D1B0F", 5, 15]} />
      </Canvas>
      {/* Dark gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/80 via-transparent to-transparent pointer-events-none" />
    </div>
  );
}
