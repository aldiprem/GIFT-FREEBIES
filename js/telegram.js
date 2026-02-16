// js/telegram.js
// Telegram Web App Integration

// Global variables
window.tg = null;
window.telegramUser = null;

// Initialize Telegram Web App
function initTelegram() {
    return new Promise((resolve) => {
        // Cek apakah dalam environment Telegram
        if (window.Telegram && window.Telegram.WebApp) {
            window.tg = window.Telegram.WebApp;
            
            // Expand to full height
            window.tg.expand();
            
            // Ready
            window.tg.ready();
            
            // Set color scheme
            window.tg.setHeaderColor?.(window.tg.themeParams.bg_color || '#0a1929');
            window.tg.setBackgroundColor?.(window.tg.themeParams.bg_color || '#0a1929');
            
            // Get user data
            if (window.tg.initDataUnsafe && window.tg.initDataUnsafe.user) {
                window.telegramUser = window.tg.initDataUnsafe.user;
                console.log('✅ Telegram user detected:', window.telegramUser);
                
                // Save to localStorage as currentUser
                const tgUser = {
                    user_id: window.telegramUser.id,
                    fullname: window.telegramUser.first_name + ' ' + (window.telegramUser.last_name || ''),
                    username: window.telegramUser.username || '',
                    avatar: window.telegramUser.photo_url || `https://ui-avatars.com/api/?name=${window.telegramUser.first_name}&size=40&background=1e88e5&color=fff`,
                    is_premium: window.telegramUser.is_premium || false,
                    language_code: window.telegramUser.language_code || 'id'
                };
                
                localStorage.setItem('giftfreebies_user', JSON.stringify(tgUser));
                
                // Trigger event
                window.dispatchEvent(new CustomEvent('telegramUserReady', { detail: tgUser }));
                
                resolve(tgUser);
            } else {
                console.log('ℹ️ No Telegram user data');
                resolve(null);
            }
            
            // Setup back button
            if (window.tg.BackButton) {
                window.tg.BackButton.hide();
                
                // Show back button when popup is opened
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
            
            // Apply Telegram theme
            applyTelegramTheme();
            
        } else {
            console.log('ℹ️ Not in Telegram Web App environment');
            resolve(null);
        }
    });
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
    if (theme.hint_color) {
        root.style.setProperty('--tg-hint-color', theme.hint_color);
    }
    if (theme.link_color) {
        root.style.setProperty('--tg-link-color', theme.link_color);
    }
}

// Get init data for API calls
function getTelegramInitData() {
    if (window.tg && window.tg.initData) {
        return window.tg.initData;
    }
    return '';
}

// Show popup
function showTelegramPopup(title, message, buttons, callback) {
    if (window.tg) {
        window.tg.showPopup({ title, message, buttons }, callback);
    } else {
        // Fallback to browser confirm/alert
        if (confirm(`${title}\n\n${message}`)) {
            callback?.('ok');
        }
    }
}

// Show confirmation
function showTelegramConfirm(message, callback) {
    showTelegramPopup('Confirm', message, [
        { id: 'cancel', type: 'destructive', text: 'Cancel' },
        { id: 'ok', type: 'default', text: 'OK' }
    ], (id) => {
        if (id === 'ok') callback?.(true);
        else callback?.(false);
    });
}

// Show alert
function showTelegramAlert(message, callback) {
    showTelegramPopup('Alert', message, [
        { id: 'ok', type: 'default', text: 'OK' }
    ], callback);
}

// Share to story
function shareToStory(mediaUrl, text) {
    if (window.tg && window.tg.shareToStory) {
        window.tg.shareToStory(mediaUrl, { text });
        return true;
    }
    return false;
}

// Initialize on load
initTelegram().then(user => {
    console.log('Telegram init complete:', user);
});

// Export functions
window.initTelegram = initTelegram;
window.getTelegramInitData = getTelegramInitData;
window.showTelegramPopup = showTelegramPopup;
window.showTelegramConfirm = showTelegramConfirm;
window.showTelegramAlert = showTelegramAlert;
window.shareToStory = shareToStory;
