import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Mock GSAP
vi.mock("gsap", () => ({
  gsap: {
    to: vi.fn(),
    from: vi.fn(),
    fromTo: vi.fn(),
    set: vi.fn(),
    timeline: vi.fn(() => ({
      to: vi.fn(),
      from: vi.fn(),
      play: vi.fn(),
      pause: vi.fn(),
      reverse: vi.fn(),
      seek: vi.fn(),
      kill: vi.fn(),
    })),
    registerPlugin: vi.fn(),
  },
  ScrollTrigger: {
    create: vi.fn(),
    refresh: vi.fn(),
    killAll: vi.fn(),
  },
}));

// Mock @react-three/fiber
vi.mock("@react-three/fiber", () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => <div data-testid="canvas">{children}</div>,
  useFrame: vi.fn(),
  useThree: vi.fn(() => ({
    camera: { position: { x: 0, y: 0, z: 50 } },
    size: { width: 800, height: 600 },
    gl: { setClearColor: vi.fn() },
  })),
  extend: vi.fn(),
}));

// Mock @react-three/drei
vi.mock("@react-three/drei", () => ({
  OrbitControls: ({ children }: { children: React.ReactNode }) => <div data-testid="orbit-controls">{children}</div>,
  Html: ({ children }: { children: React.ReactNode }) => <div data-testid="html">{children}</div>,
  Text: ({ children, ...props }: any) => <div data-testid="drei-text" {...props}>{children}</div>,
  Lines: ({ positions, color, ...props }: any) => <div data-testid="lines" {...props} />,
}));

// Mock Three.js
vi.mock("three", () => ({
  Color: vi.fn(),
  Group: vi.fn(() => ({ add: vi.fn(), remove: vi.fn() })),
  Mesh: vi.fn(),
  PlaneGeometry: vi.fn(),
  SphereGeometry: vi.fn(),
  BoxGeometry: vi.fn(),
  CircleGeometry: vi.fn(),
  CylinderGeometry: vi.fn(),
  MeshBasicMaterial: vi.fn(),
  DoubleSide: 2,
}));

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 16));
global.cancelAnimationFrame = vi.fn((id) => clearTimeout(id));