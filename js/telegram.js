// js/telegram.js
// Telegram Web App Integration - PRIORITAS UTAMA

(function() {
  'use strict';

  console.log('🚀 Telegram.js loading...');

  // Global variables
  window.tg = null;
  window.telegramUser = null;

  // Initialize Telegram Web App - JALANKAN SEGERA
  function initTelegram() {
    console.log('🔍 Initializing Telegram Web App...');

    // Cek apakah dalam environment Telegram
    if (window.Telegram && window.Telegram.WebApp) {
      console.log('✅ Telegram Web App detected');

      window.tg = window.Telegram.WebApp;

      // Expand to full height
      window.tg.expand();

      // Ready - penting!
      window.tg.ready();

      console.log('Telegram WebApp version:', window.tg.version);
      console.log('Platform:', window.tg.platform);
      console.log('Theme params:', window.tg.themeParams);

      // Get user data - INI YANG PALING PENTING!
      if (window.tg.initDataUnsafe && window.tg.initDataUnsafe.user) {
        window.telegramUser = window.tg.initDataUnsafe.user;
        console.log('✅✅✅ TELEGRAM USER DETECTED:', window.telegramUser);

        // Save to localStorage as currentUser
        const tgUser = {
          user_id: window.telegramUser.id,
          fullname: window.telegramUser.first_name + ' ' + (window.telegramUser.last_name || ''),
          username: window.telegramUser.username || '',
          avatar: window.telegramUser.photo_url || `https://ui-avatars.com/api/?name=${window.telegramUser.first_name}&size=120&background=1e88e5&color=fff`,
          is_premium: window.telegramUser.is_premium || false,
          language_code: window.telegramUser.language_code || 'id',
          first_seen: new Date().toISOString()
        };

        // Simpan ke localStorage
        localStorage.setItem('giftfreebies_user', JSON.stringify(tgUser));

        // Trigger event untuk main.js
        const event = new CustomEvent('telegramUserReady', {
          detail: tgUser
        });
        window.dispatchEvent(event);

        console.log('✅ Telegram user saved to localStorage:', tgUser);

        // Update UI langsung jika elemen sudah ada
        updateTelegramUI(tgUser);

        return tgUser;
      } else {
        console.warn('⚠️ No user data in Telegram WebApp');
        console.log('initDataUnsafe:', window.tg.initDataUnsafe);
        return null;
      }
    } else {
      console.warn('❌ Telegram Web App not detected - not in Telegram environment');
      return null;
    }
  }

  // Update UI langsung dengan data Telegram
  function updateTelegramUI(user) {
    // Update navbar avatar dan nama
    const userNameEl = document.getElementById('userName');
    const userAvatarEl = document.getElementById('userAvatar');

    if (userNameEl) {
      userNameEl.textContent = user.fullname || user.username || 'User';
    }

    if (userAvatarEl) {
      // Cari avatar image atau initial
      const avatarImg = userAvatarEl.querySelector('img');
      const avatarInitial = userAvatarEl.querySelector('.avatar-initial');

      if (avatarImg) {
        avatarImg.src = user.avatar;
        avatarImg.alt = user.fullname;
        if (avatarInitial) avatarInitial.style.display = 'none';
      } else if (avatarInitial) {
        // Fallback ke initial
        avatarInitial.textContent = user.fullname.charAt(0).toUpperCase();
      }
    }

    // Update profile page jika ada
    const profileFullname = document.getElementById('profileFullname');
    const profileUsername = document.getElementById('profileUsername');
    const profileAvatar = document.getElementById('profileAvatar');

    if (profileFullname) profileFullname.textContent = user.fullname;
    if (profileUsername) profileUsername.textContent = user.username ? `@${user.username}` : '-';
    if (profileAvatar) profileAvatar.src = user.avatar;
  }

  // Apply Telegram theme colors
  function applyTelegramTheme() {
    if (!window.tg) return;

    const theme = window.tg.themeParams;
    if (!theme) return;

    const root = document.documentElement;

    // Map Telegram theme to CSS variables
    if (theme.bg_color) {
      root.style.setProperty('--tg-bg-color', theme.bg_color);
      root.style.setProperty('--tg-theme-bg-color', theme.bg_color);
    }
    if (theme.text_color) {
      root.style.setProperty('--tg-text-color', theme.text_color);
      root.style.setProperty('--tg-theme-text-color', theme.text_color);
    }
    if (theme.button_color) {
      root.style.setProperty('--tg-button-color', theme.button_color);
      root.style.setProperty('--tg-theme-button-color', theme.button_color);
    }
    if (theme.button_text_color) {
      root.style.setProperty('--tg-button-text-color', theme.button_text_color);
      root.style.setProperty('--tg-theme-button-text-color', theme.button_text_color);
    }
  }

  // Setup back button
  function setupBackButton() {
    if (!window.tg || !window.tg.BackButton) return;

    window.tg.BackButton.hide();

    document.addEventListener('popupOpened', () => {
      window.tg.BackButton.show();
      window.tg.BackButton.onClick(() => {
        document.dispatchEvent(new Event('popupCloseRequest'));
        window.tg.BackButton.hide();
      });
    });

    document.addEventListener('popupClosed', () => {
      window.tg.BackButton.hide();
    });
  }

  // JALANKAN INISIALISASI
  const user = initTelegram();
  if (user) {
    applyTelegramTheme();
    setupBackButton();
  }

  // Ekspos fungsi ke global
  window.getTelegramUser = () => window.telegramUser;
  window.getTelegramTG = () => window.tg;
})();
