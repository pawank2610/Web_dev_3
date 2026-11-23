// ==========================================================================
// OMNICHAT CLIENT LOGIC
// The Social Hybrid Messenger (WhatsApp • Instagram • Telegram)
// ==========================================================================

const socket = io();

// User State
let currentUser = {
  name: localStorage.getItem('omni_name') || '',
  handle: localStorage.getItem('omni_handle') || '',
  bio: localStorage.getItem('omni_bio') || 'Web Dev III Student',
  color: localStorage.getItem('omni_color') || '#833ab4'
};

let currentTab = 'all';
let currentRoom = 'general';
let allRooms = [];
let roomUsersMap = {};
let isMuted = false;
let typingTimeout = null;
let isTyping = false;
let savedNotesHistory = [];

// Simulated Live Stories / Statuses (Instagram Style)
const STORIES_DATA = [
  {
    id: 'prof_webdev',
    name: 'Prof. WebDev',
    avatar: '👨‍🏫',
    color: '#0088cc',
    time: '1h ago',
    caption: '📌 Upcoming Monday: Assignment 4 Presentations start! Be ready with your Socket.IO live demos.',
    viewed: false
  },
  {
    id: 'rahul_s',
    name: 'Rahul S.',
    avatar: 'RS',
    color: '#25d366',
    time: '2h ago',
    caption: 'Testing multi-user chat rooms between two devices right now 🚀🔥',
    viewed: false
  },
  {
    id: 'aisha_k',
    name: 'Aisha K.',
    avatar: 'AK',
    color: '#ff007f',
    time: '3h ago',
    caption: 'Web Dev III Unit 3 is finally wrapped up! Proud of our project 🎉🎓',
    viewed: false
  },
  {
    id: 'tech_club',
    name: 'Tech Club',
    avatar: '⚡',
    color: '#ff7b00',
    time: '5h ago',
    caption: 'Workshop on Real-Time WebSockets & Node.js this Friday! Everyone welcome 💻',
    viewed: false
  }
];

let activeStoryIndex = 0;
let storyProgressInterval = null;

function getInitials(name) {
  if (!name) return 'OC';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// User name colors for group chats
const USER_ACCENT_COLORS = ['#f43f5e', '#ec4899', '#d946ef', '#a855f7', '#6366f1', '#3b82f6', '#0ea5e9', '#10b981', '#f59e0b'];
function getUserColor(name) {
  if (!name) return USER_ACCENT_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return USER_ACCENT_COLORS[Math.abs(hash) % USER_ACCENT_COLORS.length];
}

// Web Audio API Synthesizer (Modern Messenger Notification Sound)
let audioCtx = null;
function playMessengerChime() {
  if (isMuted) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
    osc.frequency.exponentialRampToValueAtTime(1046.50, audioCtx.currentTime + 0.08); // C6
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
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
  setupColorSwatches();
  renderStoriesBar();

  if (currentUser.name) {
    applyProfile();
    registerUserWithServer();
  } else {
    document.getElementById('profileModal').classList.remove('hidden');
    document.getElementById('inputUsername').focus();
  }

  // Textarea input watcher
  const textarea = document.getElementById('messageInput');
  textarea.addEventListener('input', () => {
    updateSendButtonState();
    autoResizeTextarea(textarea);
  });

  // Global listener to close popovers
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.emoji-wrapper')) {
      document.getElementById('emojiTray').classList.add('hidden');
    }
    if (!e.target.closest('#btnAttach') && !e.target.closest('#attachPopover')) {
      document.getElementById('attachPopover').classList.add('hidden');
    }
    if (!e.target.closest('#btnHeaderMenu') && !e.target.closest('#headerDropdown')) {
      document.getElementById('headerDropdown').classList.add('hidden');
    }
  });
});

// --------------------------------------------------------------------------
// 2. Profile & Sign In Setup
// --------------------------------------------------------------------------
function setupColorSwatches() {
  document.querySelectorAll('#modalColorSwatches .color-swatch').forEach(swatch => {
    swatch.addEventListener('click', () => {
      document.querySelectorAll('#modalColorSwatches .color-swatch').forEach(s => s.classList.remove('selected'));
      swatch.classList.add('selected');
      currentUser.color = swatch.dataset.color;
    });
  });
}

