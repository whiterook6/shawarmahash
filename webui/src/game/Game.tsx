import { Component } from "preact";
import { GameContext, IGameContext } from "./GameContext";

interface GameState {
  player: string;
  team?: string;
}

export class Game extends Component<any, GameState> implements IGameContext {
  public state: GameState = {
    player: "UNK",
    team: undefined
  };

  public getPlayer = () => {
    return this.state.player;
  }
  
  public setPlayer = (player: string) => {
    if (this.state.player !== player){
      this.setState({
        player
      });
    }
  };

  public getTeam = () => {
    return this.state.team;
  }
  
  public setTeam = (team?: string) => {
    if (this.state.team !== team){
      this.setState({
        team
      });
    }
  };

  public render = (props) => {
    return <GameContext.Provider value={{
      getPlayer: this.getPlayer,
      getTeam: this.getTeam,
      setPlayer: this.setPlayer,
      setTeam: this.setTeam
    }}>{props.children}</GameContext.Provider>
  }
}