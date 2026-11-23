// ==========================================================================
// UNSLOPPED CLEAN CHAT CLIENT SCRIPT (LINEAR / VERCEL INSPIRED)
// High-Reliability Socket.IO Client for Web Dev III Assignment 4
// ==========================================================================

const socket = io();

// Client State
let userProfile = {
  name: localStorage.getItem('chat_name') || '',
  handle: localStorage.getItem('chat_handle') || '',
  color: localStorage.getItem('chat_color') || '#3b82f6'
};

let currentRoom = 'general';
let allRooms = [];
let roomUsersMap = {};
let savedNotesList = [];
let isTyping = false;
let typingTimeout = null;

// Clean Muted User Palette
const AVATAR_COLORS = [
  '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b',
  '#ec4899', '#06b6d4', '#64748b', '#6366f1'
];

function getUserAvatarColor(name) {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name) {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// --------------------------------------------------------------------------
// 1. Initialization
// --------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  setupColorSwatches();

  if (userProfile.name) {
    applyProfile();
    registerWithServer();
  } else {
    document.getElementById('profileModal').classList.remove('hidden');
    document.getElementById('inputUsername').focus();
  }

  // Textarea auto-resize
  const textarea = document.getElementById('messageInput');
  textarea.addEventListener('input', () => {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 140) + 'px';
  });

  // Global Keyboard Shortcuts
  document.addEventListener('keydown', (e) => {
    if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && document.activeElement !== textarea)) {
      e.preventDefault();
      document.getElementById('channelSearchInput').focus();
    }
    if (e.key === 'Escape') {
      closeAllModals();
    }
  });
});

// --------------------------------------------------------------------------
// 2. Profile Setup & Management
// --------------------------------------------------------------------------
function setupColorSwatches() {
  document.querySelectorAll('#colorSwatches .swatch').forEach(swatch => {
    swatch.addEventListener('click', () => {
      document.querySelectorAll('#colorSwatches .swatch').forEach(s => s.classList.remove('selected'));
      swatch.classList.add('selected');
      userProfile.color = swatch.dataset.color;
    });
  });
}

function submitUserProfile() {
  const name = document.getElementById('inputUsername').value.trim();
  const handle = document.getElementById('inputHandle').value.trim() || name.toLowerCase().replace(/\s+/g, '');

  if (!name) {
    showToast('Please enter your name');
    document.getElementById('inputUsername').focus();
    return;
  }

  userProfile.name = name;
  userProfile.handle = handle;
  localStorage.setItem('chat_name', userProfile.name);
  localStorage.setItem('chat_handle', userProfile.handle);
  localStorage.setItem('chat_color', userProfile.color);

  document.getElementById('profileModal').classList.add('hidden');
  applyProfile();
  registerWithServer();
  showToast(`Signed in as ${userProfile.name}`);
}

function openProfileModal() {
  document.getElementById('inputUsername').value = userProfile.name;
  document.getElementById('inputHandle').value = userProfile.handle;
  document.getElementById('profileModal').classList.remove('hidden');
}

function applyProfile() {
  document.getElementById('sidebarUserName').textContent = userProfile.name;
  document.getElementById('sidebarUserHandle').textContent = `@${userProfile.handle}`;
  const avatarEl = document.getElementById('sidebarUserAvatar');
  avatarEl.textContent = getInitials(userProfile.name);
  avatarEl.style.backgroundColor = userProfile.color;
}

function registerWithServer() {
  socket.emit('register_user', {
    username: userProfile.name,
    avatar: getInitials(userProfile.name),
    color: userProfile.color
  });

  socket.emit('join_room', { roomName: currentRoom });
}

// --------------------------------------------------------------------------
// 3. Socket.IO Classroom Backend Listeners (100% Preserved)
// --------------------------------------------------------------------------

