import { useContext } from "react";
import { MiningContext } from "./mining.context";

export function useMining() {
  return useContext(MiningContext);
}
