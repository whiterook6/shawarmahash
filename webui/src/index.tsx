import { render } from "preact";
import {App} from "./game/App";
import {Game} from "./game/Game";


render((
  <Game>
    <App />
  </Game>
), document.body);