function submitProfile() {
  const name = document.getElementById('inputUsername').value.trim();
  const handle = document.getElementById('inputHandle').value.trim() || name.toLowerCase().replace(/\s+/g, '');
  const bio = document.getElementById('inputBio').value.trim();

  if (!name) {
    showToast('Please enter your name');
    document.getElementById('inputUsername').focus();
    return;
  }

  currentUser.name = name;
  currentUser.handle = handle;
  currentUser.bio = bio;

  localStorage.setItem('omni_name', currentUser.name);
  localStorage.setItem('omni_handle', currentUser.handle);
  localStorage.setItem('omni_bio', currentUser.bio);
  localStorage.setItem('omni_color', currentUser.color);

  document.getElementById('profileModal').classList.add('hidden');
  applyProfile();
  registerUserWithServer();
  showToast(`Welcome to OmniChat, ${currentUser.name}!`);
}

function openProfileModal() {
  document.getElementById('inputUsername').value = currentUser.name;
  document.getElementById('inputHandle').value = currentUser.handle;
  document.getElementById('inputBio').value = currentUser.bio;
  document.getElementById('modalPreviewAvatar').textContent = getInitials(currentUser.name);
  document.getElementById('profileModal').classList.remove('hidden');
}

function applyProfile() {
  document.getElementById('myStoryAvatar').textContent = getInitials(currentUser.name);
}

function registerUserWithServer() {
  socket.emit('register_user', {
    username: currentUser.name,
    avatar: getInitials(currentUser.name),
    color: currentUser.color
  });

  socket.emit('join_room', { roomName: currentRoom });
}

// --------------------------------------------------------------------------
// 3. Instagram Stories Bar & Viewer
// --------------------------------------------------------------------------
function renderStoriesBar() {
  const container = document.getElementById('dynamicStoriesList');
  container.innerHTML = '';

  STORIES_DATA.forEach((s, idx) => {
    const item = document.createElement('div');
    item.className = 'story-item';
    item.onclick = () => openStoryViewer(idx);

    item.innerHTML = `
      <div class="story-ring ${s.viewed ? 'viewed' : 'unread'}">
        <div class="story-avatar" style="background: ${s.color}">${s.avatar}</div>
      </div>
      <span class="story-name">${escapeHtml(s.name)}</span>
    `;

    container.appendChild(item);
  });
}

function openMyStory() {
  const myStory = {
    name: currentUser.name || 'You',
    avatar: getInitials(currentUser.name),
    time: 'Just now',
    caption: `"${currentUser.bio}" 🚀 (Connected to Web Dev III OmniChat)`
  };
  displayStoryCard(myStory);
}

function openStoryViewer(index) {
  activeStoryIndex = index;
  const s = STORIES_DATA[index];
  s.viewed = true;
  renderStoriesBar();

  displayStoryCard({
    name: s.name,
    avatar: s.avatar,
    time: s.time,
    caption: s.caption
  });
}

function displayStoryCard({ name, avatar, time, caption }) {
  document.getElementById('storyAuthorName').textContent = name;
  document.getElementById('storyAuthorAvatar').textContent = avatar;
  document.getElementById('storyTimeAgo').textContent = time;
  document.getElementById('storyCaption').textContent = caption;

  const modal = document.getElementById('storyViewerModal');
  modal.classList.remove('hidden');

  // Animated progress bar (5 seconds)
  const fill = document.getElementById('storyProgressFill');
  fill.style.transition = 'none';
  fill.style.width = '0%';

  setTimeout(() => {
    fill.style.transition = 'width 5s linear';
    fill.style.width = '100%';
  }, 50);

  clearInterval(storyProgressInterval);
  storyProgressInterval = setTimeout(() => {
    closeStoryViewer();
  }, 5100);
}

function closeStoryViewer() {
  clearInterval(storyProgressInterval);
  document.getElementById('storyViewerModal').classList.add('hidden');
}

function handleStoryReplyKeydown(e) {
  if (e.key === 'Enter') {
    const val = e.target.value.trim();
    if (val) {
      showToast(`Replied to story: "${val}"`);
      e.target.value = '';
      closeStoryViewer();
    }
  }
}

function sendStoryHeart() {
  showToast('Liked story ❤️');
  closeStoryViewer();
}

// --------------------------------------------------------------------------
// 4. Classroom Backend Listeners (100% Preserved)
// --------------------------------------------------------------------------

