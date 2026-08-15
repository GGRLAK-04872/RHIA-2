import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { App } from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { RhiaStartGate } from "./components/RhiaStartGate";
import "./global.css";

type RhiaUiVariant = "reference" | "business";

function resolveUiVariant(): RhiaUiVariant {
  const requested = new URL(window.location.href).searchParams.get("ui");
  return requested === "business" ? "business" : "reference";
}

function variantHref(variant: RhiaUiVariant): string {
  const url = new URL(window.location.href);
  url.searchParams.set("ui", variant);
  return `${url.pathname}${url.search}${url.hash}`;
}

const uiVariant = resolveUiVariant();
document.body.dataset.rhiaUi = uiVariant;

const variantSwitcher = document.createElement("nav");
variantSwitcher.className = "rhia-variant-switcher";
variantSwitcher.setAttribute("aria-label", "RHIA Testvarianten");
variantSwitcher.innerHTML = `
  <span>Lokaler A/B-Test</span>
  <a href="${variantHref("reference")}" aria-current="${uiVariant === "reference" ? "page" : "false"}">A · Referenz</a>
  <a href="${variantHref("business")}" aria-current="${uiVariant === "business" ? "page" : "false"}">B · Business</a>
`;
document.body.append(variantSwitcher);

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
      <RhiaStartGate>
        <HashRouter>
          <App />
        </HashRouter>
      </RhiaStartGate>
    </ErrorBoundary>
  </StrictMode>,
);
