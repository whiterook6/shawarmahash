import { ChainProvider } from "./ChainProvider";
import { Game } from "./Game";
import { MiningProvider } from "./MiningProvider";
import { WebsocketProvider } from "./WebsocketProvider";

export const App = () => (
  <WebsocketProvider>
    <MiningProvider>
      <ChainProvider>
        <Game />
      </ChainProvider>
    </MiningProvider>
  </WebsocketProvider>
);
