import { Identity } from "../identity/identity";
import { BroadcastMessage } from "./broadcast.types";

export type Subscriber = {
  team: string;
  player: string;
  identity: string;
  send: (data: BroadcastMessage) => void;
  close: () => void;
};

export const TO_TEAM = (team: string) => (subscriber: Subscriber) =>
  subscriber.team === team;
export const TO_PLAYER = (player: string) => (subscriber: Subscriber) =>
  subscriber.player === player;
export const TO_IDENTITY = (identity: string) => (subscriber: Subscriber) =>
  subscriber.identity === identity;

export class Broadcast {
  private subscribers: Set<Subscriber> = new Set<Subscriber>();

  getActivePlayers(): Identity[] {
    return [...this.subscribers].map((subscriber) => ({
      identity: subscriber.identity,
      player: subscriber.player,
      team: subscriber.team,
    }));
  }

  getActiveTeams(): string[] {
    return [
      ...new Set([...this.subscribers].map((subscriber) => subscriber.team)),
    ];
  }

  subscribe(subscriber: Subscriber): () => void {
    this.subscribers.add(subscriber);
    return () => this.unsubscribe(subscriber);
  }

  unsubscribe(subscriber: Subscriber): void {
    try {
      subscriber.close();
    } catch (error) {
      console.error(error);
    }
    this.subscribers.delete(subscriber);
  }

  cast(
    message: BroadcastMessage,
    filter?: (subscriber: Subscriber) => boolean,
  ): void {
    this.subscribers.forEach((subscriber) => {
      if (filter && !filter(subscriber)) {
        return;
      }

      try {
        subscriber.send(message);
      } catch (error) {
        console.error("[Broadcast] Error sending message to client:", error);
        this.unsubscribe(subscriber);
      }
    });
  }

  getSubscriberCount(): number {
    return this.subscribers.size;
  }

  closeAll(): void {
    this.subscribers.forEach((subscriber) => {
      try {
        subscriber.close();
      } catch (error) {
        console.error("[Broadcast] Error closing subscriber:", error);
      }
    });
    this.subscribers.clear();
  }
}
