import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
  },
});

let currentController: string | null = null;

io.on("connection", (socket) => {
  // Notify the client of the current control status
  socket.emit("control", currentController === socket.id);

  socket.on("takeControl", () => {
    if (!currentController) {
      currentController = socket.id;
      socket.emit("control", true);
      socket.broadcast.emit("control", false);
    }
  });

  socket.on("giveControl", () => {
    if (currentController === socket.id) {
      currentController = null;
      socket.emit("control", false);
    }
  });

  socket.on("move", (bounds) => {
    if (currentController === socket.id) {
      console.log(bounds);
      socket.broadcast.emit("move", bounds);
    }
  });

  socket.on("disconnect", () => {
    if (currentController === socket.id) {
      currentController = null;
      socket.broadcast.emit("control", false);
    }
  });
});

const PORT = 4000;
httpServer.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`);
});
