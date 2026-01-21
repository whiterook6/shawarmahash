import { useContext } from "react";
import { IdentityContext } from "./IdentityContext";

export function useIdentity() {
  return useContext(IdentityContext);
}
