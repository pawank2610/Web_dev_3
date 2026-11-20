// npm init -y
// npm i socket.io
const express = require("express");
const http = require("http");
const path = require("path");

const { Server } = require("socket.io");

const app = express();
const httpserver = http.createServer(app);

const io = new Server(httpserver, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Serve frontend static assets from public/ directory
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// Serve the interactive chat frontend
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Keep original client.html accessible at /legacy
app.get("/legacy", (req, res) => {
  res.sendFile(path.join(__dirname, "client.html"));
});

// ============================================================================
// EXTRA FEATURES: Personal Rooms, Multi-User Chat, Room History & Presence
// ============================================================================
const rooms = new Map(); // roomName -> { name, description, createdBy, isPrivate, password, users: Set(socketId) }
const roomMessages = new Map(); // roomName -> Array<{ id, sender, text, time, avatar, color, reactions }>
const activeUsers = new Map(); // socketId -> { id, username, avatar, color, currentRoom }

// Helper to initialize a room
function ensureRoomExists(name, description = "Public discussion channel", createdBy = "System", isPrivate = false, password = "") {
  const normalized = name.toLowerCase().trim();
  if (!rooms.has(normalized)) {
    rooms.set(normalized, {
      name: normalized,
      displayName: name.trim(),
      description,
      createdBy,
      isPrivate: Boolean(isPrivate),
      password: password || "",
      createdAt: new Date().toISOString(),
      users: new Set()
    });
    roomMessages.set(normalized, []);
  }
  return rooms.get(normalized);
}

// Pre-populate standard public rooms
ensureRoomExists("general", "General discussion for everyone", "System");
ensureRoomExists("tech-talk", "Code, Web Development, Node.js & Socket.IO", "System");
ensureRoomExists("college-projects", "Discuss assignments, presentations & exams", "System");
ensureRoomExists("random", "Casual conversations, memes, and fun", "System");

// Get public summary of all rooms
function getRoomsSummary() {
  const list = [];
  for (const [key, r] of rooms.entries()) {
    list.push({
      name: r.name,
      displayName: r.displayName,
      description: r.description,
      createdBy: r.createdBy,
      isPrivate: r.isPrivate,
      userCount: r.users.size,
      hasPassword: Boolean(r.password)
    });
  }
  return list;
}

// REST API for rooms & stats
app.get("/api/rooms", (req, res) => {
  res.json({ success: true, rooms: getRoomsSummary() });
});

app.get("/api/stats", (req, res) => {
  res.json({
    success: true,
    activeUsers: count,
    totalRooms: rooms.size,
    uptime: Math.round(process.uptime())
  });
});

// ============================================================================
// ORIGINAL CLASSROOM BACKEND CODE (PRESERVED & ENHANCED)
// ============================================================================
let count = 0;
io.on("connection", (socket) => {
  count++;
  console.log("Active user: ", count);

  // Sending (Original Classroom Events)
  socket.emit("gyankibaat", "welcome to socket.io server");

  socket.broadcast.emit("join", "New User Joined");

  // Reading (Original Classroom Events)
  socket.on("kuchbhi", (msg) => {
    console.log(msg);
  });

  socket.on("disconnect", () => {
    count--;
    console.log("Active user: ", count);

    // Clean up user from rooms on disconnect
    const user = activeUsers.get(socket.id);
    if (user && user.currentRoom) {
      const room = rooms.get(user.currentRoom);
      if (room) {
        room.users.delete(socket.id);
        socket.to(user.currentRoom).emit("room_notification", {
          type: "leave",
          text: `${user.username} left the room.`,
          time: new Date().toLocaleTimeString(),
          userCount: room.users.size
        });
        io.to(user.currentRoom).emit("room_users_update", getRoomUsersList(user.currentRoom));
      }
    }
    activeUsers.delete(socket.id);
    io.emit("rooms_list_update", getRoomsSummary());
    io.emit("active_users_count", count);
  });

  io.emit("announcement", "Today is last time we study web dev -3");

  // ==========================================================================
  // EXTRA FEATURES SOCKET HANDLERS: ROOMS & CHAT
  // ==========================================================================

  // Broadcast live active count
  io.emit("active_users_count", count);

  // Send current rooms list to newly connected client
  socket.emit("rooms_list_update", getRoomsSummary());

  // 1. Register User Profile
  socket.on("register_user", ({ username, avatar, color }) => {
    const cleanUsername = String(username || "Guest").trim().substring(0, 24);
    activeUsers.set(socket.id, {
      id: socket.id,
      username: cleanUsername,
      avatar: avatar || "👤",
      color: color || "#6366f1",
      currentRoom: null
    });

    socket.emit("user_registered", {
      id: socket.id,
      username: cleanUsername,
      avatar: avatar || "👤",
      color: color || "#6366f1"
    });
  });

  // Helper to get users in a room
  function getRoomUsersList(roomName) {
    const room = rooms.get(roomName);
    if (!room) return [];
    const list = [];
    for (const sId of room.users) {
      const u = activeUsers.get(sId);
      if (u) {
        list.push({ id: u.id, username: u.username, avatar: u.avatar, color: u.color });
      }
    }
    return list;
  }

  // 2. Create Personal / Custom Room
  socket.on("create_room", ({ roomName, description, isPrivate, password }) => {
    const cleanName = String(roomName || "").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    if (!cleanName || cleanName.length < 2) {
      return socket.emit("error_message", "Room name must be at least 2 alphanumeric characters.");
    }

    if (rooms.has(cleanName)) {
      return socket.emit("error_message", `Room "${cleanName}" already exists. You can join it directly!`);
    }

    const creator = activeUsers.get(socket.id)?.username || "User";
    const roomObj = ensureRoomExists(cleanName, description || `Created by ${creator}`, creator, isPrivate, password);

    console.log(`[ROOM CREATED] "${cleanName}" by ${creator}`);
    io.emit("rooms_list_update", getRoomsSummary());
    socket.emit("room_created", { roomName: cleanName });
  });

  // 3. Join Room
  socket.on("join_room", ({ roomName, password }) => {
    const cleanName = String(roomName || "general").trim().toLowerCase();
    const room = rooms.get(cleanName);

    if (!room) {
      return socket.emit("error_message", `Room "${cleanName}" does not exist.`);
    }

    if (room.isPrivate && room.password && room.password !== password) {
      return socket.emit("error_message", "Incorrect room password.");
    }

    const user = activeUsers.get(socket.id);
    if (!user) {
      return socket.emit("error_message", "Please set your username first.");
    }

    // Leave previous room if any
    if (user.currentRoom && user.currentRoom !== cleanName) {
      socket.leave(user.currentRoom);
      const prevRoom = rooms.get(user.currentRoom);
      if (prevRoom) {
        prevRoom.users.delete(socket.id);
        socket.to(user.currentRoom).emit("room_notification", {
          type: "leave",
          text: `${user.username} switched rooms.`,
          time: new Date().toLocaleTimeString(),
          userCount: prevRoom.users.size
        });
        io.to(user.currentRoom).emit("room_users_update", getRoomUsersList(user.currentRoom));
      }
    }

    // Join new room
    socket.join(cleanName);
    user.currentRoom = cleanName;
    room.users.add(socket.id);

    console.log(`[USER JOINED ROOM] ${user.username} joined #${cleanName}`);

    // Send confirmation & room history to the joining user
    socket.emit("room_joined", {
      room: {
        name: room.name,
        displayName: room.displayName,
        description: room.description,
        isPrivate: room.isPrivate,
        userCount: room.users.size
      },
      history: roomMessages.get(cleanName) || []
    });

    // Notify other room members
    socket.to(cleanName).emit("room_notification", {
      type: "join",
      text: `${user.username} joined #${room.displayName}.`,
      time: new Date().toLocaleTimeString(),
      userCount: room.users.size
    });

    // Update room user lists
    io.to(cleanName).emit("room_users_update", getRoomUsersList(cleanName));
    io.emit("rooms_list_update", getRoomsSummary());
  });

  // 4. Send Chat Message to Room
  socket.on("send_message", ({ message, roomName }) => {
    const user = activeUsers.get(socket.id);
    if (!user) return;

    const targetRoom = roomName || user.currentRoom || "general";
    const cleanMsg = String(message || "").trim();
    if (!cleanMsg) return;

    const msgObj = {
      id: "msg_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      senderId: socket.id,
      sender: user.username,
      avatar: user.avatar,
      color: user.color,
      room: targetRoom,
      text: cleanMsg,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      timestamp: Date.now(),
      reactions: {}
    };

    // Save to room message history (keep last 100)
    if (!roomMessages.has(targetRoom)) {
      roomMessages.set(targetRoom, []);
    }
    const history = roomMessages.get(targetRoom);
    history.push(msgObj);
    if (history.length > 100) history.shift();

    // Broadcast to room
    io.to(targetRoom).emit("receive_message", msgObj);
  });

  // 5. Typing Indicators
  socket.on("typing", ({ roomName }) => {
    const user = activeUsers.get(socket.id);
    if (user && roomName) {
      socket.to(roomName).emit("user_typing", {
        userId: socket.id,
        username: user.username,
        roomName
      });
    }
  });

  socket.on("stop_typing", ({ roomName }) => {
    const user = activeUsers.get(socket.id);
    if (user && roomName) {
      socket.to(roomName).emit("user_stop_typing", {
        userId: socket.id,
        username: user.username,
        roomName
      });
    }
  });

  // 6. Message Reactions
  socket.on("add_reaction", ({ roomName, messageId, emoji }) => {
    const history = roomMessages.get(roomName);
    if (history) {
      const msg = history.find((m) => m.id === messageId);
      if (msg) {
        msg.reactions[emoji] = (msg.reactions[emoji] || 0) + 1;
        io.to(roomName).emit("reaction_updated", {
          messageId,
          reactions: msg.reactions
        });
      }
    }
  });
});

const PORT = process.env.PORT || 8080;

httpserver.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.log(`Port ${PORT} is already in use. Please close the other process or set PORT=8081.`);
  } else {
    console.error("Server error:", err);
  }
});

httpserver.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
