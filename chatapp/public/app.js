// ==========================================================================
// TELEGRAM WEB CLIENT SCRIPT
// Authentic Telegram WebK / WebA UX with Socket.IO Backend
// ==========================================================================

const socket = io();

// Telegram Client State
let currentUser = {
  name: localStorage.getItem('tg_name') || '',
  handle: localStorage.getItem('tg_handle') || '',
  color: localStorage.getItem('tg_color') || '#e59a4c'
};

let currentFolder = 'all';
let currentRoom = 'general';
let allRooms = [];
let roomUsersMap = {};
let isTypingActive = false;
let typingTimer = null;
let isMuted = false;
let savedMessagesHistory = [];

// Telegram Colors for User Names in Groups
const TG_COLORS = ['#e17076', '#e59a4c', '#997eeb', '#4fad53', '#3ca3e8', '#d978a3', '#e56555'];

function getTelegramColor(name) {
  if (!name) return TG_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TG_COLORS[Math.abs(hash) % TG_COLORS.length];
}

function getInitials(name) {
  if (!name) return 'TG';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Synthesized Telegram Incoming Message Tone
let audioCtx = null;
function playTelegramChime() {
  if (isMuted) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5
    osc.frequency.exponentialRampToValueAtTime(1318.51, audioCtx.currentTime + 0.08); // E6
    gain.gain.setValueAtTime(0.09, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.16);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.16);
  } catch (e) {}
}

// --------------------------------------------------------------------------
// 1. Initialization
// --------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  setupColorPalette();

  if (currentUser.name) {
    applyUserProfile();
    registerWithServer();
  } else {
    document.getElementById('loginModal').classList.remove('hidden');
    document.getElementById('loginUsername').focus();
  }

  // Auto-switch between Mic and Send Plane icon on input
  const textarea = document.getElementById('messageInput');
  textarea.addEventListener('input', () => {
    updateSendButtonState();
    autoResizeTextarea(textarea);
  });

  // Global click to close popovers
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.tg-emoji-wrapper')) {
      document.getElementById('emojiPopover').classList.add('hidden');
    }
    if (!e.target.closest('#btnAttach') && !e.target.closest('#attachMenu')) {
      document.getElementById('attachMenu').classList.add('hidden');
    }
    if (!e.target.closest('#btnHeaderMore') && !e.target.closest('#headerDropdown')) {
      document.getElementById('headerDropdown').classList.add('hidden');
    }
  });
});

// --------------------------------------------------------------------------
// 2. User Sign-In & Profile
// --------------------------------------------------------------------------
function setupColorPalette() {
  document.querySelectorAll('#loginColorPalette .palette-swatch').forEach(swatch => {
    swatch.addEventListener('click', () => {
      document.querySelectorAll('#loginColorPalette .palette-swatch').forEach(s => s.classList.remove('selected'));
      swatch.classList.add('selected');
      currentUser.color = swatch.dataset.color;
    });
  });
}

function submitLogin() {
  const nameInput = document.getElementById('loginUsername').value.trim();
  const handleInput = document.getElementById('loginHandle').value.trim() || nameInput.toLowerCase().replace(/\s+/g, '');

  if (!nameInput) {
    showToast('Please enter your name');
    document.getElementById('loginUsername').focus();
    return;
  }

  currentUser.name = nameInput;
  currentUser.handle = handleInput;
  localStorage.setItem('tg_name', currentUser.name);
  localStorage.setItem('tg_handle', currentUser.handle);
  localStorage.setItem('tg_color', currentUser.color);

  document.getElementById('loginModal').classList.add('hidden');
  applyUserProfile();
  registerWithServer();
  showToast(`Signed in as ${currentUser.name}`);
}

function applyUserProfile() {
  document.getElementById('drawerUsername').textContent = currentUser.name;
  document.getElementById('drawerHandle').textContent = `@${currentUser.handle} • online`;
  const avatarEl = document.getElementById('drawerAvatar');
  avatarEl.textContent = getInitials(currentUser.name);
  avatarEl.style.backgroundColor = currentUser.color;
}

