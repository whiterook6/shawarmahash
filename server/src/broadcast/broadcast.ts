export type Message = {
  type: string;
  payload: unknown;
};

export type Subscriber = {
  send: (data: Message) => void;
  close: () => void;
};

export class Broadcast {
  private subscribers: Set<Subscriber> = new Set<Subscriber>();

  subscribe(subscriber: Subscriber): () => void {
    this.subscribers.add(subscriber);
    const subscriberCount = this.subscribers.size;
    console.log(
      `[Broadcast] Client connected. Total subscribers: ${subscriberCount}`,
    );
    return () => this.unsubscribe(subscriber);
  }

  unsubscribe(subscriber: Subscriber): void {
    try {
      subscriber.close();
    } catch (error) {
      console.error(error);
    }
    this.subscribers.delete(subscriber);
    const subscriberCount = this.subscribers.size;
    console.log(
      `[Broadcast] Client disconnected. Total subscribers: ${subscriberCount}`,
    );
  }

  cast(message: Message): void {
    const subscriberCount = this.subscribers.size;
    console.log(
      `[Broadcast] Sending message type "${message.type}" to ${subscriberCount} client(s)`,
    );
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
    console.log(
      `[Broadcast] Closing all ${this.subscribers.size} subscriber connection(s)`,
    );
    // Create a copy of the set to avoid modification during iteration
    const subscribersToClose = Array.from(this.subscribers);
    subscribersToClose.forEach((subscriber) => {
      this.unsubscribe(subscriber);
    });
  }
}
