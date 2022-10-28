import { ChainProvider } from "./ChainProvider";
import { ChatProvider } from "./ChatProvider";
import { Game } from "./Game";
import { MiningProvider } from "./MiningProvider";
import { ServerEventsProvider } from "./ServerEventsProvider";

export const App = () => (
  <ServerEventsProvider>
    <ChatProvider>
      <MiningProvider>
        <ChainProvider>
          <Game />
        </ChainProvider>
      </MiningProvider>
    </ChatProvider>
  </ServerEventsProvider>
);
