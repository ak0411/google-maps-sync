import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import { ClientNameGenerator } from "./clientNameGenerator";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);
  const io = new Server(httpServer);

  let currentController: string | null = null;
  const nameGenerator = new ClientNameGenerator();
  const connectedClients: Map<string, string> = new Map();

  io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);
    let clientName = nameGenerator.getAvailableName();

    // Use a temporary backup name when all available name is taken
    if (!clientName) {
      clientName = `Guest#${Math.floor(Math.random() * 10000)}`;
    }

    connectedClients.set(socket.id, clientName);
    io.emit("updateClients", Object.fromEntries(connectedClients));

    socket.emit("controlStatus", currentController);

    socket.on("takeControl", () => {
      if (!currentController) {
        currentController = socket.id;
        io.emit("controlStatus", currentController);
      }
    });

    socket.on("giveControl", () => {
      if (currentController === socket.id) {
        currentController = null;
        io.emit("controlStatus", currentController);
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

    socket.on("updatePov", (pov) => {
      if (currentController === socket.id) {
        socket.broadcast.emit("updatePov", pov);
      }
    });

    socket.on("marker", (location) => {
      if (currentController === socket.id) {
        socket.broadcast.emit("marker", location);
      }
    });

    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);

      const name = connectedClients.get(socket.id);
      if (name) {
        nameGenerator.releaseName(name);
        connectedClients.delete(socket.id);
        socket.broadcast.emit(
          "updateClients",
          Object.fromEntries(connectedClients)
        );
      }

      if (currentController === socket.id) {
        currentController = null;
        socket.broadcast.emit("controlStatus", currentController);
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