// Connect
socket.on('connect', () => {
  document.getElementById('statusDot').className = 'status-indicator-dot online';
  document.getElementById('statusText').textContent = 'OmniChat Connected • Port 8080';
  logMonitor('connect', `Connected to ws://localhost:8080 (ID: ${socket.id})`);

  // Original classroom event: emit "kuchbhi"
  socket.emit('kuchbhi', 'welcome to client side ');
  logMonitor('emit: kuchbhi', 'welcome to client side ');

  if (currentUser.name) registerUserWithServer();
});

// Disconnect
socket.on('disconnect', () => {
  document.getElementById('statusDot').className = 'status-indicator-dot';
  document.getElementById('statusText').textContent = 'Connecting to server...';
  logMonitor('disconnect', 'Socket disconnected');
});

// Event 1: "gyankibaat" -> Rendered in WhatsApp-style info card + Saved Notes
socket.on('gyankibaat', (msg) => {
  console.log('[gyankibaat]:', msg);
  logMonitor('on: gyankibaat', msg);

  const card = document.getElementById('gyanKiBaatCard');
  const text = document.getElementById('gyanKiBaatText');
  if (card && text) {
    text.textContent = msg;
    card.style.display = 'flex';
  }

  savedNotesHistory.push({
    id: 'note_' + Date.now(),
    sender: 'OmniChat Cloud',
    text: `💡 Gyan Ki Baat from Server: ${msg}`,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isOut: false
  });
});

// Event 2: "join" -> System notification pill
socket.on('join', (msg) => {
  console.log('[join]:', msg);
  logMonitor('on: join', msg);
  renderSystemEvent(msg);
  showToast(msg);
});

// Event 3: "announcement" -> Pinned banner at top
socket.on('announcement', (msg) => {
  console.log('[announcement]:', msg);
  logMonitor('on: announcement', msg);

  const banner = document.getElementById('pinnedBanner');
  const text = document.getElementById('pinnedAnnouncementText');
  if (banner && text) {
    text.textContent = `"${msg}"`;
    banner.classList.remove('hidden');
  }
});

// Active user count
socket.on('active_users_count', (count) => {
  document.getElementById('activeUsersPill').textContent = `Active: ${count}`;
  updateHeaderCounts(count);
  logMonitor('on: active_users_count', `Active: ${count}`);
});

// --------------------------------------------------------------------------
// 5. Rooms & Chat Socket Listeners
// --------------------------------------------------------------------------
socket.on('rooms_list_update', (rooms) => {
  allRooms = rooms;
  renderChatsList();
});

socket.on('room_joined', ({ room, history }) => {
  currentRoom = room.name;

  document.getElementById('headerChatTitle').textContent = room.displayName;
  document.getElementById('headerAvatar').textContent = getInitials(room.displayName);

  // Clear messages container
  const container = document.getElementById('messagesStream');
  container.innerHTML = '';
  renderDateDivider('Today');

  if (history && history.length > 0) {
    history.forEach(msg => renderMessageBubble(msg));
  } else {
    renderSystemEvent(`You joined #${room.displayName}`);
  }
  scrollToBottom();

  highlightActiveCard(room.name);
  logMonitor('on: room_joined', `Joined #${room.displayName}`);
});

socket.on('room_notification', (data) => {
  renderSystemEvent(data.text);
  if (data.userCount) updateHeaderCounts(data.userCount);
  logMonitor('on: room_notification', data.text);
});

socket.on('receive_message', (msgObj) => {
  if (msgObj.room === currentRoom) {
    renderMessageBubble(msgObj);
    scrollToBottom();
  }

  updateCardSnippet(msgObj.room, `${msgObj.sender}: ${msgObj.text}`);

  if (msgObj.sender !== currentUser.name) {
    playMessengerChime();
  }
  logMonitor(`on: receive_message [${msgObj.room}]`, `${msgObj.sender}: ${msgObj.text}`);
});

// Typing indicator
socket.on('user_typing', ({ username, roomName }) => {
  if (roomName === currentRoom) {
    const bar = document.getElementById('typingPillBar');
    document.getElementById('typingUsername').textContent = username;
    document.getElementById('typingAvatar').textContent = getInitials(username);
    bar.classList.remove('hidden');
  }
});

