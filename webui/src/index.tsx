import { createRoot } from "react-dom/client";
import { BroadcastProvider } from "./broadcast/broadcast.provider";
import { App } from "./game/App";
import { IdentityProvider } from "./identity/identity.provider";
import "./index.scss";
import { MiningProvider } from "./mining/mining.provider";

function Root() {
  return (
    <BroadcastProvider>
      <MiningProvider>
        <IdentityProvider>
          <App />
        </IdentityProvider>
      </MiningProvider>
    </BroadcastProvider>
  );
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Missing #app root element");
}

const root = createRoot(rootElement);
root.render(<Root />);
