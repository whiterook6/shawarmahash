import { Component, createContext } from "preact";

type MessageHandler = (message: {event: string}) => void;

export interface IWebSocketContext {
  addEventListener: (messageType: string, handler: MessageHandler) => void;
  removeEventListener: (messageType: string, handler: MessageHandler) => void;
  isReady: () => boolean;
  send: (message: {event: string}) => void;
}

export const WebSocketContext = createContext<IWebSocketContext>({
  addEventListener: () => {},
  removeEventListener: () => {},
  isReady: () => false,
  send: () => {},
});

export class WebsocketContextProvider extends Component<any, any>{
  private isMounted: boolean;
  private webSocket?: WebSocket;
  private messageHandlers: Map<string, MessageHandler[]>;
  
  constructor(props){
    super(props);
    this.isMounted = true;
    this.messageHandlers = new Map<string, MessageHandler[]>();
  }

  public addEventListener = (messageType: string, messageHandler: MessageHandler) => {
    if (this.messageHandlers.has(messageType)){
      const messageHandlers = this.messageHandlers.get(messageType);

      if (!messageHandlers.includes(messageHandler)){
        this.messageHandlers.set(messageType, [
          ...messageHandlers,
          messageHandler
        ]);
      }
    } else {
      this.messageHandlers.set(messageType, [messageHandler]);
    }
  }

  public componentDidMount = () => {
    console.log("Mounting...");
    this.reconnectWebSocket();
  }

  public componentWillUnmount = () => {
    console.log("Unmounting...");
    this.isMounted = false;
    this.disconnectWebSocket();
  }

  public disconnectWebSocket = () => {
    if (this.webSocket){
      console.log("Disconnecting...");
      this.webSocket.close();
    }
  }

  public isReady = () => {
    return this.webSocket && this.webSocket.readyState === 1;
  }

  public onMessage = (event: MessageEvent) => {
    console.log("on message");
    if (!this.isMounted){
      this.disconnectWebSocket();
    }

    const message = JSON.parse(event.data);
    if (this.messageHandlers.has(message.event)){
      const messageHandlers = this.messageHandlers.get(message.event);
      for (const messageHandler of messageHandlers){
        messageHandler(message);
      }
    }
  }

  public reconnectWebSocket = (attempts: number = 0) => {
    if (!this.isMounted) {
      return;
    } else if (attempts > 3){
      console.error("Cannot reconnect: too many attempts.");
      return;
    }

    this.disconnectWebSocket();

    console.log("Connecting...");
    try {
      this.webSocket = new WebSocket(`wss://${location.host}`);
      this.webSocket.onopen = () => {
        if (this.isMounted){
          console.log("Connected.")
          this.webSocket.onmessage = this.onMessage;
          this.webSocket.onclose = () => this.reconnectWebSocket();
        }
      }
    } catch (error){
      console.error(error);
      this.reconnectWebSocket(attempts + 1);
    }
  }

  public removeEventListener = (messageType: string, messageHandler: MessageHandler) => {
    if (this.messageHandlers.has(messageType)) {
      const messageHandlers = this.messageHandlers.get(messageType);
      const indexOf = messageHandlers.indexOf(messageHandler);

      if (indexOf >= 0) {
        messageHandlers.splice(indexOf, 1);
        this.messageHandlers.set(messageType, messageHandlers);
      }
    }
  }

  public render = () => (
    <WebSocketContext.Provider value={{
      addEventListener: this.addEventListener,
      isReady: this.isReady,
      removeEventListener: this.removeEventListener,
      send: this.sendMessage,
    }}>
      {this.props.children}
    </WebSocketContext.Provider>
  );

  public sendMessage = (message: {event: string}) => {
    if (this.isReady()){
      this.webSocket!.send(JSON.stringify(message));
    }
  }
}