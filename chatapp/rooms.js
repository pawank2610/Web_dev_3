module.exports = function setupRooms(io) {
  const rooms = new Map(); 
  const makeRoom = (code, name) => {
    rooms.set(code, { name, members: new Map(), history: [] });
  };
  makeRoom("LOBBY", "Lobby");

  const newCode = () => {
    let c;
    do c = Math.random().toString(36).slice(2, 8).toUpperCase();
    while (rooms.has(c));
    return c;
  };

  const post = (code, msg) => {
    const room = rooms.get(code);
    const m = { room: code, ts: Date.now(), ...msg };
    room.history.push(m);
    if (room.history.length > 50) room.history.shift(); 
    io.to(code).emit("chat:message", m);
  };

  const sendMembers = (code) => {
    const room = rooms.get(code);
    if (room) io.to(code).emit("room:members", { room: code, members: [...room.members.values()] });
  };

  io.on("connection", (socket) => {
    let name = null;
    const joined = new Set();

    const enter = (code) => {
      const room = rooms.get(code);
      if (!room || joined.has(code)) return;
      socket.join(code);
      joined.add(code);
      room.members.set(socket.id, name);
      socket.emit("room:joined", { code, name: room.name, history: room.history });
      post(code, { system: true, text: `${name} joined` });
      sendMembers(code);
    };

    const exit = (code) => {
      const room = rooms.get(code);
      if (!room || !joined.has(code)) return;
      room.members.delete(socket.id);
      joined.delete(code);
      socket.leave(code);
      if (room.members.size === 0 && code !== "LOBBY") {
        rooms.delete(code); 
        return;
      }
      post(code, { system: true, text: `${name} left` });
      sendMembers(code);
    };

    socket.on("user:login", (n) => {
      if (name) return;
      n = String(n || "").trim().slice(0, 20);
      if (!n) return socket.emit("app:error", "Please enter a name.");
      name = n;
      socket.emit("user:ready", { name });
      enter("LOBBY");
    });

    socket.on("room:create", (roomName) => {
      if (!name) return;
      roomName = String(roomName || "").trim().slice(0, 30) || `${name}'s room`;
      const code = newCode();
      makeRoom(code, roomName);
      enter(code);
    });

    socket.on("room:join", (code) => {
      if (!name) return;
      code = String(code || "").trim().toUpperCase();
      if (!rooms.has(code)) return socket.emit("app:error", `No room found with code ${code}.`);
      enter(code);
    });

    socket.on("room:leave", (code) => {
      if (code !== "LOBBY") exit(code);
    });

    socket.on("chat:message", ({ room, text } = {}) => {
      text = String(text || "").trim().slice(0, 500);
      if (!name || !text || !joined.has(room)) return;
      post(room, { user: name, text });
    });

    socket.on("chat:typing", (room) => {
      if (joined.has(room)) socket.to(room).emit("chat:typing", { room, user: name });
    });

    socket.on("disconnect", () => [...joined].forEach(exit));
  });
};
