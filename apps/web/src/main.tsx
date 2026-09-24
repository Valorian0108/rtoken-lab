import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "../../../packages/ui/src/tokens/variables.css";
import "./styles/global.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);