import { useContext, useEffect, useState } from "preact/hooks";
import { BlockFoundMSG } from "../MessageTypes";
import { getBlocks, getTarget, submitBlock } from "../services/Api";
import { ChainContext } from "../services/ChainContext";
import { MiningContext } from "../services/MiningContext";
import { WebSocketContext } from "../services/WebsocketContext";

export const Game = () => {
  const {
    hashRate,
    isMining,
    player,
    previousHash,
    setID,
    startMining,
    stopMining,
    target,
    team,
  } = useContext(MiningContext);
  const { addEventListener, removeEventListener } = useContext(
    WebSocketContext
  );
  const { ourBlocks, chain, appendBlock, setChain } = useContext(ChainContext);
  useEffect(() => {
    const run = async () => {
      const chain = await getBlocks();
      setChain(chain);
    };
    run();
  }, []);

  const onBlockFromSocket = (message: BlockFoundMSG) => {
    const { block, difficultyTarget } = message;
    appendBlock(block);
    if (isMining) {
      startMining(block.hashCode, difficultyTarget, onMinedBlock);
    }
  };

  const onMinedBlock = async (newBlock) => {
    await submitBlock(newBlock);
    appendBlock(newBlock, true);
  };

  useEffect(() => {
    addEventListener("block-found", onBlockFromSocket);
    return () => removeEventListener("block-found", onBlockFromSocket);
  });

  const [idForm, setIDForm] = useState<{
    player?: string;
    team?: string;
  }>({
    player,
    team,
  });

  const onChangePlayer = (event: { currentTarget: { value: string } }) => {
    setIDForm((previous) => {
      return { player: event.currentTarget.value, team: previous.team };
    });
  };
  const onChangeTeam = (event: { currentTarget: { value: string } }) => {
    setIDForm((previous) => {
      return { player: previous.player, team: event.currentTarget.value };
    });
  };
  const onChangeID = () => {
    if (idForm.player && idForm.team) {
      setID(idForm.player, idForm.team);
    }
  };

  const onClickStartMining = async () => {
    if (isMining) {
      return;
    }

    const [recentBlocks, difficultyTarget] = await Promise.all([
      getBlocks(),
      getTarget(),
    ]);

    if (recentBlocks.length > 0) {
      startMining(
        recentBlocks[recentBlocks.length - 1].hashCode,
        difficultyTarget,
        onMinedBlock
      );
    } else {
      startMining("0", difficultyTarget, onMinedBlock);
    }
  };

  const onClickStopMining = () => {
    if (!isMining) {
      return;
    }

    stopMining();
  };

  return (
    <>
      <label>Player</label>
      <div>
        <input onInput={onChangePlayer} value={idForm.player || ""}></input>
      </div>
      <label>Team</label>
      <div>
        <input onInput={onChangeTeam} value={idForm.team || ""}></input>
      </div>
      <button onClick={onChangeID}>Change ID</button>
      <div>
        <button onClick={onClickStartMining} disabled={isMining}>
          Start Mining
        </button>
        <button onClick={onClickStopMining} disabled={!isMining}>
          Stop Mining
        </button>
      </div>
      <hr />
      <label>HashRate</label>
      <div>{hashRate}</div>
      <label>Previous Hash</label>
      <div>{previousHash}</div>
      <label>Difficulty Target</label>
      <div>{target}</div>
      <hr />
      <label>My Blocks</label>
      <div>
        {ourBlocks.map((block) => (
          <div key={block.hashCode}>{block.hashCode}</div>
        ))}
      </div>
      <label>Chain</label>
      <div>
        {chain.map((block) => (
          <div key={block.hashCode}>{block.hashCode}</div>
        ))}
      </div>
    </>
  );
};
