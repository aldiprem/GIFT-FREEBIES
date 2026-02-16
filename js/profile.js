// ==================== PROFILE PAGE ====================

// Load user profile data
async function loadUserProfile() {
  console.log('📋 Loading profile page...');
  console.log('Current user:', currentUser);
  console.log('Telegram user:', window.telegramUser);

  // Tampilkan loading
  showLoading('userGiveaways');

  if (window.telegramUser) {
    // Jika ada user Telegram, gunakan data Telegram
    await loadTelegramProfile(window.telegramUser);
  } else if (currentUser) {
    // Fallback ke currentUser
    await loadLocalProfile(currentUser);
  } else {
    showError('userGiveaways', 'Silakan login terlebih dahulu');
  }
}

// Load profile dari Telegram
async function loadTelegramProfile(tgUser) {
  console.log('📱 Loading Telegram profile for:', tgUser);

  try {
    // 1. Update profile details dari data Telegram
    const fullName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') || 'User';
    const username = tgUser.username || '';
    const avatarUrl = tgUser.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&size=120&background=1e88e5&color=fff`;

    updateProfileDetails({
      fullname: fullName,
      username: username,
      first_seen: new Date().toISOString(),
      avatar: avatarUrl
    });

    // 2. Coba ambil stats dari API
    try {
      console.log('🔍 Fetching user stats from API...');
      const stats = await apiCall(`/api/user/${tgUser.id}/stats`);
      updateUserStats(stats);
    } catch (error) {
      console.warn('⚠️ Stats API error, using defaults:', error);
      // Default stats
      updateUserStats({
        total_giveaways: 0,
        total_participations: 0,
        total_wins: 0,
        total_tickets: 0
      });
    }

    // 3. Coba ambil giveaways dari API
    try {
      console.log('🔍 Fetching user giveaways from API...');
      const giveaways = await apiCall(`/api/user/${tgUser.id}/giveaways`);
      displayUserGiveaways(giveaways);
    } catch (error) {
      console.warn('⚠️ Giveaways API error:', error);

      // Fallback: coba endpoint alternatif
      try {
        console.log('🔄 Trying alternative endpoint...');
        const userData = await apiCall(`/api/user/${tgUser.id}`);
        if (userData && userData.giveaways) {
          displayUserGiveaways(userData.giveaways);
        } else {
          document.getElementById('userGiveaways').innerHTML =
            '<div class="alert alert-info">Belum ada giveaway yang dibuat</div>';
        }
      } catch (fallbackError) {
        document.getElementById('userGiveaways').innerHTML =
          '<div class="alert alert-info">Belum ada giveaway yang dibuat</div>';
      }
    }

  } catch (error) {
    console.error('❌ Error loading Telegram profile:', error);
    showError('userGiveaways', 'Gagal memuat data profil: ' + error.message);
  }
}

// Load profile dari local user (dummy atau saved)
async function loadLocalProfile(user) {
  console.log('💻 Loading local profile for:', user);

  try {
    // Update profile details dari currentUser
    updateProfileDetails({
      fullname: user.fullname || 'User',
      username: user.username || '',
      first_seen: user.first_seen || new Date().toISOString(),
      avatar: user.avatar || 'https://via.placeholder.com/120'
    });

    // Coba ambil stats dari API
    try {
      const stats = await apiCall(`/api/user/${user.user_id}/stats`);
      updateUserStats(stats);
    } catch (error) {
      console.warn('⚠️ Stats API error, using defaults:', error);
      updateUserStats({
        total_giveaways: 0,
        total_participations: 0,
        total_wins: 0,
        total_tickets: 0
      });
    }

    // Coba ambil giveaways dari API
    try {
      const giveaways = await apiCall(`/api/user/${user.user_id}/giveaways`);
      displayUserGiveaways(giveaways);
    } catch (error) {
      console.warn('⚠️ Giveaways API error:', error);
      document.getElementById('userGiveaways').innerHTML =
        '<div class="alert alert-info">Belum ada giveaway yang dibuat</div>';
    }

  } catch (error) {
    console.error('❌ Error loading local profile:', error);
    showError('userGiveaways', 'Gagal memuat data profil');
  }
}

// Update statistik user
function updateUserStats(stats) {
  console.log('📊 Updating stats:', stats);

  const totalGiveaways = document.getElementById('totalGiveaways');
  const totalParticipations = document.getElementById('totalParticipations');
  const totalWins = document.getElementById('totalWins');
  const totalTickets = document.getElementById('totalTickets');

  if (totalGiveaways) totalGiveaways.textContent = stats.total_giveaways || 0;
  if (totalParticipations) totalParticipations.textContent = stats.total_participations || 0;
  if (totalWins) totalWins.textContent = stats.total_wins || 0;
  if (totalTickets) totalTickets.textContent = stats.total_tickets || 0;
}

// Update detail profil
function updateProfileDetails(userData) {
  console.log('👤 Updating profile details:', userData);

  const profileFullname = document.getElementById('profileFullname');
  const profileUsername = document.getElementById('profileUsername');
  const profileAvatar = document.getElementById('profileAvatar');
  const profileBio = document.getElementById('profileBio');

  if (profileFullname) {
    profileFullname.textContent = userData.fullname || 'No Name';
  }

  if (profileUsername) {
    profileUsername.textContent = userData.username ? `@${userData.username}` : '-';
  }

  if (profileAvatar) {
    profileAvatar.src = userData.avatar || 'https://via.placeholder.com/120';
    profileAvatar.alt = userData.fullname || 'Profile';
  }

  if (profileBio) {
    if (userData.first_seen && userData.first_seen !== 'Unknown') {
      const joined = formatDate(userData.first_seen);
      profileBio.textContent = `Member since ${joined}`;
    } else {
      profileBio.textContent = 'Member since 2024';
    }
  }
}

// Tampilkan daftar giveaway user
function displayUserGiveaways(giveaways) {
  const container = document.getElementById('userGiveaways');
  if (!container) return;

  console.log('📦 Displaying giveaways:', giveaways);

  if (!giveaways || giveaways.length === 0) {
    container.innerHTML = '<div class="alert alert-info">Belum ada giveaway yang dibuat</div>';
    return;
  }

  container.innerHTML = giveaways.map(giveaway => {
    const status = giveaway.status === 'active' ? 'Aktif' : 'Berakhir';
    const statusClass = giveaway.status === 'active' ? 'success' : 'secondary';
    const prize = giveaway.prize || 'Unknown Prize';
    const participants = giveaway.participants_count || 0;
    const createdAt = giveaway.created_at || new Date().toISOString();
    const giveawayId = giveaway.giveaway_id || '';

    return `
            <div class="giveaway-item" onclick="window.location.href='giveaway.html?giveaway_id=${giveawayId}'">
                <div>
                    <h4>🎁 ${prize}</h4>
                    <p>👥 ${participants} peserta</p>
                    <small>Dibuat: ${formatDate(createdAt)}</small>
                </div>
                <div>
                    <span class="giveaway-status status-${statusClass}">${status}</span>
                </div>
            </div>
        `;
  }).join('');
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Profile.js initialized');

  if (window.location.pathname.includes('profile.html')) {
    console.log('📄 Profile page detected');

    // Tunggu sebentar untuk memastikan currentUser sudah siap
    setTimeout(() => {
      loadUserProfile();
    }, 200);
  }
});
