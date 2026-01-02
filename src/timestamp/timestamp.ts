export const Timestamp = {
  now: (): number => {
    return Math.floor(Date.now() / 1000);
  }
}