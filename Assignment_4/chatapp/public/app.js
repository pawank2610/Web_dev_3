// ==========================================================================
// SOCKETCHAT – CLIENT-SIDE LOGIC & SOCKET.IO INTEGRATION
// ==========================================================================

// Connect to Socket.IO server
const socket = io();

// Client State
let currentUsername = localStorage.getItem('socketchat_username') || '';
let currentAvatar = localStorage.getItem('socketchat_avatar') || '🧑‍💻';
let currentColor = localStorage.getItem('socketchat_color') || '#6366f1';
let currentRoom = 'general';
let allRooms = [];
let pendingPrivateRoom = null;
let typingTimeout = null;
let isCurrentlyTyping = false;

// Audio notification (synthesized via Web Audio API, zero external files)
let audioCtx = null;
function playNotificationSound() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.12); // A5
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.18);
  } catch (e) {}
}

// --------------------------------------------------------------------------
// 1. Initialization on DOM Load
// --------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  setupPickerEvents();

  // If user previously registered in this browser, restore profile
  if (currentUsername) {
    document.getElementById('usernameInput').value = currentUsername;
    selectAvatar(currentAvatar);
    selectColor(currentColor);
    registerWithServer();
  } else {
    // Show login modal
    document.getElementById('loginModal').classList.remove('hidden');
  }

  // Auto-resize textarea
  const textarea = document.getElementById('messageInput');
  textarea.addEventListener('input', () => {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  });

  // Close popovers on outer click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.emoji-dropdown')) {
      document.getElementById('emojiPickerPopover').classList.add('hidden');
    }
  });
});

// --------------------------------------------------------------------------
// 2. Setup Profile & Pickers
// --------------------------------------------------------------------------
function setupPickerEvents() {
  // Avatar Picker
  document.querySelectorAll('#avatarPicker .avatar-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectAvatar(btn.dataset.avatar);
    });
  });

  // Color Picker
  document.querySelectorAll('#colorPicker .color-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      selectColor(dot.dataset.color);
    });
  });
}

function selectAvatar(avatar) {
  currentAvatar = avatar;
  document.querySelectorAll('#avatarPicker .avatar-btn').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.avatar === avatar);
  });
  document.getElementById('currentAvatarBadge').textContent = avatar;
}

function selectColor(color) {
  currentColor = color;
  document.querySelectorAll('#colorPicker .color-dot').forEach(dot => {
    dot.classList.toggle('selected', dot.dataset.color === color);
  });
}

function handleJoinChat() {
  const input = document.getElementById('usernameInput').value.trim();
  if (!input) {
    showToast('Please enter a username', 'error');
    document.getElementById('usernameInput').focus();
    return;
  }

  currentUsername = input;
  localStorage.setItem('socketchat_username', currentUsername);
  localStorage.setItem('socketchat_avatar', currentAvatar);
  localStorage.setItem('socketchat_color', currentColor);

  registerWithServer();
  document.getElementById('loginModal').classList.add('hidden');
  showToast(`Welcome, ${currentUsername}!`, 'success');
}

function reopenProfileModal() {
  document.getElementById('usernameInput').value = currentUsername;
  document.getElementById('loginModal').classList.remove('hidden');
}

function registerWithServer() {
  document.getElementById('currentUsername').textContent = currentUsername;
  document.getElementById('currentAvatarBadge').textContent = currentAvatar;
  document.getElementById('currentAvatarBadge').style.borderColor = currentColor;

  socket.emit('register_user', {
    username: currentUsername,
    avatar: currentAvatar,
    color: currentColor
  });

  // Join default room
  socket.emit('join_room', { roomName: currentRoom });
}

// --------------------------------------------------------------------------
// 3. Socket.IO Listeners: ORIGINAL CLASSROOM BACKEND EVENTS
// --------------------------------------------------------------------------

// Connected
socket.on('connect', () => {
  document.getElementById('connectionStatusText').textContent = 'Connected (8080)';
  document.querySelector('.pulse-dot').style.backgroundColor = 'var(--success)';
  logEvent('connect', { socketId: socket.id, status: 'connected to ws://localhost:8080' });

  // Original client code sends "kuchbhi" on load
  socket.emit('kuchbhi', 'welcome to client side ');
  logEvent('emit: kuchbhi', 'welcome to client side ');

  if (currentUsername) {
    registerWithServer();
  }
});

// Disconnected
socket.on('disconnect', () => {
  document.getElementById('connectionStatusText').textContent = 'Disconnected';
  document.querySelector('.pulse-dot').style.backgroundColor = 'var(--danger)';
  logEvent('disconnect', 'Socket disconnected');
});

