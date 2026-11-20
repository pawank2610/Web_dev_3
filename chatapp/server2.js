const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const httpserver = http.createServer(app);

const io = new Server(httpserver);

app.use(express.static(path.join(__dirname, "public")));


let count = 0;                                  
const users = {};                               
const rooms = new Set(["Public Room"]);          

io.on("connection", (socket) => {
  count++;
  console.log("Active user: ", count);


  socket.emit("gyankibaat", "welcome to socket.io server");
  socket.broadcast.emit("join", "New User Joined");
  io.emit("announcement", "Today is last time we study web dev -3");

  
  users[socket.id] = { name: null, room: "Public Room" };
  socket.join("Public Room");


  io.emit("active-users", count);
  io.emit("room-list", [...rooms]);

  socket.on("kuchbhi", (msg) => {
    console.log(msg);
  });

  socket.on("set-name", (name) => {
    name = String(name || "").trim().slice(0, 20) || "Anonymous";
    users[socket.id].name = name;
    socket.emit("system", `You joined as ${name}`);
    io.emit("system", `${name} joined the chat`);
    io.emit("user-list", Object.values(users).map((u) => u.name).filter(Boolean));
  });

  socket.on("chat-message", (data) => {
    const user = users[socket.id];
    if (!user || !user.name) return;
    const room = (data && data.room) || user.room;
    const text = String((data && data.text) || "").trim().slice(0, 500);
    if (!text) return;
    io.to(room).emit("chat-message", {
      user: user.name,
      text: text,
      room: room,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    });
  });

  socket.on("create-room", (roomName) => {
    roomName = String(roomName || "").trim().slice(0, 30);
    if (!roomName) return;
    if (rooms.has(roomName)) {
      socket.emit("system", `Room "${roomName}" already exists — try joining it`);
      return;
    }
    rooms.add(roomName);
    io.emit("room-list", [...rooms]);
    socket.emit("system", `Room "${roomName}" created`);
  });

  socket.on("join-room", (roomName) => {
    roomName = String(roomName || "").trim();
    if (!rooms.has(roomName)) return;
    const user = users[socket.id];
    socket.leave(user.room);
    socket.to(user.room).emit("system", `${user.name} left ${user.room}`);
    user.room = roomName;
    socket.join(roomName);
    socket.emit("room-changed", roomName);
    socket.emit("system", `You joined "${roomName}"`);
    socket.to(roomName).emit("system", `${user.name} joined ${roomName}`);
  });

 
  socket.on("leave-room", () => {
    const user = users[socket.id];
    if (user.room === "Public Room") return;
    socket.leave(user.room);
    socket.to(user.room).emit("system", `${user.name} left ${user.room}`);
    user.room = "Public Room";
    socket.join("Public Room");
    socket.emit("room-changed", "Public Room");
    socket.emit("system", "You left the room — back to Public Room");
  });

  socket.on("typing", (room) => {
    const user = users[socket.id];
    if (!user || !user.name) return;
    socket.to(room || user.room).emit("typing", user.name);
  });

  socket.on("disconnect", () => {
    count--;
    const user = users[socket.id];
    if (user && user.name) {
      io.emit("system", `${user.name} left the chat`);
    }
    delete users[socket.id];
    console.log("Active user: ", count);
    io.emit("active-users", count);
    io.emit("user-list", Object.values(users).map((u) => u.name).filter(Boolean));
  });
});

httpserver.listen(8081, () => {
  console.log("Extended server started on http://localhost:8081");
});
