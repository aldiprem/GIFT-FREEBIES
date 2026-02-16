// js/profile.js
// Profile page untuk GiftFreebies - DENGAN TELEGRAM AUTH

// ===== GLOBAL STATE =====
let tg = null;
let telegramUser = null;
let userGifts = [];
let lottieCache = new Map();

// DOM Elements
const elements = {
  cardsGrid: document.getElementById('cardsGrid'),
  loadingState: document.getElementById('loadingState'),
  userAvatar: document.getElementById('userAvatar'),
  userProfile: document.getElementById('userProfile'),
  profileHeader: document.getElementById('profileHeader'),
  bottomSheetOverlay: document.getElementById('bottomSheetOverlay'),
  bottomSheet: document.getElementById('bottomSheet'),
  sheetContent: document.getElementById('sheetContent'),
  sheetCloseBtn: document.getElementById('sheetCloseBtn'),
  sheetHandle: document.querySelector('.sheet-handle'),
  scrollTopBtn: document.getElementById('scrollTopBtn'),
  profileFullname: document.getElementById('profileFullname'),
  profileUsername: document.getElementById('profileUsername'),
  profileAvatar: document.getElementById('profileAvatar'),
  profileBio: document.getElementById('profileBio'),
  totalGiveaways: document.getElementById('totalGiveaways'),
  totalParticipations: document.getElementById('totalParticipations'),
  totalWins: document.getElementById('totalWins'),
  totalTickets: document.getElementById('totalTickets'),
  userGiveaways: document.getElementById('userGiveaways')
};

// ===== FUNGSI UTILITY =====
function formatGiftName(name) {
  if (!name) return '';
  return name.replace(/([A-Z])/g, ' $1').trim();
}

function extractIdFromSlug(slug) {
  if (!slug) return '';
  const parts = slug.split('-');
  return parts.length > 1 ? parts[1] : '';
}