// Connect
socket.on('connect', () => {
  document.getElementById('statusDot').className = 'status-indicator-dot online';
  document.getElementById('statusLabel').textContent = 'Connected (8080)';
  logMonitor('connect', `Socket ID: ${socket.id}`);

  // Emit classroom event "kuchbhi"
  socket.emit('kuchbhi', 'welcome to client side ');
  logMonitor('emit: kuchbhi', 'welcome to client side ');

  if (userProfile.name) {
    registerWithServer();
  }
});

// Disconnect
socket.on('disconnect', () => {
  document.getElementById('statusDot').className = 'status-indicator-dot';
  document.getElementById('statusLabel').textContent = 'Connecting...';
  logMonitor('disconnect', 'Socket disconnected');
});

// Classroom Event 1: "gyankibaat"
socket.on('gyankibaat', (msg) => {
  console.log('[gyankibaat]:', msg);
  logMonitor('on: gyankibaat', msg);

  const bar = document.getElementById('gyanNoticeBar');
  const text = document.getElementById('gyanNoticeContent');
  if (bar && text) {
    text.textContent = msg;
    bar.style.display = 'flex';
  }

  // Save to saved-notes
  savedNotesList.push({
    id: 'note_' + Date.now(),
    sender: 'System Notice',
    text: `Notice: ${msg}`,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isSystem: true
  });
  document.getElementById('badgeSavedCount').textContent = savedNotesList.length;
});

// Classroom Event 2: "join"
socket.on('join', (msg) => {
  console.log('[join]:', msg);
  logMonitor('on: join', msg);
  renderSystemMessage(msg);
  showToast(msg);
});

// Classroom Event 3: "announcement"
socket.on('announcement', (msg) => {
  console.log('[announcement]:', msg);
  logMonitor('on: announcement', msg);

  const banner = document.getElementById('announcementBanner');
  const text = document.getElementById('announcementText');
  if (banner && text) {
    text.textContent = `"${msg}"`;
    banner.style.display = 'flex';
  }
});

// Active user counter
socket.on('active_users_count', (count) => {
  document.getElementById('activeUsersBadge').textContent = `${count} online`;
  updateHeaderMemberCount(count);
  logMonitor('on: active_users_count', `Active: ${count}`);
});

// --------------------------------------------------------------------------
// 4. Room & Message Socket Listeners
// --------------------------------------------------------------------------
socket.on('rooms_list_update', (rooms) => {
  allRooms = rooms;
  renderChannelsList();
});

socket.on('room_joined', ({ room, history }) => {
  currentRoom = room.name;

  // Header update
  document.getElementById('currentChannelTitle').textContent = room.displayName;
  document.getElementById('currentChannelDesc').textContent = room.description || 'Public channel';
  document.getElementById('currentChannelTag').textContent = room.isPrivate ? 'private' : 'public';
  document.getElementById('messageInput').placeholder = `Message #${room.displayName}... (Enter to send)`;

  // Clear messages container
  const container = document.getElementById('messagesStream');
  container.innerHTML = '';
  renderDateDivider('Today');

  if (history && history.length > 0) {
    history.forEach(msg => renderMessageRow(msg));
  } else {
    renderSystemMessage(`Channel #${room.displayName} ready.`);
  }
  scrollToBottom();

  highlightActiveChannel(room.name);
  logMonitor('on: room_joined', `Joined #${room.displayName}`);
});

socket.on('room_notification', (data) => {
  renderSystemMessage(data.text);
  if (data.userCount) updateHeaderMemberCount(data.userCount);
  logMonitor('on: room_notification', data.text);
});

socket.on('receive_message', (msgObj) => {
  if (msgObj.room === currentRoom) {
    renderMessageRow(msgObj);
    scrollToBottom();
  }
  logMonitor(`on: receive_message [${msgObj.room}]`, `${msgObj.sender}: ${msgObj.text}`);
});

// Typing indicator
socket.on('user_typing', ({ username, roomName }) => {
  if (roomName === currentRoom) {
    const row = document.getElementById('typingIndicatorRow');
    document.getElementById('typingName').textContent = `${username} is typing...`;
    row.classList.remove('hidden');
  }
});

