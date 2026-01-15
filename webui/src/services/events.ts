type Listener = {
  send: (data: unknown) => void;
  close: () => void;
}

export class EventService {
  listeners: Set<Listener> = new Set();
  private eventSource: EventSource | null = null;
  private reconnectTimeoutId: number | null = null;
  private reconnectDelayMs = 1000;

  constructor(private readonly baseUrl: string) {
    this.handleMessage = this.handleMessage.bind(this);
    this.handleError = this.handleError.bind(this);
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    if (this.listeners.size === 1) {
      this.connect();
    }
    return () => {
      try {
        listener.close();
      } finally {
        this.listeners.delete(listener);
        if (this.listeners.size === 0) {
          this.disconnect();
        }
      }
    }
  }

  private getEventsUrl(): string {
    if (!this.baseUrl) {
      return "/events";
    }
    const trimmed = this.baseUrl.replace(/\/+$/, "");
    return `${trimmed}/events`;
  }

  private connect(): void {
    if (this.eventSource) {
      return;
    }
    const url = this.getEventsUrl();
    this.eventSource = new EventSource(url);
    this.eventSource.addEventListener("message", this.handleMessage);
    this.eventSource.addEventListener("error", this.handleError);
  }

  private disconnect(): void {
    if (this.reconnectTimeoutId !== null) {
      window.clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
    if (this.eventSource) {
      this.eventSource.removeEventListener("message", this.handleMessage);
      this.eventSource.removeEventListener("error", this.handleError);
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  private handleMessage(event: MessageEvent): void {
    let data: unknown;
    try {
      data = JSON.parse(event.data);
    } catch (error) {
      console.error("Failed to parse SSE message:", error);
      return;
    }
    this.listeners.forEach((listener) => {
      try {
        listener.send(data);
      } catch (sendError) {
        console.error("Failed to send SSE message:", sendError);
      }
    });
  }

  private handleError(): void {
    if (!this.eventSource || this.eventSource.readyState !== EventSource.CLOSED) {
      return;
    }
    this.eventSource = null;
    if (this.listeners.size === 0 || this.reconnectTimeoutId !== null) {
      return;
    }
    this.reconnectTimeoutId = window.setTimeout(() => {
      this.reconnectTimeoutId = null;
      if (this.listeners.size > 0) {
        this.connect();
      }
    }, this.reconnectDelayMs);
  }
}