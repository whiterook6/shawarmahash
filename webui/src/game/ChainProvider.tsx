import { ChainContext } from "../services/ChainContext";
import { Chain, Block, appendBlock as appendToChain } from "../Block";
import { useState } from "preact/hooks";

const getHashCodes = (block: Block) => block.hashCode;

export const ChainProvider = (props: any) => {
  const [chain, setChain] = useState<Chain>([]);
  const [ourBlocks, setOurBlocks] = useState<Block[]>([]);

  const resetChain = (newChain: Chain) => {
    const hashCodes = newChain.map(getHashCodes);
    setOurBlocks(
      ourBlocks.filter((myBlock) => hashCodes.includes(myBlock.hashCode))
    );
    setChain(newChain);
  };

  const appendBlock = (newBlock: Block, ours?: boolean) => {
    setChain((oldChain) => appendToChain(oldChain, newBlock));

    if (ours) {
      setOurBlocks((oldOurBlocks) => [...oldOurBlocks, newBlock]);
    }
  };

  return (
    <ChainContext.Provider
      value={{
        chain,
        ourBlocks,
        setChain: resetChain,
        appendBlock,
      }}
    >
      {props.children}
    </ChainContext.Provider>
  );
};