function formatRupiah(amount) {
  const numAmount = Number(amount) || 0;
  return 'Rp ' + numAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function formatPrice(price) {
  return 'Rp' + (price || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function formatDate(dateString) {
  if (!dateString) return 'Unknown';
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

function showLoading(containerId) {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
            </div>
        `;
  }
}

function showError(containerId, message) {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = `
            <div class="alert alert-error">❌ ${message}</div>
        `;
  }
}

// ===== FUNGSI TELEGRAM =====
// Event listener untuk Telegram user dari telegram.js
window.addEventListener('telegramUserReady', (event) => {
  console.log('📡 Profile.js received telegramUserReady event:', event.detail);

  if (event.detail) {
    // User Telegram terdeteksi
    telegramUser = {
      id: event.detail.user_id,
      first_name: event.detail.first_name,
      last_name: event.detail.last_name,
      username: event.detail.username,
      is_premium: event.detail.is_premium,
      photo_url: event.detail.avatar.includes('ui-avatars') ? null : event.detail.avatar
    };

    // Update UI dengan data Telegram
    updateProfileFromTelegram();

    // Load data giveaway user
    loadUserGiveaways();
  } else {
    // Guest user - mungkin pakai dummy
    console.log('Guest user mode');
    loadDummyProfile();
  }
});

function updateProfileFromTelegram() {
  if (!telegramUser) return;

  const fullName = `${telegramUser.first_name} ${telegramUser.last_name || ''}`.trim();
  const username = telegramUser.username ? `@${telegramUser.username}` : '-';

  // Update profile header
  if (elements.profileFullname) {
    elements.profileFullname.textContent = fullName || 'User';
  }

  if (elements.profileUsername) {
    elements.profileUsername.textContent = username;
  }

  if (elements.profileBio) {
    elements.profileBio.textContent = 'Telegram User';
  }

  // Update avatar
  if (elements.userAvatar) {
    if (telegramUser.photo_url) {
      elements.userAvatar.innerHTML = `<img src="${telegramUser.photo_url}" class="avatar-image">`;
    } else {
      const initial = (telegramUser.first_name || 'U').charAt(0).toUpperCase();
      elements.userAvatar.innerHTML = `<span class="avatar-initial">${initial}</span>`;
    }
  }

  // Premium badge
  if (telegramUser.is_premium && elements.userProfile) {
    elements.userProfile.classList.add('premium');
  }
}

function loadDummyProfile() {
  // Update dengan data dummy
  if (elements.profileFullname) {
    elements.profileFullname.textContent = 'John Doe';
  }

  if (elements.profileUsername) {
    elements.profileUsername.textContent = '@johndoe';
  }

  if (elements.profileBio) {
    elements.profileBio.textContent = 'Member since 2024';
  }

  if (elements.userAvatar) {
    elements.userAvatar.innerHTML = '<span class="avatar-initial">J</span>';
  }

  // Load dummy stats
  if (elements.totalGiveaways) elements.totalGiveaways.textContent = '3';
  if (elements.totalParticipations) elements.totalParticipations.textContent = '12';
  if (elements.totalWins) elements.totalWins.textContent = '2';
  if (elements.totalTickets) elements.totalTickets.textContent = '15';

  // Load dummy giveaways
  if (elements.userGiveaways) {
    elements.userGiveaways.innerHTML = `
            <div class="giveaway-item" onclick="window.location.href='giveaway.html?giveaway_id=dummy1'">
                <div>
                    <h4>🎁 iPhone 15 Pro</h4>
                    <p>👥 45 peserta</p>
                    <small>Dibuat: 15 Februari 2026</small>
                </div>
                <div>
                    <span class="giveaway-status success">Aktif</span>
                </div>
            </div>
            <div class="giveaway-item" onclick="window.location.href='giveaway.html?giveaway_id=dummy2'">
                <div>
                    <h4>🎁 PlayStation 5</h4>
                    <p>👥 78 peserta</p>
                    <small>Dibuat: 10 Februari 2026</small>
                </div>
                <div>
                    <span class="giveaway-status success">Aktif</span>
                </div>
            </div>
            <div class="giveaway-item" onclick="window.location.href='giveaway.html?giveaway_id=dummy3'">
                <div>
                    <h4>🎁 Gift Card 500K</h4>
                    <p>👥 23 peserta</p>
                    <small>Dibuat: 5 Februari 2026</small>
                </div>
                <div>
                    <span class="giveaway-status secondary">Berakhir</span>
                </div>
            </div>
        `;
  }
}

// ===== FUNGSI LOAD DATA GIVEAWAY =====
async function loadUserGiveaways() {
  if (!elements.userGiveaways) return;

  showLoading('userGiveaways');

  try {
    // Di sini nanti panggil API untuk get user giveaways
    // Untuk sementara pakai dummy dulu

    setTimeout(() => {
      if (elements.userGiveaways) {
        elements.userGiveaways.innerHTML = `
                    <div class="giveaway-item" onclick="window.location.href='giveaway.html?giveaway_id=GA123'">
                        <div>
                            <h4>🎁 iPhone 15 Pro</h4>
                            <p>👥 45 peserta</p>
                            <small>Dibuat: 15 Februari 2026</small>
                        </div>
                        <div>
                            <span class="giveaway-status success">Aktif</span>
                        </div>
                    </div>
                    <div class="giveaway-item" onclick="window.location.href='giveaway.html?giveaway_id=GA456'">
                        <div>
                            <h4>🎁 PlayStation 5</h4>
                            <p>👥 78 peserta</p>
                            <small>Dibuat: 10 Februari 2026</small>
                        </div>
                        <div>
                            <span class="giveaway-status success">Aktif</span>
                        </div>
                    </div>
                `;
      }
    }, 1000);

  } catch (error) {
    console.error('Error loading giveaways:', error);
    if (elements.userGiveaways) {
      elements.userGiveaways.innerHTML = '<div class="alert alert-error">Gagal memuat giveaway</div>';
    }
  }
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Profile.js initialized');

  // Jika telegramUser belum ada (mungkin script telegram.js belum selesai),
  // kita akan tunggu event dari telegram.js
  if (!window.telegramUser) {
    console.log('Waiting for Telegram user data...');
  }
});
