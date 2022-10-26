import { createContext } from "preact";
export type MessageHandler = (ev: Event | MessageEvent<any>) => void;

export interface IServerEventsContext {
    addMessageHandler: (messageType: string, handler: MessageHandler) => void;
    removeMessageHandler: (messageType: string, handler: MessageHandler) => void;
}

export const ServerEventsContext = createContext<IServerEventsContext>({
    addMessageHandler: () => {},
    removeMessageHandler: () => {},
});