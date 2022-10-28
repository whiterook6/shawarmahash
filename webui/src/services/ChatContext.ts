import { createContext } from "preact";

export interface IChatMessage {
  fromPlayer: string;
  fromTeam?: string;
  hash: string;
  content: string;
  afterHash: string;
  timestamp: number;
  toPlayer?: string;
  toTeam?: string;
}

export interface IChatContext {
  messages: IChatMessage[];
  setMessages: (messages: IChatMessage[]) => void;
  appendMessage: (message: IChatMessage) => void;
  sendMessage: (message: {
    fromPlayer: string,
    fromTeam?: string,
    toPlayer?: string,
    toTeam?: string,
    content: string,
  }) => void;
}

export const ChatContext = createContext<IChatContext>({
  messages: [],
  setMessages: () => {},
  appendMessage: () => {},
  sendMessage: () => {},
});
