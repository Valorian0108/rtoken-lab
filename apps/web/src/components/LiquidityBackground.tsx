import { useMemo, useRef, type ElementType } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const R3FPoints = "points" as unknown as ElementType;
const R3FBufferGeometry = "bufferGeometry" as unknown as ElementType;
const R3FBufferAttribute = "bufferAttribute" as unknown as ElementType;
const R3FPointsMaterial = "pointsMaterial" as unknown as ElementType;

const GRID_COLUMNS = 54;
const GRID_ROWS = 34;

function LiquidityField() {
  const pointsRef = useRef<THREE.Points>(null);
  const cameraDrift = useRef({ x: 0, y: 0 });

  const { positions, colors } = useMemo(() => {
    const pointPositions = new Float32Array(GRID_COLUMNS * GRID_ROWS * 3);
    const pointColors = new Float32Array(GRID_COLUMNS * GRID_ROWS * 3);
    const native = new THREE.Color("#4b88b8");
    const rtoken = new THREE.Color("#d86a6a");
    const positive = new THREE.Color("#8fcf76");
    const dark = new THREE.Color("#172b3b");

    let index = 0;
    for (let row = 0; row < GRID_ROWS; row += 1) {
      for (let column = 0; column < GRID_COLUMNS; column += 1) {
        const x = (column - GRID_COLUMNS / 2) * 0.27;
        const y = (row - GRID_ROWS / 2) * 0.23;
        const wave = Math.sin(column * 0.48) * 0.11 + Math.cos(row * 0.62) * 0.08;
        const z = -2.5 + wave + Math.sin((column + row) * 0.17) * 0.28;
        pointPositions[index * 3] = x;
        pointPositions[index * 3 + 1] = y;
        pointPositions[index * 3 + 2] = z;

        const status = (row + column * 2) % 11;
        const color = status === 0 ? positive : status < 5 ? native : rtoken;
        const blend = status < 4 ? 0.32 : 0.62;
        pointColors[index * 3] = color.r * blend + dark.r * (1 - blend);
        pointColors[index * 3 + 1] = color.g * blend + dark.g * (1 - blend);
        pointColors[index * 3 + 2] = color.b * blend + dark.b * (1 - blend);
        index += 1;
      }
    }
    return { positions: pointPositions, colors: pointColors };
  }, []);

  useFrame((state, delta) => {
    const points = pointsRef.current;
    if (!points) return;
    const targetX = state.pointer.x * 0.18;
    const targetY = state.pointer.y * 0.12;
    cameraDrift.current.x += (targetX - cameraDrift.current.x) * Math.min(delta * 2.2, 1);
    cameraDrift.current.y += (targetY - cameraDrift.current.y) * Math.min(delta * 2.2, 1);
    points.rotation.y = cameraDrift.current.x;
    points.rotation.x = cameraDrift.current.y * 0.55;
    points.position.y = Math.sin(state.clock.elapsedTime * 0.16) * 0.035;
  });

  return (
    <R3FPoints ref={pointsRef} frustumCulled={false}>
      <R3FBufferGeometry>
        <R3FBufferAttribute attach="attributes-position" args={[positions, 3]} />
        <R3FBufferAttribute attach="attributes-color" args={[colors, 3]} />
      </R3FBufferGeometry>
      <R3FPointsMaterial
        size={0.035}
        sizeAttenuation
        vertexColors
        transparent
        opacity={0.62}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </R3FPoints>
  );
}

export function LiquidityBackground() {
  return (
    <div className="liquidity-background" aria-hidden="true">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 7], fov: 48, near: 0.1, far: 30 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      >
        <LiquidityField />
      </Canvas>
    </div>
  );
}