socket.on('user_stop_typing', ({ roomName }) => {
  if (roomName === currentRoom) {
    document.getElementById('typingIndicatorRow').classList.add('hidden');
  }
});

socket.on('room_users_update', (users) => {
  roomUsersMap[currentRoom] = users;
  updateHeaderMemberCount(users.length);
  renderModalMembers(users);
});

socket.on('reaction_updated', ({ messageId, reactions }) => {
  const container = document.getElementById(`reactions-${messageId}`);
  if (container) {
    container.innerHTML = renderReactionsHtml(messageId, reactions);
  }
});

socket.on('error_message', (err) => showToast(err));

// --------------------------------------------------------------------------
// 5. Message Composer & Rendering
// --------------------------------------------------------------------------
function handleComposerKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendCurrentMessage();
  }
}

function handleComposerInput() {
  if (!isTyping) {
    isTyping = true;
    socket.emit('typing', { roomName: currentRoom });
  }

  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    isTyping = false;
    socket.emit('stop_typing', { roomName: currentRoom });
  }, 1200);
}

function sendCurrentMessage() {
  const textarea = document.getElementById('messageInput');
  const text = textarea.value.trim();
  if (!text) return;

  if (currentRoom === 'saved') {
    const note = {
      id: 'note_' + Date.now(),
      sender: userProfile.name,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSystem: false
    };
    savedNotesList.push(note);
    renderMessageRow(note);
    document.getElementById('badgeSavedCount').textContent = savedNotesList.length;
    scrollToBottom();
  } else {
    socket.emit('send_message', {
      message: text,
      roomName: currentRoom
    });
  }

  textarea.value = '';
  textarea.style.height = 'auto';

  socket.emit('stop_typing', { roomName: currentRoom });
  isTyping = false;
  clearTimeout(typingTimeout);
}

function renderMessageRow(msg) {
  const container = document.getElementById('messagesStream');
  const isMe = msg.sender === userProfile.name;
  const avatarColor = msg.color || getUserAvatarColor(msg.sender);

  const row = document.createElement('div');
  row.className = 'message-row';
  row.id = msg.id;

  // Format inline code spans `code`
  const formattedText = formatMessageText(escapeHtml(msg.text));

  row.innerHTML = `
    <div class="message-avatar" style="background-color: ${avatarColor}">
      ${getInitials(msg.sender)}
    </div>
    <div class="message-content">
      <div class="message-meta-row">
        <span class="message-author">${escapeHtml(msg.sender)}</span>
        <span class="message-timestamp">${msg.time}</span>
      </div>
      <div class="message-text">${formattedText}</div>
      <div class="reactions-tray" id="reactions-${msg.id}">
        ${renderReactionsHtml(msg.id, msg.reactions)}
      </div>
    </div>
    <div class="message-toolbar">
      <button class="toolbar-btn" title="React with 👍" onclick="addReaction('${msg.id}', '👍')">👍</button>
      <button class="toolbar-btn" title="React with ❤️" onclick="addReaction('${msg.id}', '❤️')">❤️</button>
      <button class="toolbar-btn" title="React with 🔥" onclick="addReaction('${msg.id}', '🔥')">🔥</button>
      <button class="toolbar-btn" title="React with 🚀" onclick="addReaction('${msg.id}', '🚀')">🚀</button>
    </div>
  `;

  container.appendChild(row);
}

function formatMessageText(text) {
  // Convert `code` to <code>code</code>
  return text.replace(/`([^`]+)`/g, '<code>$1</code>');
}

function renderDateDivider(text) {
  const container = document.getElementById('messagesStream');
  const div = document.createElement('div');
  div.className = 'date-divider';
  div.textContent = text;
  container.appendChild(div);
}

function renderSystemMessage(text) {
  const container = document.getElementById('messagesStream');
  const div = document.createElement('div');
  div.className = 'system-marker';
  div.textContent = `— ${text} —`;
  container.appendChild(div);
  scrollToBottom();
}

function renderReactionsHtml(msgId, reactions = {}) {
  let html = '';
  for (const [emoji, count] of Object.entries(reactions)) {
    if (count > 0) {
      html += `
        <button class="reaction-chip" onclick="addReaction('${msgId}', '${emoji}')">
          <span>${emoji}</span> <span>${count}</span>
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

