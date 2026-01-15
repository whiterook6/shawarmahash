export class BaseService {
  protected async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const details = await response.text().catch(() => "");
      throw new Error(
        `Request failed (${response.status}): ${details || response.statusText}`,
      );
    }
    return response.json() as Promise<T>;
  }
}
