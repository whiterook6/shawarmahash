import { hashSHA1 } from "./Hash";

export interface ChatMessage {
  fromPlayer: string;
  fromTeam?: string;
  hash: string;
  content: string;
  afterHash: string;
  timestamp: number;
  toPlayer?: string;
  toTeam?: string;
}

export const getFromID = (message: ChatMessage): string => {
  if (message.fromTeam){
    return `@${message.fromPlayer}#${message.fromTeam}`;
  } else {
    return `@${message.fromPlayer}`;
  }
}

export const getToID = (message: ChatMessage): string => {
  if (message.toTeam){
    return `@${message.toPlayer}#${message.toTeam}`;
  } else if (message.toPlayer) {
    return `@${message.toPlayer}`;
  } else {
    return "";
  }
}

export const getChatMessageHash = (message: ChatMessage) => {
  return hashSHA1(`${message.timestamp.toString()}${message.content}${getFromID(message)}${getToID(message)}`);
};

export class ChatHistory {
  history: ChatMessage[] = [];

  constructor(history: ChatMessage[] = []) {
    this.history = history;
  }

  public addMessage = (message: ChatMessage) => {
    const history = this.history;

    if (history.length === 0){
      const newMessage = {
        ...message,
        afterHash: "0",
        timestamp: Date.now(),
      };
      newMessage.hash = getChatMessageHash(newMessage);
      this.history = [newMessage];
      return newMessage;
    } else {
      const previousHashes = history.map((message) => message.hash);
      if (!previousHashes.includes(message.afterHash)){
        throw new Error("Invalid afterHash");
      }
    
      const newMessage = {
        ...message,
        timestamp: Date.now()
      };
      newMessage.hash = getChatMessageHash(newMessage);
      this.history.push(newMessage);
      return newMessage;
    }
  }

  public getRecentMessages = (count: number) => {
    return this.history.slice(-count);
  }
}