function insertEmoji(emoji) {
  const textarea = document.getElementById('messageInput');
  textarea.value += emoji;
  textarea.focus();
}

function scrollToBottom() {
  const vp = document.getElementById('messagesViewport');
  vp.scrollTop = vp.scrollHeight;
}

// --------------------------------------------------------------------------
// 6. Channel List & Navigation
// --------------------------------------------------------------------------
function renderChannelsList() {
  const container = document.getElementById('channelsListContainer');
  container.innerHTML = '';

  allRooms.forEach(room => {
    const item = document.createElement('div');
    item.className = `channel-item ${room.name === currentRoom ? 'active' : ''}`;
    item.dataset.room = room.name;
    item.onclick = () => switchRoom(room);

    item.innerHTML = `
      <span class="channel-prefix">${room.isPrivate ? '🔒' : '#'}</span>
      <span class="channel-name">${escapeHtml(room.displayName)}</span>
      <span class="channel-badge">${room.userCount || 1}</span>
    `;

    container.appendChild(item);
  });
}

function switchRoom(room) {
  if (room.name === currentRoom) return;

  if (room.isPrivate && room.hasPassword) {
    const entered = prompt(`Enter password for #${room.displayName}:`);
    if (!entered) return;
    socket.emit('join_room', { roomName: room.name, password: entered });
    return;
  }

  socket.emit('join_room', { roomName: room.name });
  toggleMobileSidebar(false);
}

function highlightActiveChannel(roomName) {
  document.querySelectorAll('.channel-item').forEach(el => {
    el.classList.toggle('active', el.dataset.room === roomName);
  });
}

function openSavedNotes() {
  currentRoom = 'saved';
  document.getElementById('currentChannelTitle').textContent = 'saved-notes';
  document.getElementById('currentChannelDesc').textContent = 'Personal scratchpad, code snippets & server notices';
  document.getElementById('currentChannelTag').textContent = 'personal';
  document.getElementById('messageInput').placeholder = 'Write a saved note... (Enter to save)';

  const container = document.getElementById('messagesStream');
  container.innerHTML = '';
  renderDateDivider('Today');
  renderSystemMessage('Saved Notes: Personal scratchpad (local session).');

  savedNotesList.forEach(note => renderMessageRow(note));
  scrollToBottom();

  highlightActiveChannel('saved');
  toggleMobileSidebar(false);
}

function filterChannelsList() {
  const q = document.getElementById('channelSearchInput').value.toLowerCase().trim();
  document.querySelectorAll('#channelsListContainer .channel-item').forEach(el => {
    const text = el.textContent.toLowerCase();
    el.style.display = text.includes(q) ? 'flex' : 'none';
  });
}

function updateHeaderMemberCount(count) {
  document.getElementById('headerMembersCount').textContent = `${count} member${count > 1 ? 's' : ''}`;
}

// --------------------------------------------------------------------------
// 7. Modals & Actions
// --------------------------------------------------------------------------
function openCreateRoomModal() {
  document.getElementById('inputRoomName').value = '';
  document.getElementById('inputRoomDesc').value = '';
  document.getElementById('checkboxPrivateRoom').checked = false;
  document.getElementById('groupPasswordField').classList.add('hidden');
  document.getElementById('createRoomModal').classList.remove('hidden');
  document.getElementById('inputRoomName').focus();
}

function closeCreateRoomModal() {
  document.getElementById('createRoomModal').classList.add('hidden');
}

