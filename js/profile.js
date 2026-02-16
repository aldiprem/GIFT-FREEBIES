// js/profile.js
// Profile page sederhana - HANYA MENAMPILKAN USERNAME & ID DARI TELEGRAM

// ===== DOM Elements =====
const elements = {
  userAvatar: document.getElementById('userAvatar'),
  userName: document.getElementById('userName'),
  profileFullname: document.getElementById('profileFullname'),
  profileUsername: document.getElementById('profileUsername'),
  profileUserId: document.getElementById('profileUserId'),
  profileAvatar: document.getElementById('profileAvatar')
};

// ===== FUNGSI TELEGRAM =====
// Event listener untuk Telegram user dari telegram.js
window.addEventListener('telegramUserReady', (event) => {
  console.log('📡 Profile.js received telegramUserReady event:', event.detail);

  if (event.detail) {
    // User Telegram terdeteksi - tampilkan data
    displayTelegramUser(event.detail);
  } else {
    // Guest user - tampilkan dummy
    displayGuestUser();
  }
});

// Tampilkan data dari Telegram
function displayTelegramUser(user) {
  console.log('👤 Displaying Telegram user:', user);
  
  const fullName = `${user.first_name} ${user.last_name || ''}`.trim();
  const username = user.username ? `@${user.username}` : '(no username)';
  
  // Update navbar
  if (elements.userName) {
    elements.userName.textContent = fullName || 'User';
  }
  
  // Update profile header
  if (elements.profileFullname) {
    elements.profileFullname.textContent = fullName || 'User';
  }
  
  if (elements.profileUsername) {
    elements.profileUsername.textContent = username;
  }
  
  if (elements.profileUserId) {
    elements.profileUserId.textContent = `User ID: ${user.user_id}`;
  }
  
  // Update avatar
  if (elements.userAvatar) {
    if (user.avatar && !user.avatar.includes('ui-avatars')) {
      elements.userAvatar.innerHTML = `<img src="${user.avatar}" class="avatar-image">`;
    } else {
      const initial = (user.first_name || 'U').charAt(0).toUpperCase();
      elements.userAvatar.innerHTML = `<span class="avatar-initial">${initial}</span>`;
    }
  }
  
  // Update profile avatar
  if (elements.profileAvatar) {
    if (user.avatar && !user.avatar.includes('ui-avatars')) {
      elements.profileAvatar.src = user.avatar;
    } else {
      elements.profileAvatar.src = `https://ui-avatars.com/api/?name=${user.first_name}&size=120&background=1e88e5&color=fff`;
    }
  }
}

// Tampilkan guest/dummy user
function displayGuestUser() {
  console.log('👤 Displaying guest user');
  
  // Update navbar
  if (elements.userName) {
    elements.userName.textContent = 'Guest';
  }
  
  // Update profile header
  if (elements.profileFullname) {
    elements.profileFullname.textContent = 'Guest User';
  }
  
  if (elements.profileUsername) {
    elements.profileUsername.textContent = '@guest';
  }
  
  if (elements.profileUserId) {
    elements.profileUserId.textContent = 'User ID: -';
  }
  
  // Update avatar
  if (elements.userAvatar) {
    elements.userAvatar.innerHTML = '<span class="avatar-initial">G</span>';
  }
  
  if (elements.profileAvatar) {
    elements.profileAvatar.src = 'https://ui-avatars.com/api/?name=Guest&size=120&background=1e88e5&color=fff';
  }
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Profile.js initialized - Simple version');
});
