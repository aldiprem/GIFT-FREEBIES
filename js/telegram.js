// ================================
// TELEGRAM USER AUTH - CLEAN VERSION
// ================================

let tg = null;
let telegramUser = null;

// Global currentUser agar dipakai seluruh app
window.currentUser = null;

// Init Telegram WebApp
function initTelegramAuth() {
  if (!window.Telegram || !window.Telegram.WebApp) {
    console.warn("❌ Not opened inside Telegram");
    setGuestUser();
    return;
  }

  tg = window.Telegram.WebApp;
  tg.expand();
  tg.ready();

  if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
    telegramUser = tg.initDataUnsafe.user;

    console.log("✅ Telegram user detected:", telegramUser);

    // Convert ke format currentUser app kamu
    window.currentUser = {
      user_id: telegramUser.id,
      fullname: `${telegramUser.first_name || ""} ${telegramUser.last_name || ""}`.trim(),
      username: telegramUser.username || "",
      avatar: telegramUser.photo_url || generateAvatar(telegramUser.first_name),
      first_seen: new Date().toISOString()
    };

    updateNavbarUser();
  } else {
    console.warn("❌ Telegram user data not available");
    setGuestUser();
  }
}

// Guest fallback
function setGuestUser() {
  window.currentUser = null;
  updateNavbarUser();
}

// Generate avatar fallback
function generateAvatar(name = "User") {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=8774E1&color=fff&size=128&bold=true`;
}

// Update navbar UI
function updateNavbarUser() {
  const avatar = document.getElementById("userAvatar");
  const name = document.getElementById("userName");

  if (!avatar || !name) return;

  if (!window.currentUser) {
    name.textContent = "Guest";
    avatar.innerHTML = `<span class="avatar-initial">?</span>`;
    return;
  }

  name.textContent = window.currentUser.fullname;

  avatar.innerHTML = `
    <img src="${window.currentUser.avatar}" 
         style="width:100%;height:100%;border-radius:50%;object-fit:cover;">
  `;
}

// Init saat page load
document.addEventListener("DOMContentLoaded", initTelegramAuth);
