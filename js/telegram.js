// ================================
// TELEGRAM USER AUTH - CLEAN VERSION
// ================================

// Jalankan langsung, tanpa menunggu DOMContentLoaded
(function() {
  console.log('🚀 Telegram.js started');

  let tg = null;
  let telegramUser = null;

  // Global currentUser agar dipakai seluruh app
  window.currentUser = null;

  // Init Telegram WebApp
  function initTelegramAuth() {
    console.log('🔍 Initializing Telegram Auth...');

    if (!window.Telegram || !window.Telegram.WebApp) {
      console.warn("❌ Not opened inside Telegram");
      setGuestUser();
      return;
    }

    tg = window.Telegram.WebApp;
    tg.expand();
    tg.ready();

    console.log('Telegram WebApp version:', tg.version);
    console.log('initDataUnsafe:', tg.initDataUnsafe);

    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
      telegramUser = tg.initDataUnsafe.user;

      console.log("✅ Telegram user detected:", telegramUser);

      // Convert ke format currentUser app kamu
      window.currentUser = {
        user_id: telegramUser.id,
        fullname: `${telegramUser.first_name || ""} ${telegramUser.last_name || ""}`.trim(),
        username: telegramUser.username || "",
        avatar: telegramUser.photo_url || generateAvatar(telegramUser.first_name),
        first_seen: new Date().toISOString(),
        is_premium: telegramUser.is_premium || false
      };

      console.log('✅ currentUser set:', window.currentUser);

      // Update UI
      updateNavbarUser();
      updateProfilePage();

    } else {
      console.warn("❌ Telegram user data not available");
      setGuestUser();
    }
  }

  // Guest fallback
  function setGuestUser() {
    window.currentUser = {
      user_id: null,
      fullname: 'Guest',
      username: '',
      avatar: 'https://ui-avatars.com/api/?name=Guest&background=8774E1&color=fff&size=128&bold=true',
      first_seen: new Date().toISOString(),
      is_premium: false
    };
    console.log('👤 Guest user set');
    updateNavbarUser();
    updateProfilePage();
  }

  // Generate avatar fallback
  function generateAvatar(name = "User") {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1e88e5&color=fff&size=128&bold=true`;
  }

  // Update navbar UI
  function updateNavbarUser() {
    const avatar = document.getElementById("userAvatar");
    const name = document.getElementById("userName");

    if (!avatar || !name) {
      console.log('Navbar elements not ready yet');
      return;
    }

    if (!window.currentUser) {
      name.textContent = "Guest";
      avatar.innerHTML = `<span class="avatar-initial">?</span>`;
      return;
    }

    name.textContent = window.currentUser.fullname || 'User';

    // Cek apakah ada foto real dari Telegram
    if (window.currentUser.avatar && !window.currentUser.avatar.includes('ui-avatars')) {
      avatar.innerHTML = `<img src="${window.currentUser.avatar}" class="avatar-image" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
    } else {
      // Fallback ke initial
      const initial = (window.currentUser.fullname || 'U').charAt(0).toUpperCase();
      avatar.innerHTML = `<span class="avatar-initial">${initial}</span>`;
    }
  }

  // Update profile page jika elemennya ada
  function updateProfilePage() {
    if (!window.currentUser) return;

    const profileFullname = document.getElementById('profileFullname');
    const profileUsername = document.getElementById('profileUsername');
    const profileAvatar = document.getElementById('profileAvatar');
    const profileBio = document.getElementById('profileBio');

    if (profileFullname) {
      profileFullname.textContent = window.currentUser.fullname || 'No Name';
    }

    if (profileUsername) {
      profileUsername.textContent = window.currentUser.username ? `@${window.currentUser.username}` : '-';
    }

    if (profileAvatar) {
      if (window.currentUser.avatar && !window.currentUser.avatar.includes('ui-avatars')) {
        profileAvatar.src = window.currentUser.avatar;
      } else {
        profileAvatar.src = generateAvatar(window.currentUser.fullname);
      }
    }

    if (profileBio) {
      profileBio.textContent = window.currentUser.is_premium ? '⭐ Premium User' : 'Free User';
    }
  }

  // JALANKAN LANGSUNG
  initTelegramAuth();
})();
