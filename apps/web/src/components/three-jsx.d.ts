import type { ThreeElements } from "@react-three/fiber";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      points: ThreeElements["points"];
      bufferGeometry: ThreeElements["bufferGeometry"];
      bufferAttribute: ThreeElements["bufferAttribute"];
      pointsMaterial: ThreeElements["pointsMaterial"];
    }
  }
}

export {};
