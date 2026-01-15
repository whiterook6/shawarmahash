import { BaseService } from "./base";
import { type HealthStatus, type HealthStatusRaw } from "./types";

export class HealthService extends BaseService {
  async getHealth(): Promise<HealthStatus> {
    const response = await fetch("/health");
    const raw = await this.handleResponse<HealthStatusRaw>(response);
    return {
      ...raw,
      startTime: new Date(raw.startTime),
      now: new Date(raw.now),
    };
  }
}