// Original Classroom Event 1: "gyankibaat"
socket.on('gyankibaat', (msg) => {
  console.log('Message from server [gyankibaat]:', msg);
  logEvent('on: gyankibaat', msg);

  const banner = document.getElementById('gyanKiBaatBanner');
  const text = document.getElementById('gyanKiBaatText');
  if (banner && text) {
    text.textContent = msg;
    banner.style.display = 'flex';
  }
});

// Original Classroom Event 2: "join"
socket.on('join', (msg) => {
  console.log('Message from server [join]:', msg);
  logEvent('on: join', msg);
  showToast(msg, 'info');
});

// Original Classroom Event 3: "announcement"
socket.on('announcement', (msg) => {
  console.log('Message from server [announcement]:', msg);
  logEvent('on: announcement', msg);

  const ticker = document.getElementById('classAnnouncementText');
  if (ticker) {
    ticker.textContent = `"${msg}"`;
  }
  showToast(`Announcement: ${msg}`, 'info');
});

// Global Active Users Count from Server (synced with server's `count` variable)
socket.on('active_users_count', (count) => {
  document.getElementById('globalActiveCount').textContent = count;
  logEvent('on: active_users_count', `Active users: ${count}`);
});

// --------------------------------------------------------------------------
// 4. Socket.IO Listeners: EXTRA FEATURES (ROOMS & CHAT)
// --------------------------------------------------------------------------

// Rooms List Update
socket.on('rooms_list_update', (rooms) => {
  allRooms = rooms;
  renderRoomsList(rooms);
  logEvent('on: rooms_list_update', `${rooms.length} room(s) available`);
});

// Room Joined Confirmation & History
socket.on('room_joined', ({ room, history }) => {
  currentRoom = room.name;
  document.getElementById('currentRoomTitle').textContent = room.displayName;
  document.getElementById('currentRoomDesc').textContent = room.description;
  document.getElementById('roomMemberCountText').textContent = `${room.userCount} Member${room.userCount > 1 ? 's' : ''}`;
  document.getElementById('roomWelcomeTitle').textContent = `Welcome to #${room.displayName}!`;
  document.getElementById('roomWelcomeDesc').textContent = room.description;
  document.getElementById('messageInput').placeholder = `Type your message to #${room.displayName}... (Press Enter to send)`;

  // Clear messages container and render welcome banner
  const container = document.getElementById('messagesContainer');
  container.innerHTML = `
    <div class="channel-welcome-banner" id="roomWelcomeBanner">
      <div class="welcome-icon">💬</div>
      <h2>Welcome to #${room.displayName}!</h2>
      <p>${room.description}</p>
    </div>
  `;

  // Render recent history
  if (history && history.length > 0) {
    history.forEach(msg => appendMessage(msg));
  }
  scrollToBottom();

  highlightActiveRoom(room.name);
  logEvent('on: room_joined', `Joined #${room.displayName} with ${history ? history.length : 0} past message(s)`);
});

// Room Notification (Join / Leave)
socket.on('room_notification', (data) => {
  appendNotification(data.text);
  document.getElementById('roomMemberCountText').textContent = `${data.userCount} Member${data.userCount > 1 ? 's' : ''}`;
  logEvent('on: room_notification', data.text);
});

// Receive Chat Message
socket.on('receive_message', (msgObj) => {
  appendMessage(msgObj);
  scrollToBottom();
  if (msgObj.sender !== currentUsername) {
    playNotificationSound();
  }
  logEvent(`on: receive_message [${msgObj.room}]`, `${msgObj.sender}: ${msgObj.text.substring(0, 30)}`);
});

// Typing Indicators
socket.on('user_typing', ({ username, roomName }) => {
  if (roomName === currentRoom) {
    const bar = document.getElementById('typingIndicatorBar');
    document.getElementById('typingText').textContent = `${username} is typing...`;
    bar.classList.add('visible');
  }
});

socket.on('user_stop_typing', ({ roomName }) => {
  if (roomName === currentRoom) {
    document.getElementById('typingIndicatorBar').classList.remove('visible');
  }
});

// Room Members Update
socket.on('room_users_update', (users) => {
  renderRoomMembers(users);
});

// Reaction Updated
socket.on('reaction_updated', ({ messageId, reactions }) => {
  updateReactionsUI(messageId, reactions);
});

// Error Message
socket.on('error_message', (errMsg) => {
  showToast(errMsg, 'error');
  logEvent('on: error_message', errMsg);
});

// --------------------------------------------------------------------------
// 5. Message Rendering & Sending
// --------------------------------------------------------------------------
function handleSendMessage(e) {
  if (e) e.preventDefault();
  const input = document.getElementById('messageInput');
  const text = input.value.trim();
  if (!text) return;

  socket.emit('send_message', {
    message: text,
    roomName: currentRoom
  });

  input.value = '';
  input.style.height = 'auto';

  // Stop typing indicator
  socket.emit('stop_typing', { roomName: currentRoom });
  isCurrentlyTyping = false;
  clearTimeout(typingTimeout);
}

function handleInputKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSendMessage();
  }
}

function handleTyping() {
  if (!isCurrentlyTyping) {
    isCurrentlyTyping = true;
    socket.emit('typing', { roomName: currentRoom });
  }

  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    isCurrentlyTyping = false;
    socket.emit('stop_typing', { roomName: currentRoom });
  }, 1200);
}

function appendMessage(msg) {
  const container = document.getElementById('messagesContainer');
  const isMe = msg.sender === currentUsername;

  const row = document.createElement('div');
  row.className = `message-row ${isMe ? 'own-message' : ''}`;
  row.id = msg.id;

  row.innerHTML = `
    <div class="message-avatar" style="border-color: ${msg.color || 'var(--border-light)'}">${msg.avatar || '👤'}</div>
    <div class="message-body">
      <div class="message-meta">
        <span class="message-author" style="color: ${msg.color || 'inherit'}">${escapeHtml(msg.sender)}</span>
        <span class="message-time">${msg.time}</span>
      </div>
      <div class="message-text">${escapeHtml(msg.text)}</div>
      <div class="reactions-row" id="reactions-${msg.id}">
        ${renderReactionsHtml(msg.id, msg.reactions)}
      </div>
    </div>
    <div class="message-hover-toolbar">
      <button class="toolbar-btn" onclick="addReaction('${msg.id}', '👍')">👍</button>
      <button class="toolbar-btn" onclick="addReaction('${msg.id}', '❤️')">❤️</button>
      <button class="toolbar-btn" onclick="addReaction('${msg.id}', '😂')">😂</button>
      <button class="toolbar-btn" onclick="addReaction('${msg.id}', '🔥')">🔥</button>
      <button class="toolbar-btn" onclick="addReaction('${msg.id}', '🚀')">🚀</button>
    </div>
  `;

  container.appendChild(row);
}

function appendNotification(text) {
  const container = document.getElementById('messagesContainer');
  const div = document.createElement('div');
  div.className = 'system-notification';
  div.innerHTML = `<span>${escapeHtml(text)}</span>`;
  container.appendChild(div);
  scrollToBottom();
}

function renderReactionsHtml(msgId, reactions = {}) {
  let html = '';
  for (const [emoji, count] of Object.entries(reactions)) {
    if (count > 0) {
      html += `
        <button class="reaction-chip" onclick="addReaction('${msgId}', '${emoji}')">
          <span>${emoji}</span>
          <span>${count}</span>
        </button>
      `;
    }
  }
  return html;
}

function addReaction(messageId, emoji) {
  socket.emit('add_reaction', {
    roomName: currentRoom,
    messageId,
    emoji
  });
}

function updateReactionsUI(messageId, reactions) {
  const container = document.getElementById(`reactions-${messageId}`);
  if (container) {
    container.innerHTML = renderReactionsHtml(messageId, reactions);
  }
}

function scrollToBottom() {
  const container = document.getElementById('messagesContainer');
  container.scrollTop = container.scrollHeight;
}

// --------------------------------------------------------------------------
// 6. Rooms Management
// --------------------------------------------------------------------------
function renderRoomsList(rooms) {
  const container = document.getElementById('roomsListContainer');
  container.innerHTML = '';

  rooms.forEach(r => {
    const item = document.createElement('div');
    item.className = `room-item ${r.name === currentRoom ? 'active' : ''}`;
    item.dataset.room = r.name;
    item.onclick = () => switchRoom(r);

    item.innerHTML = `
      <div class="room-name-group">
        <span class="room-hash">${r.isPrivate ? '🔒' : '#'}</span>
        <span>${escapeHtml(r.displayName)}</span>
      </div>
      <span class="room-badge">${r.userCount}</span>
    `;

    container.appendChild(item);
  });
}

function highlightActiveRoom(roomName) {
  document.querySelectorAll('.room-item').forEach(item => {
    item.classList.toggle('active', item.dataset.room === roomName);
  });
}

function switchRoom(roomObj) {
  if (roomObj.name === currentRoom) return;

  if (roomObj.isPrivate && roomObj.hasPassword) {
    pendingPrivateRoom = roomObj.name;
    document.getElementById('passwordModalPrompt').textContent = `Room #${roomObj.displayName} is password protected.`;
    document.getElementById('joinRoomPasswordInput').value = '';
    togglePasswordModal(true);
    return;
  }

  socket.emit('join_room', { roomName: roomObj.name });
}

function submitRoomPassword() {
  const pass = document.getElementById('joinRoomPasswordInput').value;
  if (!pass) return showToast('Password required', 'error');

  socket.emit('join_room', {
    roomName: pendingPrivateRoom,
    password: pass
  });
  togglePasswordModal(false);
}