socket.on('user_stop_typing', ({ roomName }) => {
  if (roomName === currentRoom) {
    document.getElementById('typingPillBar').classList.add('hidden');
  }
});

// Room users update
socket.on('room_users_update', (users) => {
  roomUsersMap[currentRoom] = users;
  updateHeaderCounts(users.length);
  renderDetailsMembers(users);
});

// Reaction updated
socket.on('reaction_updated', ({ messageId, reactions }) => {
  const container = document.getElementById(`reactions-${messageId}`);
  if (container) {
    container.innerHTML = renderReactionsHtml(messageId, reactions);
  }
});

socket.on('error_message', (err) => showToast(err));

// --------------------------------------------------------------------------
// 6. Message Rendering & Interactive Features (Heart Pop & Voice Memo)
// --------------------------------------------------------------------------
function handleComposerKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    const text = e.target.value.trim();
    if (text) sendTextMessage(text);
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

function handleSendActionClick() {
  const input = document.getElementById('messageInput');
  const text = input.value.trim();
  if (text) {
    sendTextMessage(text);
  } else {
    // Simulated WhatsApp Voice Note
    sendVoiceMemo();
  }
}

function sendTextMessage(text) {
  if (currentRoom === 'saved') {
    const note = {
      id: 'saved_' + Date.now(),
      sender: currentUser.name,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOut: true
    };
    savedNotesHistory.push(note);
    renderMessageBubble(note);
    updateCardSnippet('saved', text);
    scrollToBottom();
  } else {
    socket.emit('send_message', {
      message: text,
      roomName: currentRoom
    });
  }

  const input = document.getElementById('messageInput');
  input.value = '';
  input.style.height = 'auto';
  updateSendButtonState();

  socket.emit('stop_typing', { roomName: currentRoom });
  isTyping = false;
  clearTimeout(typingTimeout);
}

function sendVoiceMemo() {
  const voiceMsg = `🎙️ Voice Note (0:12)`;
  socket.emit('send_message', {
    message: voiceMsg,
    roomName: currentRoom,
    isVoice: true
  });
  showToast('Sent voice note');
}

function renderMessageBubble(msg) {
  const container = document.getElementById('messagesStream');
  const isOut = msg.sender === currentUser.name || msg.isOut;

  const row = document.createElement('div');
  row.className = `msg-row ${isOut ? 'out' : 'in'}`;
  row.id = msg.id;

  // Incoming avatar
  let avatarHtml = '';
  if (!isOut) {
    const color = msg.color || getUserColor(msg.sender);
    avatarHtml = `<div class="msg-sender-avatar" style="background:${color}">${getInitials(msg.sender)}</div>`;
  }

  // Author name in groups
  let authorHtml = '';
  if (!isOut && currentRoom !== 'saved') {
    const color = msg.color || getUserColor(msg.sender);
    authorHtml = `<div class="msg-author-name" style="color:${color}">${escapeHtml(msg.sender)}</div>`;
  }

  // Checkmarks for outgoing (WhatsApp double ticks)
  const ticksHtml = isOut ? `<span class="wa-ticks">✓✓</span>` : '';

  // Check if voice note
  let contentHtml = `<span class="msg-text">${escapeHtml(msg.text)}</span>`;
  if (msg.text.includes('🎙️ Voice Note')) {
    contentHtml = `
      <div class="voice-note-widget">
        <button class="voice-play-btn" onclick="playVoiceMemoDemo(this)">▶</button>
        <div class="voice-waveform">
          <div class="voice-bar" style="height:8px;"></div>
          <div class="voice-bar" style="height:14px;"></div>
          <div class="voice-bar" style="height:20px;"></div>
          <div class="voice-bar" style="height:12px;"></div>
          <div class="voice-bar" style="height:18px;"></div>
          <div class="voice-bar" style="height:9px;"></div>
          <div class="voice-bar" style="height:15px;"></div>
        </div>
        <small style="color:rgba(255,255,255,0.7);font-size:0.7rem;">0:12</small>
      </div>
    `;
  }

  row.innerHTML = `
    ${avatarHtml}
    <div class="msg-bubble" ondblclick="handleMessageDoubleTap('${msg.id}', this)">
      ${authorHtml}
      ${contentHtml}
      <div class="msg-meta">
        <span>${msg.time}</span>
        ${ticksHtml}
      </div>
      <div class="attached-reactions" id="reactions-${msg.id}">
        ${renderReactionsHtml(msg.id, msg.reactions)}
      </div>
    </div>
    <div class="hover-reactions-tray">
      <button class="reaction-btn" onclick="addReaction('${msg.id}', '❤️')">❤️</button>
      <button class="reaction-btn" onclick="addReaction('${msg.id}', '🔥')">🔥</button>
      <button class="reaction-btn" onclick="addReaction('${msg.id}', '😂')">😂</button>
      <button class="reaction-btn" onclick="addReaction('${msg.id}', '👍')">👍</button>
      <button class="reaction-btn" onclick="addReaction('${msg.id}', '👏')">👏</button>
    </div>
  `;

  container.appendChild(row);
}

