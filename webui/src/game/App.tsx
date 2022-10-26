import { ChainProvider } from "./ChainProvider";
import { Game } from "./Game";
import { MiningProvider } from "./MiningProvider";
import { ServerEventsProvider } from "./ServerEventsProvider";

export const App = () => (
  <ServerEventsProvider>
    <MiningProvider>
      <ChainProvider>
        <Game />
      </ChainProvider>
    </MiningProvider>
  </ServerEventsProvider>
);
