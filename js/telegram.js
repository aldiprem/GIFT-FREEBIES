// js/telegram.js
// Telegram Web App Integration - VERSI FINAL

(function() {
  'use strict';

  console.log('🚀 Telegram.js loading...');

  // Global variables
  window.tg = null;
  window.telegramUser = null;

  // Initialize Telegram Web App
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
          first_name: window.telegramUser.first_name,
          last_name: window.telegramUser.last_name || '',
          fullname: window.telegramUser.first_name + ' ' + (window.telegramUser.last_name || ''),
          username: window.telegramUser.username || '',
          avatar: window.telegramUser.photo_url || `https://ui-avatars.com/api/?name=${window.telegramUser.first_name}&size=120&background=1e88e5&color=fff`,
          is_premium: window.telegramUser.is_premium || false,
          language_code: window.telegramUser.language_code || 'id'
        };

        // Simpan ke localStorage
        localStorage.setItem('giftfreebies_user', JSON.stringify(tgUser));

        // Trigger event untuk main.js/profile.js
        const event = new CustomEvent('telegramUserReady', {
          detail: tgUser
        });
        window.dispatchEvent(event);

        console.log('✅ Telegram user saved to localStorage:', tgUser);

        return tgUser;
      } else {
        console.warn('⚠️ No user data in Telegram WebApp');
        console.log('initDataUnsafe:', window.tg.initDataUnsafe);

        // Trigger event untuk guest user
        window.dispatchEvent(new CustomEvent('telegramUserReady', {
          detail: null
        }));

        return null;
      }
    } else {
      console.warn('❌ Telegram Web App not detected - not in Telegram environment');

      // Trigger event untuk guest user
      window.dispatchEvent(new CustomEvent('telegramUserReady', {
        detail: null
      }));

      return null;
    }
  }

  // Apply Telegram theme colors
  function applyTelegramTheme() {
    if (!window.tg) return;

    const theme = window.tg.themeParams;
    if (!theme) return;

    const root = document.documentElement;

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