function toggleCreateRoomModal(show) {
  const modal = document.getElementById('createRoomModal');
  modal.classList.toggle('hidden', !show);
  if (show) {
    document.getElementById('newRoomName').value = '';
    document.getElementById('newRoomDesc').value = '';
    document.getElementById('newRoomPrivate').checked = false;
    document.getElementById('newRoomPassword').value = '';
    togglePasswordField();
    document.getElementById('newRoomName').focus();
  }
}

function togglePasswordField() {
  const isPrivate = document.getElementById('newRoomPrivate').checked;
  document.getElementById('passwordGroup').classList.toggle('hidden', !isPrivate);
}

function handleCreateRoom() {
  const name = document.getElementById('newRoomName').value.trim();
  const desc = document.getElementById('newRoomDesc').value.trim();
  const isPrivate = document.getElementById('newRoomPrivate').checked;
  const pass = document.getElementById('newRoomPassword').value;

  if (!name || name.length < 2) {
    return showToast('Room name must be at least 2 characters', 'error');
  }

  socket.emit('create_room', {
    roomName: name,
    description: desc,
    isPrivate,
    password: pass
  });

  // Automatically join newly created room
  socket.emit('join_room', { roomName: name, password: pass });
  toggleCreateRoomModal(false);
  showToast(`Room #${name} created!`, 'success');
}

function togglePasswordModal(show) {
  document.getElementById('roomPasswordModal').classList.toggle('hidden', !show);
  if (show) {
    document.getElementById('joinRoomPasswordInput').focus();
  }
}

function filterRoomsList() {
  const q = document.getElementById('roomSearchInput').value.toLowerCase();
  const filtered = allRooms.filter(r => r.name.includes(q) || r.displayName.toLowerCase().includes(q));
  renderRoomsList(filtered);
}

// --------------------------------------------------------------------------
// 7. Room Members & Sidebar
// --------------------------------------------------------------------------
function renderRoomMembers(users = []) {
  const container = document.getElementById('roomMembersList');
  document.getElementById('membersTabCount').textContent = users.length;
  container.innerHTML = '';

  users.forEach(u => {
    const isMe = u.username === currentUsername;
    const item = document.createElement('div');
    item.className = 'member-item';
    item.innerHTML = `
      <div class="member-avatar" style="border-color:${u.color || 'var(--border-light)'}">${u.avatar || '👤'}</div>
      <div class="member-name">
        ${escapeHtml(u.username)} ${isMe ? '<small style="color:var(--text-dim)">(you)</small>' : ''}
      </div>
    `;
    container.appendChild(item);
  });
}

function switchRightTab(tab) {
  document.querySelectorAll('.right-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tab);
  });
  document.querySelectorAll('.right-tab-pane').forEach(p => {
    p.classList.toggle('active', p.id === `pane-${tab}`);
  });
}

function toggleInspectorPanel() {
  const sidebar = document.getElementById('sidebarRight');
  if (sidebar.classList.contains('hidden-panel')) {
    sidebar.classList.remove('hidden-panel');
    switchRightTab('inspector');
  } else {
    switchRightTab('inspector');
  }
}

// --------------------------------------------------------------------------
// 8. Classroom Event Inspector & Tests
// --------------------------------------------------------------------------
function sendKuchbhiEvent(msg) {
  socket.emit('kuchbhi', msg);
  logEvent('emit: kuchbhi', msg);
  showToast(`Emitted "kuchbhi": "${msg}"`, 'info');
}

function logEvent(name, data) {
  const terminal = document.getElementById('eventsTerminal');
  if (!terminal) return;

  const time = new Date().toLocaleTimeString();
  const entry = document.createElement('div');
  entry.className = 'event-entry';

  const dataStr = typeof data === 'object' ? JSON.stringify(data) : String(data);
  entry.innerHTML = `
    <span class="ev-time">[${time}]</span> <span class="ev-name">${name}:</span> <span class="ev-data">${escapeHtml(dataStr)}</span>
  `;
  terminal.appendChild(entry);
  terminal.scrollTop = terminal.scrollHeight;
}

function clearEventLogs() {
  const terminal = document.getElementById('eventsTerminal');
  if (terminal) terminal.innerHTML = '<div class="text-muted text-xs">Event logs cleared.</div>';
}

function dismissGyanBanner() {
  document.getElementById('gyanKiBaatBanner').style.display = 'none';
}

// --------------------------------------------------------------------------
// 9. Emojis & UI Helpers
// --------------------------------------------------------------------------
function toggleEmojiPicker() {
  document.getElementById('emojiPickerPopover').classList.toggle('hidden');
}

function insertEmoji(emoji) {
  const input = document.getElementById('messageInput');
  input.value += emoji;
  input.focus();
  document.getElementById('emojiPickerPopover').classList.add('hidden');
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
