import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.scss";
import { useIdentity } from "./services/useIdentity";
import { MiningProvider } from "./game/MiningProvider";
import { MiningDemo } from "./game/MiningDemo";

function App() {
  const { identity, isLoading, error, generateNewIdentity } = useIdentity();
  return (
    <div className="app">
      <h1>
        shawarma<span className="hash">hash</span>
      </h1>
      <div style={{ marginBottom: "1rem" }}>
        <div>
          <strong>Identity</strong>:{" "}
          {isLoading ? "loading..." : (identity ?? "none")}
        </div>
        {error ? (
          <div style={{ marginTop: "0.5rem", color: "#7f1d1d" }}>
            {error.message}
          </div>
        ) : null}
      </div>
      <button onClick={() => void generateNewIdentity()} disabled={isLoading}>
        Generate new identity
      </button>

      {identity ? (
        <MiningProvider identity={identity}>
          <MiningDemo identity={identity} />
        </MiningProvider>
      ) : null}
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
