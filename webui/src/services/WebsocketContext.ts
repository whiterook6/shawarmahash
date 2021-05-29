import { createContext } from "preact";

export type MessageHandler = (message: { event: string }) => void;

export interface IWebSocketContext {
  addEventListener: (messageType: string, handler: MessageHandler) => void;
  removeEventListener: (messageType: string, handler: MessageHandler) => void;
  isReady: () => boolean;
  send: (message: { event: string }) => void;
}

export const WebSocketContext = createContext<IWebSocketContext>({
  addEventListener: () => {},
  removeEventListener: () => {},
  isReady: () => false,
  send: () => {},
});
