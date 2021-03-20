export const connectWebSocket = (url: string): Promise<WebSocket> => {
  return new Promise((resolve) => {
    console.log(`Connecting to websocket at ${url}`);
    const socket = new WebSocket(url);
    socket.onopen = () => {
      console.log("...connected to websocket.");
      resolve(socket);
    };
  });
};
