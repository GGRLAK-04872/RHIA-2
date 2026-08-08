import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { App } from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./global.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  const errorMessage = document.createElement("p");
  errorMessage.setAttribute("role", "alert");
  errorMessage.textContent = "RHIA konnte nicht starten: Der App-Bereich fehlt.";
  document.body.append(errorMessage);
  throw new Error("Missing #root element");
}

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <HashRouter>
        <App />
      </HashRouter>
    </ErrorBoundary>
  </StrictMode>,
);