function togglePrivateRoomField() {
  const checked = document.getElementById('checkboxPrivateRoom').checked;
  document.getElementById('groupPasswordField').classList.toggle('hidden', !checked);
}

function submitCreateRoom() {
  const name = document.getElementById('inputRoomName').value.trim();
  const desc = document.getElementById('inputRoomDesc').value.trim();
  const isPrivate = document.getElementById('checkboxPrivateRoom').checked;
  const password = document.getElementById('inputRoomPassword').value;

  if (!name || name.length < 2) {
    showToast('Channel name must be at least 2 characters');
    return;
  }

  socket.emit('create_room', { roomName: name, description: desc, isPrivate, password });
  socket.emit('join_room', { roomName: name, password });
  closeCreateRoomModal();
  showToast(`Created channel #${name}`);
}

function openRoomMembersModal() {
  const modal = document.getElementById('roomMembersModal');
  document.getElementById('membersModalTitle').textContent = `#${currentRoom} Members`;
  renderModalMembers(roomUsersMap[currentRoom] || []);
  modal.classList.remove('hidden');
}

function closeRoomMembersModal() {
  document.getElementById('roomMembersModal').classList.add('hidden');
}

function renderModalMembers(users = []) {
  const box = document.getElementById('modalMembersList');
  if (!box) return;
  box.innerHTML = '';

  users.forEach(u => {
    const color = u.color || getUserAvatarColor(u.username);
    const row = document.createElement('div');
    row.className = 'member-row';
    row.innerHTML = `
      <div class="member-avatar-chip" style="background-color: ${color}">
        ${getInitials(u.username)}
      </div>
      <span class="member-name-text">
        ${escapeHtml(u.username)} ${u.username === userProfile.name ? '<small style="color:var(--text-muted);">(you)</small>' : ''}
      </span>
    `;
    box.appendChild(row);
  });
}

function closeAllModals() {
  document.querySelectorAll('.modal-backdrop').forEach(m => {
    if (m.id !== 'profileModal' || userProfile.name) {
      m.classList.add('hidden');
    }
  });
}

function dismissAnnouncement() {
  document.getElementById('announcementBanner').style.display = 'none';
}

function dismissGyanNotice() {
  document.getElementById('gyanNoticeBar').style.display = 'none';
}

function toggleTheme() {
  const isLight = document.body.classList.toggle('theme-light');
  document.getElementById('themeIcon').textContent = isLight ? '🌙' : '☀️';
}

function toggleMobileSidebar(open) {
  document.getElementById('chatSidebar').classList.toggle('mobile-open', open);
}

// --------------------------------------------------------------------------
// 8. Classroom Events & Presentation Tool
// --------------------------------------------------------------------------
function sendClassroomEvent() {
  const msg = `Testing classroom event from ${userProfile.name}`;
  socket.emit('kuchbhi', msg);
  logMonitor('emit: kuchbhi', msg);
  showToast(`Emitted 'kuchbhi' event to server console!`);
}

function openClassroomMonitor() {
  document.getElementById('classroomMonitorModal').classList.remove('hidden');
}

function closeClassroomMonitor() {
  document.getElementById('classroomMonitorModal').classList.add('hidden');
}

function logMonitor(name, data) {
  const terminal = document.getElementById('monitorTerminal');
  if (!terminal) return;

  const time = new Date().toLocaleTimeString();
  const div = document.createElement('div');
  div.className = 'term-line';
  div.innerHTML = `<span class="t-time">[${time}]</span> <span class="t-ev">${name}:</span> <span class="t-msg">${escapeHtml(String(data))}</span>`;
  terminal.appendChild(div);
  terminal.scrollTop = terminal.scrollHeight;
}

// Clean Toast Helper
function showToast(msg) {
  const wrapper = document.getElementById('toastContainer');
  if (!wrapper) return;

  const toast = document.createElement('div');
  toast.className = 'clean-toast';
  toast.textContent = msg;
  wrapper.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 200);
  }, 2600);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
