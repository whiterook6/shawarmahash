import { useContext } from "react";
import { MiningContext } from "./MiningContext";

export function useMining() {
  return useContext(MiningContext);
}