function registerWithServer() {
  socket.emit('register_user', {
    username: currentUser.name,
    avatar: getInitials(currentUser.name),
    color: currentUser.color
  });

  // Default join general chat
  socket.emit('join_room', { roomName: currentRoom });
}

// --------------------------------------------------------------------------
// 3. Socket.IO Classroom Backend Listeners (100% Preserved)
// --------------------------------------------------------------------------

// Connected
socket.on('connect', () => {
  document.getElementById('statusDot').className = 'status-indicator online';
  document.getElementById('statusText').textContent = 'Connected to Telegram Cloud';
  logMonitorEvent('connect', `Socket ID: ${socket.id}`);

  // Send original classroom event "kuchbhi"
  socket.emit('kuchbhi', 'welcome to client side ');
  logMonitorEvent('emit: kuchbhi', 'welcome to client side ');

  if (currentUser.name) {
    registerWithServer();
  }
});

// Disconnected
socket.on('disconnect', () => {
  document.getElementById('statusDot').className = 'status-indicator offline';
  document.getElementById('statusText').textContent = 'Connecting...';
  logMonitorEvent('disconnect', 'Socket disconnected');
});

// Original Classroom Event 1: "gyankibaat"
socket.on('gyankibaat', (msg) => {
  console.log('[gyankibaat]:', msg);
  logMonitorEvent('on: gyankibaat', msg);

  // Store in Telegram "Saved Messages"
  const savedMsg = {
    id: 'saved_' + Date.now(),
    sender: 'Telegram System',
    text: `💡 Gyan Ki Baat from Server: ${msg}`,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isSystem: true
  };
  savedMessagesHistory.push(savedMsg);
  updateChatSnippet('saved_messages', `Telegram: ${msg}`);
  showToast(`New message in Saved Messages`);
});

// Original Classroom Event 2: "join"
socket.on('join', (msg) => {
  console.log('[join]:', msg);
  logMonitorEvent('on: join', msg);
  renderSystemPill(msg);
  showToast(msg);
});

// Original Classroom Event 3: "announcement"
socket.on('announcement', (msg) => {
  console.log('[announcement]:', msg);
  logMonitorEvent('on: announcement', msg);

  // Updates the Telegram Pinned Message Banner
  const banner = document.getElementById('pinnedBar');
  const text = document.getElementById('pinnedMessageText');
  if (banner && text) {
    text.textContent = `"${msg}"`;
    banner.classList.remove('hidden');
  }
});

// Active Users Count (synced with server `count`)
socket.on('active_users_count', (count) => {
  logMonitorEvent('on: active_users_count', `Active: ${count}`);
  updateHeaderMemberCount(count);
});

// --------------------------------------------------------------------------
// 4. Socket.IO Room & Multi-User Handlers
// --------------------------------------------------------------------------

// Rooms list update from server
socket.on('rooms_list_update', (rooms) => {
  allRooms = rooms;
  renderChatsList();
});

// Room joined confirmation
socket.on('room_joined', ({ room, history }) => {
  currentRoom = room.name;

  // Header updates
  document.getElementById('headerChatTitle').textContent = room.displayName;
  document.getElementById('headerAvatarInitials').textContent = getInitials(room.displayName);
  document.getElementById('headerAvatar').style.background = `linear-gradient(135deg, ${getTelegramColor(room.displayName)}, #2481cc)`;

  // Info panel updates
  document.getElementById('infoTitle').textContent = room.displayName;
  document.getElementById('infoAvatar').textContent = getInitials(room.displayName);
  document.getElementById('infoAvatar').style.background = `linear-gradient(135deg, ${getTelegramColor(room.displayName)}, #2481cc)`;
  document.getElementById('infoDescription').textContent = room.description || 'Public group for class discussions.';

  // Clear messages container and render date pill
  const container = document.getElementById('messagesContainer');
  container.innerHTML = '';
  renderDatePill('Today');

  // Load message history
  if (history && history.length > 0) {
    history.forEach(msg => renderMessageBubble(msg));
  } else {
    renderSystemPill(`You joined #${room.displayName}`);
  }
  scrollToBottom();

  highlightActiveChat(room.name);
  logMonitorEvent('on: room_joined', `Joined #${room.displayName}`);
});

