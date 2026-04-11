import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial } from '@react-three/drei';

function VisualizerShape({ isPlaying, color }) {
  const meshRef = useRef();

  useFrame(({ clock }) => {
    if (isPlaying) {
      meshRef.current.rotation.x = clock.getElapsedTime() * 0.2;
      meshRef.current.rotation.y = clock.getElapsedTime() * 0.3;
      // Slight pulsating effect based on time
      const scale = 1 + Math.sin(clock.getElapsedTime() * 4) * 0.05;
      meshRef.current.scale.set(scale, scale, scale);
    } else {
      // Idle slight movement
      meshRef.current.rotation.x = clock.getElapsedTime() * 0.05;
      meshRef.current.rotation.y = clock.getElapsedTime() * 0.05;
    }
  });

  return (
    <Sphere ref={meshRef} args={[1.5, 64, 64]} scale={1.2}>
      <MeshDistortMaterial
        color={color || "#8a2be2"}
        attach="material"
        distort={isPlaying ? 0.6 : 0.2} // More distortion when playing
        speed={isPlaying ? 4 : 1}
        roughness={0.2}
        metalness={0.8}
        clearcoat={1}
        clearcoatRoughness={0.1}
      />
    </Sphere>
  );
}

export default function AudioVisualizer({ isPlaying, color }) {
  return (
    <div className="absolute inset-0 z-0 w-full h-full pointer-events-none opacity-50">
      <Canvas camera={{ position: [0, 0, 4] }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} color="#ffffff" />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} color={color} />
        <VisualizerShape isPlaying={isPlaying} color={color} />
      </Canvas>
    </div>
  );
}
