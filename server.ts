import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);
  const io = new Server(httpServer);

  let currentController: string | null = null;
  const clients = new Set();

  io.on("connection", (socket) => {
    clients.add(socket.id);
    io.emit("onlineClients", clients.size);

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

    socket.on("updateMap", (bounds) => {
      if (currentController === socket.id) {
        socket.broadcast.emit("updateMap", bounds);
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
      console.log(`Client disconnected: ${socket.id}`);
      clients.delete(socket.id);
      io.emit("onlineClients", clients.size);

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

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
