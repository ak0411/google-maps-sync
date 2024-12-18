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
  socket.emit("controlStatus", {
    isControlled: !!currentController,
    controllerId: currentController,
  });

  socket.on("takeControl", () => {
    if (!currentController) {
      currentController = socket.id;
      io.emit("controlStatus", {
        isControlled: true,
        controllerId: currentController,
      });
    }
  });

  socket.on("giveControl", () => {
    if (currentController === socket.id) {
      currentController = null;
      io.emit("controlStatus", {
        isControlled: false,
        controllerId: null,
      });
    }
  });

  socket.on("move", (bounds) => {
    if (currentController === socket.id) {
      socket.broadcast.emit("move", bounds);
    }
  });

  socket.on("panoramaVisible", () => {
    if (currentController === socket.id) {
      socket.broadcast.emit("panoramaVisible");
    }
  });

  socket.on("panoramaHidden", () => {
    if (currentController === socket.id) {
      socket.broadcast.emit("panoramaHidden");
    }
  });

  socket.on("updatePano", (panoId) => {
    if (currentController === socket.id) {
      socket.broadcast.emit("panoramaVisible");
      socket.broadcast.emit("updatePano", panoId);
    }
  });

  socket.on("disconnect", () => {
    if (currentController === socket.id) {
      currentController = null;
      socket.broadcast.emit("controlStatus", {
        isControlled: false,
        controllerId: null,
      });
      socket.broadcast.emit("panoramaHidden");
    }
  });
});

const PORT = 4000;
httpServer.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`);
});
