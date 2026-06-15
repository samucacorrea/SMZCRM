import { Server } from "socket.io";

export function createSocketServer() {
  return new Server({
    cors: {
      origin: false,
    },
  });
}
