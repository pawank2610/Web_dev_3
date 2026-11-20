
const express = require("express");
const http = require("http");

const { Server } = require("socket.io");

const app = express();
const httpserver = http.createServer(app);

const io = new Server(httpserver);

require("./rooms")(io);

let count = 0;
io.on("connection", (socket) => {
  count++;
  console.log("Active user: ", count);

  socket.emit("gyankibaat", "welcome to socket.io server");

  socket.broadcast.emit("join", "New User Joined");

 
  socket.on("kuchbhi", (msg) => {
    console.log(msg);
  });

  socket.on("disconnect", () => {
    count--;
    console.log("Active user: ", count);
  });

  io.emit("announcement", "Today is last time we study web dev -3");
});

httpserver.listen(8080, () => {
  console.log("Server started");
});
