import { Component } from "preact";
import { MessageHandler, WebSocketContext } from "../services/WebsocketContext";

export class WebsocketProvider extends Component<any, any> {
  private isMounted: boolean;
  private webSocket?: WebSocket;
  private messageHandlers: Map<string, MessageHandler[]>;

  constructor(props) {
    super(props);
    this.isMounted = true;
    this.messageHandlers = new Map<string, MessageHandler[]>();
  }

  public addEventListener = (
    messageType: string,
    messageHandler: MessageHandler
  ) => {
    if (this.messageHandlers.has(messageType)) {
      const messageHandlers = this.messageHandlers.get(messageType);

      if (!messageHandlers.includes(messageHandler)) {
        this.messageHandlers.set(messageType, [
          ...messageHandlers,
          messageHandler,
        ]);
      }
    } else {
      this.messageHandlers.set(messageType, [messageHandler]);
    }
  };

  public componentDidMount = () => {
    this.reconnectWebSocket();
  };

  public componentWillUnmount = () => {
    this.isMounted = false;
    this.messageHandlers.clear();
    this.disconnectWebSocket();
  };

  public disconnectWebSocket = () => {
    if (this.webSocket) {
      this.webSocket.close();
    }
  };

  public isReady = () => {
    return this.webSocket && this.webSocket.readyState === 1;
  };

  public onMessage = (event: MessageEvent) => {
    if (!this.isMounted) {
      this.disconnectWebSocket();
      return;
    }

    const message = JSON.parse(event.data);
    console.log(message);
    if (this.messageHandlers.has(message.event)) {
      const messageHandlers = this.messageHandlers.get(message.event);
      for (const messageHandler of messageHandlers) {
        messageHandler(message);
      }
    }
  };

  public reconnectWebSocket = (attempts: number = 0) => {
    if (!this.isMounted) {
      return;
    } else if (attempts > 3) {
      return;
    }

    this.disconnectWebSocket();

    try {
      this.webSocket = new WebSocket(`wss://${location.host}`);
      this.webSocket.onopen = () => {
        if (this.isMounted) {
          this.webSocket.onmessage = this.onMessage;
          this.webSocket.onclose = () => this.reconnectWebSocket();
        } else {
          this.disconnectWebSocket();
        }
      };
    } catch (error) {
      console.error(error);
      setTimeout(() => this.reconnectWebSocket(attempts + 1), 1000);
    }
  };

  public removeEventListener = (
    messageType: string,
    messageHandler: MessageHandler
  ) => {
    if (this.messageHandlers.has(messageType)) {
      const messageHandlers = this.messageHandlers.get(messageType);
      const indexOf = messageHandlers.indexOf(messageHandler);

      if (indexOf >= 0) {
        messageHandlers.splice(indexOf, 1);
        this.messageHandlers.set(messageType, messageHandlers);
        return;
      }
    }
  };

  public render = () => {
    return (
      <WebSocketContext.Provider
        value={{
          addEventListener: this.addEventListener,
          isReady: this.isReady,
          removeEventListener: this.removeEventListener,
          send: this.sendMessage,
        }}
      >
        {this.props.children}
      </WebSocketContext.Provider>
    );
  };

  public sendMessage = (message: { event: string }) => {
    if (this.isReady()) {
      this.webSocket!.send(JSON.stringify(message));
    }
  };
}