// Room notifications (user join/leave)
socket.on('room_notification', (data) => {
  renderSystemPill(data.text);
  if (data.userCount) {
    updateHeaderMemberCount(data.userCount);
  }
  logMonitorEvent('on: room_notification', data.text);
});

// Receive chat message
socket.on('receive_message', (msgObj) => {
  if (msgObj.room === currentRoom) {
    renderMessageBubble(msgObj);
    scrollToBottom();
  }

  // Update snippet in left sidebar
  updateChatSnippet(msgObj.room, `${msgObj.sender}: ${msgObj.text}`);

  if (msgObj.sender !== currentUser.name) {
    playTelegramChime();
  }
  logMonitorEvent(`on: receive_message [${msgObj.room}]`, `${msgObj.sender}: ${msgObj.text}`);
});

// Typing indicator
socket.on('user_typing', ({ username, roomName }) => {
  if (roomName === currentRoom) {
    const bar = document.getElementById('typingBar');
    document.getElementById('typingText').textContent = `${username} is typing...`;
    bar.classList.remove('hidden');

    // Update snippet to typing in left sidebar
    const snippetEl = document.querySelector(`.tg-chat-item[data-room="${roomName}"] .chat-snippet`);
    if (snippetEl) {
      snippetEl.innerHTML = `<span class="chat-snippet typing">${username} is typing...</span>`;
    }
  }
});

socket.on('user_stop_typing', ({ roomName }) => {
  if (roomName === currentRoom) {
    document.getElementById('typingBar').classList.add('hidden');
  }
});

// Room users update
socket.on('room_users_update', (users) => {
  roomUsersMap[currentRoom] = users;
  renderInfoMembersList(users);
  updateHeaderMemberCount(users.length);
});

// Reaction updated
socket.on('reaction_updated', ({ messageId, reactions }) => {
  const container = document.getElementById(`reactions-${messageId}`);
  if (container) {
    container.innerHTML = renderReactionsHtml(messageId, reactions);
  }
});

// Error message
socket.on('error_message', (err) => {
  showToast(err);
});

// --------------------------------------------------------------------------
// 5. Message Rendering & Sending
// --------------------------------------------------------------------------
function handleSendButtonClick() {
  const input = document.getElementById('messageInput');
  const text = input.value.trim();
  if (text) {
    sendMessage(text);
  } else {
    showToast('Hold to record voice message (demo)');
  }
}

function handleKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    const text = e.target.value.trim();
    if (text) {
      sendMessage(text);
    }
  }
}

function handleInput() {
  if (!isTypingActive) {
    isTypingActive = true;
    socket.emit('typing', { roomName: currentRoom });
  }

  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => {
    isTypingActive = false;
    socket.emit('stop_typing', { roomName: currentRoom });
  }, 1200);
}

function updateSendButtonState() {
  const text = document.getElementById('messageInput').value.trim();
  const iconSend = document.querySelector('.icon-send');
  const iconMic = document.querySelector('.icon-mic');

  if (text.length > 0) {
    iconSend.classList.remove('hidden');
    iconMic.classList.add('hidden');
  } else {
    iconSend.classList.add('hidden');
    iconMic.classList.remove('hidden');
  }
}

function autoResizeTextarea(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
}

