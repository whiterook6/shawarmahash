export interface IChatMessage {
  fromPlayer: string;
  fromTeam: string;
  toPlayer?: string;
  toTeam?: string;
  message: string;
  timestamp: number;
  blockHash: string;
}

export interface IChatContext {
  messages: IChatMessage[];
  setMessages: (messages: IChatMessage[]) => void;
  appendMessage: (message: IChatMessage) => void;
  
}