import { Game } from "./Game";
import { MiningProvider } from "./MiningProvider";
import { WebsocketProvider } from "./WebsocketProvider";

export const App = () => (
  <WebsocketProvider>
    <MiningProvider>
      <Game />
    </MiningProvider>
  </WebsocketProvider>
);