function sendMessage(text) {
  if (currentRoom === 'saved_messages') {
    // Local Saved Messages feature
    const msgObj = {
      id: 'saved_' + Date.now(),
      sender: currentUser.name,
      avatar: getInitials(currentUser.name),
      color: currentUser.color,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOut: true
    };
    savedMessagesHistory.push(msgObj);
    renderMessageBubble(msgObj);
    updateChatSnippet('saved_messages', text);
    scrollToBottom();
  } else {
    // Send to Socket.IO room
    socket.emit('send_message', {
      message: text,
      roomName: currentRoom
    });
  }

  const input = document.getElementById('messageInput');
  input.value = '';
  input.style.height = 'auto';
  updateSendButtonState();

  // Stop typing
  socket.emit('stop_typing', { roomName: currentRoom });
  isTypingActive = false;
  clearTimeout(typingTimer);
}

function renderMessageBubble(msg) {
  const container = document.getElementById('messagesContainer');
  const isOut = msg.sender === currentUser.name || msg.isOut;

  const row = document.createElement('div');
  row.className = `tg-message-row ${isOut ? 'out' : 'in'}`;
  row.id = msg.id;

  // Incoming group messages show avatar
  let avatarHtml = '';
  if (!isOut) {
    const avatarColor = msg.color || getTelegramColor(msg.sender);
    avatarHtml = `
      <div class="tg-msg-avatar" style="background-color: ${avatarColor}">
        ${getInitials(msg.sender)}
      </div>
    `;
  }

  // Sender name (only for incoming in groups)
  let senderNameHtml = '';
  if (!isOut && currentRoom !== 'saved_messages') {
    const nameColor = msg.color || getTelegramColor(msg.sender);
    senderNameHtml = `<div class="tg-sender-name" style="color: ${nameColor}">${escapeHtml(msg.sender)}</div>`;
  }

  // Checkmark for outgoing messages
  const checkHtml = isOut ? `<span class="tg-check-icon">✓✓</span>` : '';

  row.innerHTML = `
    ${avatarHtml}
    <div class="tg-bubble">
      ${senderNameHtml}
      <span class="tg-msg-text">${escapeHtml(msg.text)}</span>
      <div class="tg-bubble-meta">
        <span class="tg-msg-time">${msg.time}</span>
        ${checkHtml}
      </div>
      <div class="tg-bubble-reactions" id="reactions-${msg.id}">
        ${renderReactionsHtml(msg.id, msg.reactions)}
      </div>
    </div>
    <div class="tg-hover-reactions">
      <button class="tg-reaction-btn" onclick="sendReaction('${msg.id}', '👍')">👍</button>
      <button class="tg-reaction-btn" onclick="sendReaction('${msg.id}', '❤️')">❤️</button>
      <button class="tg-reaction-btn" onclick="sendReaction('${msg.id}', '🔥')">🔥</button>
      <button class="tg-reaction-btn" onclick="sendReaction('${msg.id}', '😂')">😂</button>
      <button class="tg-reaction-btn" onclick="sendReaction('${msg.id}', '👏')">👏</button>
    </div>
  `;

  container.appendChild(row);
}

function renderDatePill(text) {
  const container = document.getElementById('messagesContainer');
  const pill = document.createElement('div');
  pill.className = 'tg-date-pill';
  pill.textContent = text;
  container.appendChild(pill);
}

function renderSystemPill(text) {
  const container = document.getElementById('messagesContainer');
  const pill = document.createElement('div');
  pill.className = 'tg-system-pill';
  pill.textContent = text;
  container.appendChild(pill);
  scrollToBottom();
}

function renderReactionsHtml(msgId, reactions = {}) {
  let html = '';
  for (const [emoji, count] of Object.entries(reactions)) {
    if (count > 0) {
      html += `
        <button class="tg-reaction-chip" onclick="sendReaction('${msgId}', '${emoji}')">
          <span>${emoji}</span> <span>${count}</span>
        </button>
      `;
    }
  }
  return html;
}

function sendReaction(messageId, emoji) {
  socket.emit('add_reaction', {
    roomName: currentRoom,
    messageId,
    emoji
  });
}

function scrollToBottom() {
  const vp = document.getElementById('messagesViewport');
  vp.scrollTop = vp.scrollHeight;
}

