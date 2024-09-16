const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
     methods: ["GET", "POST"],
    credentials: true,
  },
}).of("/socket_connection");

const PORT = 4321;
const userSockets = new Map(); // Store user ID to socket mapping

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Register user with a specific ID
  socket.on("register-user", (userId) => {
    userSockets.set(userId, socket.id);
    console.log(`User ${userId} registered with socket ID ${socket.id}`);
  });

  // Handle call requests
  socket.on("callUser", ({ userToCall, signalData, from, name }) => {
    const targetSocketId = userSockets.get(userToCall);
    if (targetSocketId) {
      io.to(targetSocketId).emit("incoming-call", { signal: signalData, from, name });
    } else {
      console.error(`Target user ${userToCall} not found`);
    }
  });

  // Handle call answer
  socket.on("answerCall", ({ to, signal }) => {
    const targetSocketId = userSockets.get(to);
    if (targetSocketId) {
      io.to(targetSocketId).emit("callAccepted", signal);
    } else {
      console.error(`Target user ${to} not found`);
    }
  });

  // Handle ICE candidate
  socket.on("message", (message) => {
    console.log("Received message on server:", message);
    const targetSocketId = userSockets.get(message.target);
    if (targetSocketId) {
      io.to(targetSocketId).emit("message", message);
    } else {
      console.error(`Target user ${message.target} not found`);
    }
  });

  // Handle hangup
  socket.on("hangup", ({ to }) => {
    const targetSocketId = userSockets.get(to);
    if (targetSocketId) {
      io.to(targetSocketId).emit("hangup");
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    userSockets.forEach((socketId, userId) => {
      if (socketId === socket.id) {
        userSockets.delete(userId);
        console.log(`User ${userId} disconnected`);
      }
    });
  });
});

app.get("/api", (req, res) => {
  res.send({ msg: "Backend Server is Running!" });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});







