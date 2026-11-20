# SocketChat – Multi-Room Real-Time Chat Application
**Course:** Web Dev III (Node.js & Express Backend)  
**Unit:** Unit–3 Week 4 (Socket.IO & WebSockets)  
**Assignment:** Assignment 4 (A4 Submission & Presentation)

---

## 📋 Project Overview
This project takes the complete backend code of the **Chat Application discussed in class** and elevates it into a production-grade, interactive, full-stack real-time chat application with a modern Discord/Slack-styled frontend and extensive room features.

---

## 🎯 Compliance with Assignment Requirements

### 1. Existing Backend Code Strictly Preserved
As instructed (*"Do not modify all the existing backend code"*), every single event and logic from the class backend is 100% intact:
- ✅ `count++` and `count--` tracking active users in terminal
- ✅ `socket.emit("gyankibaat", "welcome to socket.io server")` (displayed in top notice banner and event inspector)
- ✅ `socket.broadcast.emit("join", "New User Joined")` (triggers real-time join toast notifications to all connected clients)
- ✅ `socket.on("kuchbhi", (msg) => { console.log(msg); })` (can be triggered directly via the UI's quick test buttons!)
- ✅ `socket.on("disconnect", ...)` (handles cleanup and decrements count)
- ✅ `io.emit("announcement", "Today is last time we study web dev -3")` (displayed in the class announcements ticker)
- ✅ Original `client.html` is preserved and accessible at `/legacy`

### 2. Extra Features Added (As Requested)
- 🏠 **Personal & Custom Rooms:** Users can create custom rooms with room name, topic, and optional password protection.
- 👥 **Multi-User Room Support:** Seamlessly join and switch between default channels (`#general`, `#tech-talk`, `#college-projects`, `#random`) and custom user-created rooms.
- 💬 **Room Message History:** Newly joined users receive recent room messages stored in-memory.
- ⌨️ **Real-Time Typing Indicators:** Animated dots show who is actively typing in the current channel.
- ❤️ **Interactive Message Reactions:** React to messages with emojis (`👍`, `❤️`, `😂`, `🔥`, `🚀`).
- 🟢 **Live Online Presence:** Room members list and real-time active user counters.
- 🔍 **Classroom Event Inspector:** An integrated debugging sidebar showing live Socket.IO events (`gyankibaat`, `join`, `announcement`, `kuchbhi`) for your presentation!
- 🔔 **Web Audio Notification:** Pleasant synthesized chime when receiving messages.

---

## 🚀 How to Run the Application

### 1. Start the Server
```bash
cd Assignment_4/chatapp
node server.js
```
The server will start on: **`http://localhost:8080`**

### 2. Open in Your Browser
Open your browser and navigate to:
👉 **`http://localhost:8080`**

To test multi-user chat and rooms, open a second tab or an incognito window!

---

## 🎤 Presentation Guide for Monday
When presenting to your instructor:
1. **Show Server Console:**
   - Demonstrate the server terminal logging `Active user: 1`, `Active user: 2` as new browser tabs connect.
2. **Demonstrate Original Class Events:**
   - Point out the **Gyan Ki Baat** banner at the top displaying `"welcome to socket.io server"`.
   - Point out the **Class Announcements** ticker displaying `"Today is last time we study web dev -3"`.
   - Click the **"Send 'kuchbhi' Event"** button in the chat input bar and show the instructor your terminal printing `"welcome to client side"`.
   - Open the **Classroom Event Inspector** panel on the right sidebar to show live event streams.
3. **Demonstrate Extra Features:**
   - Click **"+ New Room"** to create a personal room (e.g. `#my-team`).
   - Switch between rooms and show how messages are isolated to their specific rooms using `socket.join(room)` and `socket.to(room).emit()`.
   - Show typing indicators and emoji reactions across two open windows.

---

## 📁 File Structure
```
chatapp/
├── client.html           # Original untouched classroom client
├── package.json          # Project metadata & start scripts
├── package-lock.json     # Dependency lockfile
├── server.js             # Enhanced Socket.IO server with rooms & Express static serving
├── README.md             # Project documentation & presentation guide
├── Assignment4.txt       # GitHub repository link
└── public/               # Frontend Assets
    ├── index.html        # Responsive multi-room chat interface
    ├── style.css         # Modern dark theme styles
    └── app.js            # Client-side Socket.IO event handler
```