// --------------------------------------------------------------------------
// 6. Sidebar Chats List & Folders
// --------------------------------------------------------------------------
function renderChatsList() {
  const container = document.getElementById('chatsList');
  container.innerHTML = '';

  // 1. Saved Messages (Telegram special pinned chat)
  const savedItem = document.createElement('div');
  savedItem.className = `tg-chat-item ${currentRoom === 'saved_messages' ? 'active' : ''}`;
  savedItem.dataset.room = 'saved_messages';
  savedItem.onclick = () => openSavedMessages();

  savedItem.innerHTML = `
    <div class="chat-avatar-wrapper">
      <div class="tg-avatar" style="background: linear-gradient(135deg, #2AABEE, #229ED9);">🔖</div>
    </div>
    <div class="chat-item-content">
      <div class="chat-item-top">
        <span class="chat-title">Saved Messages</span>
        <span class="chat-time">Today</span>
      </div>
      <div class="chat-item-bottom">
        <span class="chat-snippet" id="snippet-saved_messages">Personal cloud notes & system notices</span>
        <span class="chat-badge">📌</span>
      </div>
    </div>
  `;
  container.appendChild(savedItem);

  // 2. Server Rooms
  allRooms.forEach(room => {
    const item = document.createElement('div');
    item.className = `tg-chat-item ${room.name === currentRoom ? 'active' : ''}`;
    item.dataset.room = room.name;
    item.onclick = () => selectChatRoom(room);

    const avatarColor = getTelegramColor(room.displayName);
    const initials = getInitials(room.displayName);

    item.innerHTML = `
      <div class="chat-avatar-wrapper">
        <div class="tg-avatar" style="background: linear-gradient(135deg, ${avatarColor}, #17212b);">${initials}</div>
        <span class="avatar-online-dot"></span>
      </div>
      <div class="chat-item-content">
        <div class="chat-item-top">
          <div class="chat-title-group">
            <span class="chat-title">${escapeHtml(room.displayName)}</span>
            ${room.isPrivate ? '<span>🔒</span>' : ''}
          </div>
          <span class="chat-time">12:44</span>
        </div>
        <div class="chat-item-bottom">
          <span class="chat-snippet" id="snippet-${room.name}">${escapeHtml(room.description || 'Tap to start conversation')}</span>
          <span class="chat-badge">${room.userCount || 1}</span>
        </div>
      </div>
    `;

    container.appendChild(item);
  });

  document.getElementById('allChatsBadge').textContent = allRooms.length + 1;
}

function selectChatRoom(room) {
  if (room.name === currentRoom) return;

  if (room.isPrivate && room.hasPassword) {
    const entered = prompt(`Enter password for #${room.displayName}:`);
    if (!entered) return;
    socket.emit('join_room', { roomName: room.name, password: entered });
    return;
  }

  socket.emit('join_room', { roomName: room.name });
  toggleMobileView(true);
}

function openSavedMessages() {
  currentRoom = 'saved_messages';
  document.getElementById('headerChatTitle').textContent = 'Saved Messages';
  document.getElementById('headerAvatarInitials').textContent = '🔖';
  document.getElementById('headerAvatar').style.background = 'linear-gradient(135deg, #2AABEE, #229ED9)';
  document.getElementById('headerChatSubtitle').textContent = 'My Personal Cloud Notes';

  const container = document.getElementById('messagesContainer');
  container.innerHTML = '';
  renderDatePill('Today');
  renderSystemPill('Saved Messages: Forward here to save, or view system notices.');

  savedMessagesHistory.forEach(msg => renderMessageBubble(msg));
  scrollToBottom();
  highlightActiveChat('saved_messages');
  toggleMobileView(true);
}

function highlightActiveChat(roomName) {
  document.querySelectorAll('.tg-chat-item').forEach(item => {
    item.classList.toggle('active', item.dataset.room === roomName);
  });
}

function updateChatSnippet(roomName, snippet) {
  const el = document.getElementById(`snippet-${roomName}`);
  if (el) {
    el.textContent = snippet;
  }
}

