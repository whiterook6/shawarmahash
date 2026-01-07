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
        console.error(error);
        this.unsubscribe(subscriber);
      }
    });
  }
}
