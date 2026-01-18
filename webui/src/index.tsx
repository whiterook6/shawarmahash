import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.scss";

function App() {
  return (
    <div className="app">
      <h1>
        shawarma<span className="hash">hash</span>
      </h1>
    </div>
  );
}

const rootElement = document.getElementById("app");
if (!rootElement) {
  throw new Error("Missing #app root element");
}

const root = createRoot(rootElement);
root.render(
  <StrictMode>
    <App />
  </StrictMode>,
);