// INSTAGRAM DOUBLE-TAP TO HEART EFFECT
function handleMessageDoubleTap(messageId, bubbleEl) {
  // Spawn animated heart pop
  const heart = document.createElement('div');
  heart.className = 'heart-pop-anim';
  heart.textContent = '❤️';
  bubbleEl.appendChild(heart);

  setTimeout(() => heart.remove(), 700);

  // Send heart reaction via Socket.IO
  addReaction(messageId, '❤️');
}

function addReaction(messageId, emoji) {
  socket.emit('add_reaction', {
    roomName: currentRoom,
    messageId,
    emoji
  });
}

function renderReactionsHtml(msgId, reactions = {}) {
  let html = '';
  for (const [emoji, count] of Object.entries(reactions)) {
    if (count > 0) {
      html += `
        <button class="reaction-pill" onclick="addReaction('${msgId}', '${emoji}')">
          <span>${emoji}</span> <span>${count}</span>
        </button>
      `;
    }
  }
  return html;
}

function renderDateDivider(text) {
  const container = document.getElementById('messagesStream');
  const d = document.createElement('div');
  d.className = 'date-divider-pill';
  d.textContent = text;
  container.appendChild(d);
}

function renderSystemEvent(text) {
  const container = document.getElementById('messagesStream');
  const d = document.createElement('div');
  d.className = 'system-event-pill';
  d.textContent = text;
  container.appendChild(d);
  scrollToBottom();
}

function playVoiceMemoDemo(btn) {
  btn.textContent = '⏸';
  playMessengerChime();
  setTimeout(() => { btn.textContent = '▶'; }, 1500);
}

