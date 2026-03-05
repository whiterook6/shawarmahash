import { Check, Medal, X } from "lucide-react";
import { useCallback, useContext, useEffect, useState } from "react";
import { BroadcastContext } from "../broadcast/broadcast.context";
import type { ScoresUpdateMessage } from "../broadcast/broadcast.types";
import { Chat } from "../chat/Chat";
import { IconButton } from "../components/Button";
import { Input } from "../components/Input";
import {
  BottomCenterPanel,
  BottomLeftPanel,
  BottomRightPanel,
  Layout,
  LeftPanel,
  MiddlePanel,
  RightPanel,
} from "../components/Layout";
import { Panel } from "../components/Panel";
import { Row } from "../components/Row";
import { Stack } from "../components/Stack";
import { Table, TBody, TD, TH, THead, TR } from "../components/Table";
import { IdentityContext } from "../identity/identity.context";
import { Miner } from "./Miner";

export const App = () => {
  const [leaderboard, setLeaderboard] = useState<
    ScoresUpdateMessage["payload"] | null
  >(null);

  const broadcastContext = useContext(BroadcastContext);
  const {
    connect: connectBroadcast,
    disconnect: disconnectBroadcast,
    subscribe: subscribeBroadcast,
  } = broadcastContext;
  const identityContext = useContext(IdentityContext);
  const { identity, team, player, setTeam, setPlayer } = identityContext;

  useEffect(() => {
    if (!identity || !team || !player) {
      return;
    }
    connectBroadcast({ team, player, identity });
    const unsubscribe = subscribeBroadcast((message) => {
      if (message.type === "scores_update") {
        setLeaderboard(message.payload);
      }
    });
    return () => {
      unsubscribe();
      disconnectBroadcast();
    };
  }, [identity, team, player, connectBroadcast, disconnectBroadcast]);

  const topPlayers = leaderboard?.topPlayers?.slice(0, 5) ?? [];
  const activePlayers = leaderboard?.activePlayerScores ?? [];
  const activeTeams = leaderboard?.activeTeamScores ?? [];

  const [form, setForm] = useState<{
    newTeamName: string;
    newPlayerName: string;
  }>({
    newTeamName: "",
    newPlayerName: "",
  });
  const onChangeTeamName = (e: { target: { value: string } }) => {
    setForm((f) => ({
      newTeamName: e.target.value,
      newPlayerName: f.newPlayerName,
    }));
  };
  const onCancelTeamName = useCallback(() => {
    setForm((f) => ({
      newTeamName: "",
      newPlayerName: f.newPlayerName,
    }));
  }, []);
  const onSaveTeamName = useCallback(() => {
    if (form.newTeamName.length === 3) {
      setTeam(form.newTeamName);
    }
  }, [form.newTeamName, setTeam]);

  const onChangePlayerName = (e: { target: { value: string } }) => {
    setForm((f) => ({
      newTeamName: f.newTeamName,
      newPlayerName: e.target.value,
    }));
  };
  const onCancelPlayerName = useCallback(() => {
    setForm((f) => ({
      newTeamName: f.newTeamName,
      newPlayerName: "",
    }));
  }, []);
  const onSavePlayerName = useCallback(() => {
    if (form.newPlayerName.length === 3) {
      setPlayer(form.newPlayerName);
    }
  }, [form.newPlayerName, setPlayer]);

  return (
    <Layout>
      <LeftPanel>
        <Stack>
          <Panel>
            <h3>
              <Row>
                <Medal />
                <span>All Time Leaderboard</span>
              </Row>
            </h3>
            <Table>
              <THead>
                <TR>
                  <TH>Name</TH>
                  <TH>Score</TH>
                </TR>
              </THead>
              <TBody>
                {topPlayers.map((player) => (
                  <TR key={player.identity}>
                    <TD>{player.player}</TD>
                    <TD>{player.score}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </Panel>
          <Panel>
            <h3>Live Leaderboard</h3>
            <Table>
              <THead>
                <TR>
                  <TH>Name</TH>
                  <TH>Score</TH>
                </TR>
              </THead>
              <TBody>
                {activePlayers.map((player) => (
                  <TR key={player.identity}>
                    <TD>{player.player}</TD>
                    <TD>{player.score}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </Panel>
          <Panel>
            <h3>Live Teams</h3>
            <Table>
              <THead>
                <TR>
                  <TH>Team</TH>
                  <TH>Score</TH>
                </TR>
              </THead>
              <TBody>
                {activeTeams.map((team) => (
                  <TR key={team.team}>
                    <TD>{team.team}</TD>
                    <TD>{team.score}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </Panel>
        </Stack>
      </LeftPanel>
      <MiddlePanel>
        <h2>Middle Panel</h2>
      </MiddlePanel>
      <RightPanel>
        <Stack>
          <Panel>
            <h2>Team{team ? `: ${team}` : ""}</h2>
            <h3>Online Now</h3>
            <Table>
              <THead>
                <TR>
                  <TH>Name</TH>
                  <TH>Score</TH>
                </TR>
              </THead>
            </Table>
          </Panel>
          <Chat />
        </Stack>
      </RightPanel>
      <BottomLeftPanel>
        <Panel>
          <h2>You: {player}</h2>
          <Row>
            <Input
              type="text"
              placeholder={player}
              value={form.newPlayerName}
              onChange={onChangePlayerName}
              maxLength={3}
            />
            <IconButton onClick={onSavePlayerName}>
              <Check size={16} />
            </IconButton>
            <IconButton onClick={onCancelPlayerName}>
              <X size={16} />
            </IconButton>
          </Row>
        </Panel>
      </BottomLeftPanel>
      <BottomCenterPanel>
        <Miner />
      </BottomCenterPanel>
      <BottomRightPanel>
        <Panel>
          <h2>Your Team: {team}</h2>
          <Row>
            <Input
              type="text"
              placeholder={team}
              value={form.newTeamName}
              onChange={onChangeTeamName}
              maxLength={3}
            />
            <IconButton onClick={onSaveTeamName}>
              <Check size={16} />
            </IconButton>
            <IconButton onClick={onCancelTeamName}>
              <X size={16} />
            </IconButton>
          </Row>
        </Panel>
      </BottomRightPanel>
    </Layout>
  );
};
