import {useContext, useEffect, useState} from "preact/hooks";
import { getBlocks, getTarget } from "../Api";
import { BlockFoundMSG, SetIDMSG } from "../MessageTypes";
import {GameContext} from "./GameContext";
import { WebSocketContext } from "./WebsocketContext";

const nameRegexIncomplete = /^[a-zA-Z0-9]{0,3}$/
const nameRegex = /^[a-zA-Z0-9]{3}$/

export const App = () => {
  const {setID, player, team, hashRate, startMining, stopMining, isMining} = useContext(GameContext);
  const {addEventListener, removeEventListener, send} = useContext(WebSocketContext);
  const onNewBlock = (event: BlockFoundMSG) => {
    console.log("Mining from websocket block");
    console.log(event);
    startMining(event.block.previousHash, event.difficultyTarget);
  }

  useEffect(() => {
    addEventListener("block-found", onNewBlock);
    return () => removeEventListener("block-found", onNewBlock);
  }, []);

  const [state, setState] = useState<{
    player: string,
    team?: string;
  }>({
    player: ""
  });

  const onChangePlayer = (event: { currentTarget: { value: string } }) => {
    if (state.player !== event.currentTarget.value) {
      if (nameRegexIncomplete.test(event.currentTarget.value)) {
        setState({
          ...state,
          player: event.currentTarget.value
        });
      }
    }
  };

  const onChangeTeam = (event: { currentTarget: { value: string } }) => {
    if (state.team !== event.currentTarget.value) {
      if (nameRegexIncomplete.test(event.currentTarget.value)) {
        setState({
          ...state,
          team: event.currentTarget.value
        });
      }
    }
  };

  const onSaveID = () => {
    if (nameRegex.test(state.player) && nameRegex.test(state.team)){
      setID(state.player, state.team);
      send({
        event: "set-id",
        player: state.player,
        team: state.team,
      } as SetIDMSG);
    }
  }

  const onClickStart = async () => {
    const [blocks, target] = await Promise.all([
      getBlocks(),
      getTarget()
    ]);
    console.log(blocks, target);

    if (blocks.length > 0){
      const top = blocks[blocks.length - 1];
      startMining(top.hashCode, target);
    } else {
      startMining("0", target);
    }
  }

  return (
    <>
      <label>Player</label>
      <div>
        <input value={state.player || ""} onInput={onChangePlayer} />
      </div>

      <label>Team</label>
      <div>
        <input value={state.team || ""} onInput={onChangeTeam} />
      </div>

      <label>Save</label>
      <div>
        <button onClick={onSaveID}>Save new ID</button>
      </div>

      <label>Mining: {isMining ? "Yes" : "No"}</label>
      <div>
        <button onClick={stopMining}>Stop Mining</button>
        <button onClick={onClickStart}>Start Mining</button>
      </div>

      <label>From Context</label>
      <div>{player}-{team}</div>

      <label>Hash Rate</label>
      <div>{hashRate || "none"}</div>
    </>
  )
}
