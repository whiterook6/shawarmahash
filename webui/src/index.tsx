import { createRoot } from "react-dom/client";
import "./index.scss";
import { MiningProvider } from "./mining/mining.provider";
import { MiningDemo } from "./game/MiningDemo";
import { BroadcastProvider } from "./broadcast/broadcast.provider";
import { IdentityProvider } from "./identity/identity.provider";

const minerWorker = new Worker(
  new URL("./mining/mining.worker.ts", import.meta.url),
  {
    type: "module",
  },
);
const eventSource = new EventSource("/api/events", {
  withCredentials: true,
});

function App() {
  return (
    <BroadcastProvider eventSource={eventSource}>
      <MiningProvider minerWorker={minerWorker}>
        <IdentityProvider>
          <MiningDemo />
        </IdentityProvider>
      </MiningProvider>
    </BroadcastProvider>
  );
}

const rootElement = document.getElementById("app");
if (!rootElement) {
  throw new Error("Missing #app root element");
}

const root = createRoot(rootElement);
root.render(<App />);
