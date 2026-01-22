const IDENTITY_STORAGE_KEY = "shawarmahash_identity";

export const identityStorage = {
  get: (): string | null => {
    try {
      if (typeof window === "undefined") {
        return null;
      }
      return localStorage.getItem(IDENTITY_STORAGE_KEY);
    } catch {
      return null;
    }
  },

  set: (identity: string): void => {
    try {
      if (typeof window === "undefined") {
        return;
      }
      localStorage.setItem(IDENTITY_STORAGE_KEY, identity);
    } catch {
      // Ignore storage errors (e.g., quota exceeded, private browsing)
    }
  },

  remove: (): void => {
    try {
      if (typeof window === "undefined") {
        return;
      }
      localStorage.removeItem(IDENTITY_STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  },
};