function scrollToBottom() {
  const vp = document.getElementById('messagesViewport');
  vp.scrollTop = vp.scrollHeight;
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

// --------------------------------------------------------------------------
// 7. Sidebar Chats List & Tab Filters
// --------------------------------------------------------------------------
function renderChatsList() {
  const container = document.getElementById('chatsListContainer');
  container.innerHTML = '';

  // 1. Saved Notes (WhatsApp Starred / Telegram Saved)
  if (currentTab === 'all' || currentTab === 'saved') {
    const savedCard = document.createElement('div');
    savedCard.className = `chat-card-item ${currentRoom === 'saved' ? 'active' : ''}`;
    savedCard.dataset.room = 'saved';
    savedCard.onclick = () => openSavedNotes();

    savedCard.innerHTML = `
      <div class="chat-avatar-ring">
        <div class="chat-avatar-inner" style="background: linear-gradient(135deg, #0088cc, #25d366);">🔖</div>
      </div>
      <div class="chat-card-meta">
        <div class="card-top-row">
          <span class="card-title">Saved Notes & Bookmarks</span>
          <span class="card-time">Cloud</span>
        </div>
        <div class="card-bottom-row">
          <span class="card-snippet" id="snippet-saved">Personal notes, code snippets & notices</span>
          <span class="card-badge">📌</span>
        </div>
      </div>
    `;
    container.appendChild(savedCard);
  }

  // 2. Room Channels
  allRooms.forEach(room => {
    if (currentTab === 'saved') return;

    const card = document.createElement('div');
    card.className = `chat-card-item ${room.name === currentRoom ? 'active' : ''}`;
    card.dataset.room = room.name;
    card.onclick = () => switchRoom(room);

    const color = getUserColor(room.displayName);
    const initials = getInitials(room.displayName);

    card.innerHTML = `
      <div class="chat-avatar-ring">
        <div class="chat-avatar-inner" style="background:${color}">${initials}</div>
        <span class="online-dot"></span>
      </div>
      <div class="chat-card-meta">
        <div class="card-top-row">
          <span class="card-title">${escapeHtml(room.displayName)}</span>
          <span class="card-time">12:44</span>
        </div>
        <div class="card-bottom-row">
          <span class="card-snippet" id="snippet-${room.name}">
            <span class="wa-check">✓✓</span>${escapeHtml(room.description || 'Tap to join chat')}
          </span>
          <span class="card-badge">${room.userCount || 1}</span>
        </div>
      </div>
    `;

    container.appendChild(card);
  });

  document.getElementById('badgeAllChats').textContent = allRooms.length + 1;
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
  toggleMobileView(true);
}

function openSavedNotes() {
  currentRoom = 'saved';
  document.getElementById('headerChatTitle').textContent = 'Saved Notes & Bookmarks';
  document.getElementById('headerAvatar').textContent = '🔖';
  document.getElementById('headerChatSubtitle').textContent = 'Personal Cloud Sync';

  const container = document.getElementById('messagesStream');
  container.innerHTML = '';
  renderDateDivider('Today');
  renderSystemEvent('Saved Notes: Personal bookmarks and server notices.');

  savedNotesHistory.forEach(n => renderMessageBubble(n));
  scrollToBottom();
  highlightActiveCard('saved');
  toggleMobileView(true);
}

function highlightActiveCard(roomName) {
  document.querySelectorAll('.chat-card-item').forEach(c => {
    c.classList.toggle('active', c.dataset.room === roomName);
  });
}

function updateCardSnippet(roomName, snippet) {
  const el = document.getElementById(`snippet-${roomName}`);
  if (el) el.innerHTML = `<span class="wa-check">✓✓</span>${escapeHtml(snippet)}`;
}

function updateHeaderCounts(count) {
  if (currentRoom === 'saved') return;
  document.getElementById('headerChatSubtitle').textContent = `Active now • ${count} member${count > 1 ? 's' : ''}`;
  document.getElementById('detailsMemberCount').textContent = `${count} members`;
}

function filterChats(tab) {
  currentTab = tab;
  document.querySelectorAll('.omni-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tab);
  });
  renderChatsList();
}

function handleSearchChats() {
  const q = document.getElementById('chatSearchInput').value.toLowerCase().trim();
  document.getElementById('btnClearSearch').classList.toggle('hidden', q.length === 0);

  document.querySelectorAll('.chat-card-item').forEach(item => {
    const text = item.textContent.toLowerCase();
    item.style.display = text.includes(q) ? 'flex' : 'none';
  });
}

function clearSearch() {
  document.getElementById('chatSearchInput').value = '';
  document.getElementById('btnClearSearch').classList.add('hidden');
  document.querySelectorAll('.chat-card-item').forEach(item => item.style.display = 'flex');
}

// --------------------------------------------------------------------------
// 8. Modals, Drawers & UI Helpers
// --------------------------------------------------------------------------
function toggleAppTheme() {
  const isLight = document.body.classList.toggle('theme-light');
  document.getElementById('btnThemeToggle').textContent = isLight ? '☀️' : '🌙';
}

function toggleMobileView(open) {
  document.getElementById('omniApp').classList.toggle('mobile-chat-open', open);
}

function openRoomDetailsModal() {
  document.getElementById('detailsRoomName').textContent = document.getElementById('headerChatTitle').textContent;
  document.getElementById('detailsRoomAvatar').textContent = document.getElementById('headerAvatar').textContent;
  document.getElementById('roomDetailsModal').classList.remove('hidden');
}

function closeRoomDetailsModal() {
  document.getElementById('roomDetailsModal').classList.add('hidden');
}

function renderDetailsMembers(users = []) {
  const stream = document.getElementById('detailsMembersStream');
  if (!stream) return;
  stream.innerHTML = '';

  users.forEach(u => {
    const color = u.color || getUserColor(u.username);
    const chip = document.createElement('div');
    chip.className = 'member-chip';
    chip.innerHTML = `
      <div class="member-chip-avatar" style="background:${color}">${getInitials(u.username)}</div>
      <span><strong>${escapeHtml(u.username)}</strong> ${u.username === currentUser.name ? '<small style="color:var(--wa-green)">(You)</small>' : ''}</span>
    `;
    stream.appendChild(chip);
  });
}

