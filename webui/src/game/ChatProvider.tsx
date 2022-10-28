import { useState } from "preact/hooks";
import { postChatMessage } from "../services/Api";
import {ChatContext, IChatMessage} from "../services/ChatContext";

export const ChatProvider = (props: any) => {
  const [messages, setMessages] = useState<IChatMessage[]>([]);
  const appendMessage = (message: IChatMessage) => {
    setMessages((previous) => {
      return [...previous, message];
    });
  };
  const sendMessage = async (message: {
    fromPlayer: string,
    fromTeam?: string,
    toPlayer?: string,
    toTeam?: string,
    content: string,
  }) => {
    return postChatMessage({
      ...message,
      afterHash: messages.length > 0 ? messages[messages.length - 1].hash : undefined,
    });
  }

  return (
    <ChatContext.Provider
      value={{
        messages,
        setMessages,
        sendMessage,
        appendMessage
      }}
    >
      {props.children}
    </ChatContext.Provider>
  )
}