import { Identity } from "../identity/identity";

export type Message = {
  type: string;
  payload: unknown;
};

export type Subscriber = {
  team: string;
  player: string;
  identity: string;
  send: (data: Message) => void;
  close: () => void;
};

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

  cast(message: Message): void {
    this.subscribers.forEach((subscriber) => {
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