function toggleHeaderMenu() {
  document.getElementById('headerDropdown').classList.toggle('hidden');
}

function toggleAttachMenu() {
  document.getElementById('attachPopover').classList.toggle('hidden');
}

function toggleEmojiPicker() {
  document.getElementById('emojiTray').classList.toggle('hidden');
}

function insertEmoji(emoji) {
  const input = document.getElementById('messageInput');
  input.value += emoji;
  input.focus();
  updateSendButtonState();
  document.getElementById('emojiTray').classList.add('hidden');
}

function handleAttachment(type) {
  document.getElementById('attachPopover').classList.add('hidden');
  const label = type === 'photo' ? '📷 Photo' : type === 'voice' ? '🎙️ Voice Memo' : type === 'doc' ? '📄 Document' : '📊 Poll';
  sendTextMessage(`[Attached ${label}]`);
}

function openNewRoomModal() {
  document.getElementById('newRoomNameInput').value = '';
  document.getElementById('newRoomDescInput').value = '';
  document.getElementById('newRoomPrivateCheckbox').checked = false;
  document.getElementById('privateRoomPassGroup').classList.add('hidden');
  document.getElementById('newRoomModal').classList.remove('hidden');
  document.getElementById('newRoomNameInput').focus();
}

function closeNewRoomModal() {
  document.getElementById('newRoomModal').classList.add('hidden');
}

function togglePrivateRoomPass() {
  const isPrivate = document.getElementById('newRoomPrivateCheckbox').checked;
  document.getElementById('privateRoomPassGroup').classList.toggle('hidden', !isPrivate);
}

function submitCreateRoom() {
  const name = document.getElementById('newRoomNameInput').value.trim();
  const desc = document.getElementById('newRoomDescInput').value.trim();
  const isPrivate = document.getElementById('newRoomPrivateCheckbox').checked;
  const pass = document.getElementById('newRoomPasswordInput').value;

  if (!name || name.length < 2) {
    showToast('Name must be at least 2 characters');
    return;
  }

  socket.emit('create_room', { roomName: name, description: desc, isPrivate, password: pass });
  socket.emit('join_room', { roomName: name, password: pass });
  closeNewRoomModal();
  showToast(`Room #${name} created!`);
}

function toggleMuteChat() {
  isMuted = !isMuted;
  document.getElementById('dropdownMuteText').textContent = isMuted ? '🔔 Unmute Notifications' : '🔕 Mute Notifications';
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

function dismissPinnedBanner(e) {
  if (e) e.stopPropagation();
  document.getElementById('pinnedBanner').classList.add('hidden');
}

function dismissGyanCard() {
  document.getElementById('gyanKiBaatCard').style.display = 'none';
}

// --------------------------------------------------------------------------
// 9. Classroom Event Monitor (For Monday's Presentation)
// --------------------------------------------------------------------------
function sendClassroomEvent() {
  const testMsg = `Testing 'kuchbhi' event from ${currentUser.name}`;
  socket.emit('kuchbhi', testMsg);
  logMonitor('emit: kuchbhi', testMsg);
  showToast(`Emitted "kuchbhi" to server console!`);
  document.getElementById('headerDropdown').classList.add('hidden');
}

function openClassroomMonitor() {
  document.getElementById('classroomMonitorModal').classList.remove('hidden');
}

function closeClassroomMonitor() {
  document.getElementById('classroomMonitorModal').classList.add('hidden');
}

function logMonitor(name, data) {
  const box = document.getElementById('monitorTerminal');
  if (!box) return;

  const time = new Date().toLocaleTimeString();
  const row = document.createElement('div');
  row.className = 'term-row';
  row.innerHTML = `<span class="term-t">[${time}]</span> <span class="term-ev">${name}:</span> <span class="term-val">${escapeHtml(String(data))}</span>`;
  box.appendChild(row);
  box.scrollTop = box.scrollHeight;
}

// Toast Helper
function showToast(msg) {
  const c = document.getElementById('toastContainer');
  if (!c) return;

  const t = document.createElement('div');
  t.className = 'omni-toast';
  t.textContent = msg;
  c.appendChild(t);

  setTimeout(() => {
    t.style.opacity = '0';
    setTimeout(() => t.remove(), 250);
  }, 2800);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
