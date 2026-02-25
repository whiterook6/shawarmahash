const PING_INTERVAL_MS = 60 * 1000; // 1 minute

export function startHealthcheckPing(url: string): () => void {
  const ping = async () => {
    try {
      const res = await fetch(url, { method: "GET" });
      if (!res.ok) {
        console.warn(
          `[Healthcheck] Ping failed: ${res.status} ${res.statusText}`,
        );
      }
    } catch (err) {
      console.warn("[Healthcheck] Ping request failed:", err);
    }
  };

  // Ping immediately, then every minute
  ping();
  const intervalId = setInterval(ping, PING_INTERVAL_MS);

  return () => {
    clearInterval(intervalId);
  };
}