function updateHeaderMemberCount(count) {
  const sub = document.getElementById('headerChatSubtitle');
  if (currentRoom === 'saved_messages') {
    sub.textContent = 'Personal Cloud';
    return;
  }
  sub.textContent = `${count} member${count > 1 ? 's' : ''}, ${Math.max(1, count)} online`;
  document.getElementById('infoSubtitle').textContent = `${count} members`;
  document.getElementById('infoMembersNum').textContent = count;
}

function switchFolder(folder) {
  currentFolder = folder;
  document.querySelectorAll('.tg-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.folder === folder);
  });
  renderChatsList();
}

function handleSearchChats() {
  const q = document.getElementById('chatSearchInput').value.toLowerCase().trim();
  const clearBtn = document.getElementById('btnSearchClear');
  clearBtn.classList.toggle('hidden', q.length === 0);

  document.querySelectorAll('.tg-chat-item').forEach(item => {
    const text = item.textContent.toLowerCase();
    item.style.display = text.includes(q) ? 'flex' : 'none';
  });
}

function clearSearch() {
  document.getElementById('chatSearchInput').value = '';
  document.getElementById('btnSearchClear').classList.add('hidden');
  document.querySelectorAll('.tg-chat-item').forEach(item => item.style.display = 'flex');
}

// --------------------------------------------------------------------------
// 7. Modals, Drawers & Menus
// --------------------------------------------------------------------------
function toggleDrawer(open) {
  document.getElementById('drawerOverlay').classList.toggle('hidden', !open);
}

function openProfileDrawer() {
  document.getElementById('infoPanel').classList.remove('hidden');
}

function closeProfileDrawer() {
  document.getElementById('infoPanel').classList.add('hidden');
}

function toggleHeaderMenu() {
  document.getElementById('headerDropdown').classList.toggle('hidden');
}

function toggleAttachMenu() {
  document.getElementById('attachMenu').classList.toggle('hidden');
}

function toggleEmojiPicker() {
  document.getElementById('emojiPopover').classList.toggle('hidden');
}

function insertEmoji(emoji) {
  const input = document.getElementById('messageInput');
  input.value += emoji;
  input.focus();
  updateSendButtonState();
  document.getElementById('emojiPopover').classList.add('hidden');
}

function sendAttachment(type) {
  document.getElementById('attachMenu').classList.add('hidden');
  const emoji = type === 'photo' ? '📷 Photo' : type === 'file' ? '📄 Document' : '📊 Poll';
  sendMessage(`[Attached ${emoji}]`);
}

function openNewGroupModal() {
  document.getElementById('modalGroupTypeTitle').textContent = 'New Group';
  document.getElementById('modalGroupName').value = '';
  document.getElementById('modalGroupDesc').value = '';
  document.getElementById('modalGroupPrivate').checked = false;
  document.getElementById('modalPasswordGroup').classList.add('hidden');
  document.getElementById('newGroupModal').classList.remove('hidden');
  document.getElementById('modalGroupName').focus();
}

function openNewChannelModal() {
  document.getElementById('modalGroupTypeTitle').textContent = 'New Broadcast Channel';
  document.getElementById('modalGroupName').value = '';
  document.getElementById('modalGroupDesc').value = '';
  document.getElementById('modalGroupPrivate').checked = false;
  document.getElementById('modalPasswordGroup').classList.add('hidden');
  document.getElementById('newGroupModal').classList.remove('hidden');
  document.getElementById('modalGroupName').focus();
}

function closeNewGroupModal() {
  document.getElementById('newGroupModal').classList.add('hidden');
}

function togglePrivateGroupPassword() {
  const isPrivate = document.getElementById('modalGroupPrivate').checked;
  document.getElementById('modalPasswordGroup').classList.toggle('hidden', !isPrivate);
}

