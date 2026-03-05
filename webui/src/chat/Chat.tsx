import { useCallback, useContext, useState } from "react";
import { useChat } from "./useChat.hook";
import { IdentityContext } from "../identity/identity.context";
import { MiningContext } from "../mining/mining.context";
import { Panel } from "../components/Panel";
import { Row } from "../components/Row";
import {
  ArrowLeftCircle,
  ArrowRightCircle,
  MessageSquare,
  Send,
} from "lucide-react";
import type { ChatMessageAPIResponse } from "../api/api.types";
import { Input } from "../components/Input";
import { IconButton } from "../components/Button";
import { Stack } from "../components/Stack";

type View = "Public" | "Team" | "Private";

export const Chat = () => {
  const identity = useContext(IdentityContext);
  const chat = useChat(identity);
  const [view, setView] = useState<View>("Public");
  const [messageInput, setMessageInput] = useState("");
  const onChangeMessageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
  };

  const { queueNextBlockData, nextBlockData } = useContext(MiningContext);
  const queuedMessage =
    nextBlockData?.type === "chat_message" ? nextBlockData.message : null;
  const onSendMessage = useCallback(() => {
    if (queuedMessage) {
      return;
    }

    queueNextBlockData({
      type: "chat_message",
      message: messageInput,
    });
    setMessageInput("");
  }, [queuedMessage, messageInput, queueNextBlockData]);

  let leftLabel: View;
  let rightLabel: View;
  let chatMessages: ChatMessageAPIResponse[] = [];
  switch (view) {
    case "Team":
      leftLabel = "Private";
      rightLabel = "Public";
      chatMessages = chat.team;
      break;
    case "Private":
      leftLabel = "Public";
      rightLabel = "Team";
      chatMessages = chat.player;
      break;
    case "Public":
    default:
      leftLabel = "Team";
      rightLabel = "Private";
      chatMessages = chat.public;
      break;
  }

  return (
    <Panel>
      <Stack>
        <Row style={{ justifyContent: "space-between" }}>
          <Row style={{ gap: 4 }} onClick={() => setView(leftLabel)}>
            <ArrowLeftCircle />
            <span>{leftLabel}</span>
          </Row>
          <h2 style={{ margin: 0 }}>{view}</h2>
          <Row style={{ gap: 4 }} onClick={() => setView(rightLabel)}>
            <span>{rightLabel}</span>
            <ArrowRightCircle />
          </Row>
        </Row>
        <Stack
          style={{
            padding: 16,
            borderRadius: 8,
            maxHeight: 200,
            overflowY: "auto",
            background: "#583b25",
            color: "#fff",
            gap: 4,
          }}
        >
          {chatMessages.map((message) => {
            return (
              <Row key={message.hashCode}>
                <MessageSquare size={16} />
                <span>{message.player}</span>
                <span>{message.message}</span>
              </Row>
            );
          })}
        </Stack>
        <Row>
          <MessageSquare />
          <Input
            type="text"
            value={messageInput}
            onChange={onChangeMessageInput}
            placeholder="Type a message..."
            disabled={!!queuedMessage}
          />
          <IconButton
            onClick={onSendMessage}
            disabled={messageInput.length === 0 || !!queuedMessage}
          >
            <Send size={16} />
          </IconButton>
        </Row>
      </Stack>
    </Panel>
  );
};
