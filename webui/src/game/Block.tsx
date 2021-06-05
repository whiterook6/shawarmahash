import { hashicon } from "@emeraldpay/hashicon";

const dataURLs = new Map<string, string>();

export const Block = ({
  block: { hashCode },
}: {
  block: { hashCode: string };
}) => {
  if (!dataURLs.has(hashCode)) {
    console.log(`Computing hashicon for ${hashCode}`);
    dataURLs.set(hashCode, hashicon(hashCode).toDataURL());
  }
  return <img alt={hashCode} src={dataURLs.get(hashCode)!} />;
};