function submitCreateGroup() {
  const name = document.getElementById('modalGroupName').value.trim();
  const desc = document.getElementById('modalGroupDesc').value.trim();
  const isPrivate = document.getElementById('modalGroupPrivate').checked;
  const password = document.getElementById('modalGroupPassword').value;

  if (!name || name.length < 2) {
    showToast('Name must be at least 2 characters');
    return;
  }

  socket.emit('create_room', {
    roomName: name,
    description: desc,
    isPrivate,
    password
  });

  socket.emit('join_room', { roomName: name, password });
  closeNewGroupModal();
  showToast(`Group "${name}" created!`);
}

function toggleMuteChat() {
  isMuted = !isMuted;
  document.getElementById('infoNotifyToggle').checked = !isMuted;
  document.getElementById('muteMenuItemText').textContent = isMuted ? 'Unmute Notifications' : 'Mute Notifications';
  showToast(isMuted ? 'Notifications muted' : 'Notifications unmuted');
  document.getElementById('headerDropdown').classList.add('hidden');
}

function leaveCurrentRoom() {
  if (currentRoom === 'general') {
    showToast('Cannot leave #general');
    return;
  }
  socket.emit('join_room', { roomName: 'general' });
  showToast('Returned to #general');
  document.getElementById('headerDropdown').classList.add('hidden');
}

function toggleTheme() {
  const isLight = document.body.classList.toggle('theme-light');
  document.getElementById('themeIcon').textContent = isLight ? '☀️' : '🌙';
  document.getElementById('themeText').textContent = isLight ? 'Day Mode' : 'Night Mode';
}

function toggleMobileView(inChat) {
  document.getElementById('telegramApp').classList.toggle('chat-open', inChat);
}

function focusSearch() {
  document.getElementById('chatSearchInput').focus();
}

function dismissPinned(e) {
  if (e) e.stopPropagation();
  document.getElementById('pinnedBar').classList.add('hidden');
}

function scrollToAnnouncement() {
  showToast('Announcement pinned to top of conversation');
}

// --------------------------------------------------------------------------
// 8. Classroom Events & Presentation Helpers
// --------------------------------------------------------------------------
function sendTestKuchbhi() {
  const testMsg = `Hello from ${currentUser.name} via Telegram Web`;
  socket.emit('kuchbhi', testMsg);
  logMonitorEvent('emit: kuchbhi', testMsg);
  showToast(`Emitted "kuchbhi" to server terminal!`);
  document.getElementById('headerDropdown').classList.add('hidden');
}

function openClassroomMonitor() {
  document.getElementById('classroomMonitorModal').classList.remove('hidden');
}

function closeClassroomMonitor() {
  document.getElementById('classroomMonitorModal').classList.add('hidden');
}

function logMonitorEvent(name, data) {
  const terminal = document.getElementById('monitorTerminal');
  if (!terminal) return;

  const time = new Date().toLocaleTimeString();
  const line = document.createElement('div');
  line.className = 'monitor-line';
  line.innerHTML = `<span class="m-time">[${time}]</span> <span class="m-ev">${name}:</span> <span class="m-val">${escapeHtml(String(data))}</span>`;
  terminal.appendChild(line);
  terminal.scrollTop = terminal.scrollHeight;
}

function renderInfoMembersList(users = []) {
  const list = document.getElementById('infoMembersList');
  if (!list) return;
  list.innerHTML = '';

  users.forEach(u => {
    const item = document.createElement('div');
    item.className = 'tg-member-item';
    const color = u.color || getTelegramColor(u.username);

    item.innerHTML = `
      <div class="tg-member-avatar" style="background-color: ${color}">
        ${getInitials(u.username)}
      </div>
      <div class="tg-member-info">
        <span class="tg-member-name">${escapeHtml(u.username)} ${u.username === currentUser.name ? '(you)' : ''}</span>
        <span class="tg-member-status">online</span>
      </div>
    `;
    list.appendChild(item);
  });
}

function openSettingsModal() {
  document.getElementById('loginModal').classList.remove('hidden');
}

// Toast Helper
function showToast(msg) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'tg-toast';
  toast.textContent = msg;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 250);
  }, 3000);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
