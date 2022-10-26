import {Component} from "preact";
import { MessageHandler, ServerEventsContext } from "../services/ServerEventsContext";

export class ServerEventsProvider extends Component {
    private serverEvents: EventSource;
    
    constructor(props) {
        super(props);
    }

    public componentDidMount(): void {
        this.serverEvents = new EventSource("/watch");
        this.serverEvents.onmessage = (message) => {
            console.log("Received message from server", message);
        };
    }

    public componentWillUnmount(): void {
        this.serverEvents.close();
    }
    
    public addMessageHandler = (
        messageType: string,
        messageHandler: MessageHandler
    ) => {
        this.serverEvents.addEventListener(messageType, messageHandler);
    };

    public removeMessageHandler = (
        messageType: string,
        messageHandler: MessageHandler
    ) => {
        this.serverEvents.removeEventListener(messageType, messageHandler);
    }

    public render = () => {
        const {children} = this.props;
        return (
            <ServerEventsContext.Provider
                value={{
                    addMessageHandler: this.addMessageHandler,
                    removeMessageHandler: this.removeMessageHandler,
                }}
            >
                {children}
            </ServerEventsContext.Provider>
        );
    }
}