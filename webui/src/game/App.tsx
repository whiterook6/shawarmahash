import {useContext, useState} from "preact/hooks";
import {GameContext} from "./GameContext";

const nameRegexIncomplete = /^[a-zA-Z0-9]{0,3}$/
const nameRegex = /^[a-zA-Z0-9]{3}$/

export const App = () => {
  const {setPlayer, setTeam, player, team} = useContext(GameContext);
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
      setTeam(state.team);
      setPlayer(state.player);
    }
  }

  return (
    <>
      <label>Player</label>
      <input value={state.player || ""} onInput={onChangePlayer} />

      <label>Team</label>
      <input value={state.team || ""} onInput={onChangeTeam} />

      <label>Save</label>
      <button onClick={onSaveID}>Save new ID</button>

      <label>From Context</label>
      <div>{player}-{team}</div>
    </>
  )
}
