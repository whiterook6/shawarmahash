import { BaseService } from "./base";

export class EventsService extends BaseService {
  async getEvents(): Promise<Response> {
    const response = await fetch("/events");
    return this.handleRawResponse(response);
  }
}
