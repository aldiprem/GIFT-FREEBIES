// js/profile.js - VERSI SEDERHANA (DIPERBAIKI)

// Load user profile data
async function loadUserProfile() {
  console.log('📋 Loading profile page...');
  console.log('Current user:', window.currentUser);

  // Gunakan window.currentUser, bukan currentUser biasa
  if (!window.currentUser) {
    showError('userGiveaways', 'Silakan login terlebih dahulu');
    return;
  }

  // Tampilkan loading
  showLoading('userGiveaways');

  try {
    // Update profile details dari window.currentUser
    updateProfileDetails({
      fullname: window.currentUser.fullname || 'No Name',
      username: window.currentUser.username || '',
      first_seen: window.currentUser.first_seen || new Date().toISOString(),
      avatar: window.currentUser.avatar || 'https://via.placeholder.com/120'
    });

    // Load stats dari API (hanya jika user_id valid dan bukan guest)
    if (window.currentUser.user_id && window.currentUser.user_id !== 7998861975) {
      try {
        console.log('📊 Fetching stats for user_id:', window.currentUser.user_id);
        const stats = await apiCall(`/api/user/${window.currentUser.user_id}/stats`);
        updateUserStats(stats);
      } catch (error) {
        console.warn('Stats API error, using defaults:', error);
        updateUserStats({
          total_giveaways: 0,
          total_participations: 0,
          total_wins: 0,
          total_tickets: 0
        });
      }

      // Load giveaways dari API
      try {
        console.log('🎁 Fetching giveaways for user_id:', window.currentUser.user_id);
        const giveaways = await apiCall(`/api/user/${window.currentUser.user_id}/giveaways`);
        displayUserGiveaways(giveaways);
      } catch (error) {
        console.warn('Giveaways API error:', error);
        document.getElementById('userGiveaways').innerHTML =
          '<div class="alert alert-info">Tidak dapat memuat giveaway</div>';
      }
    } else {
      // Guest user
      updateUserStats({
        total_giveaways: 0,
        total_participations: 0,
        total_wins: 0,
        total_tickets: 0
      });
      document.getElementById('userGiveaways').innerHTML =
        '<div class="alert alert-info">Login untuk melihat giveaway Anda</div>';
    }

  } catch (error) {
    console.error('Error loading profile:', error);
    showError('userGiveaways', 'Gagal memuat data profil: ' + error.message);
  }
}

function updateUserStats(stats) {
  const totalGiveaways = document.getElementById('totalGiveaways');
  const totalParticipations = document.getElementById('totalParticipations');
  const totalWins = document.getElementById('totalWins');
  const totalTickets = document.getElementById('totalTickets');

  if (totalGiveaways) totalGiveaways.textContent = stats.total_giveaways || 0;
  if (totalParticipations) totalParticipations.textContent = stats.total_participations || 0;
  if (totalWins) totalWins.textContent = stats.total_wins || 0;
  if (totalTickets) totalTickets.textContent = stats.total_tickets || 0;
}

function updateProfileDetails(userData) {
  const profileFullname = document.getElementById('profileFullname');
  const profileUsername = document.getElementById('profileUsername');
  const profileAvatar = document.getElementById('profileAvatar');
  const profileBio = document.getElementById('profileBio');

  if (profileFullname) profileFullname.textContent = userData.fullname || 'No Name';
  if (profileUsername) profileUsername.textContent = userData.username ? `@${userData.username}` : '-';
  if (profileAvatar) {
    // Gunakan avatar dari userData, fallback ke UI Avatars
    if (userData.avatar && !userData.avatar.includes('placeholder')) {
      profileAvatar.src = userData.avatar;
    } else {
      profileAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.fullname || 'User')}&background=1e88e5&color=fff&size=120&bold=true`;
    }
  }
  if (profileBio) {
    const joined = userData.first_seen ? formatDate(userData.first_seen) : 'Member since 2024';
    profileBio.textContent = joined;
  }
}

function displayUserGiveaways(giveaways) {
  const container = document.getElementById('userGiveaways');
  if (!container) return;

  if (!giveaways || giveaways.length === 0) {
    container.innerHTML = '<div class="alert alert-info">Belum ada giveaway yang dibuat</div>';
    return;
  }

  container.innerHTML = giveaways.map(giveaway => {
    const status = giveaway.status === 'active' ? 'Aktif' : 'Berakhir';
    const statusClass = giveaway.status === 'active' ? 'success' : 'secondary';

    return `
      <div class="giveaway-item" onclick="window.location.href='giveaway.html?giveaway_id=${giveaway.giveaway_id}'">
        <div>
          <h4>🎁 ${giveaway.prize}</h4>
          <p>👥 ${giveaway.participants_count || 0} peserta</p>
          <small>Dibuat: ${formatDate(giveaway.created_at)}</small>
        </div>
        <div>
          <span class="giveaway-status status-${statusClass}">${status}</span>
        </div>
      </div>
    `;
  }).join('');
}

// Load profile on page load
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.includes('profile.html')) {
    console.log('📄 Profile page detected');

    // Jika window.currentUser sudah ada (dari telegram.js), langsung load
    if (window.currentUser) {
      console.log('✅ currentUser already available:', window.currentUser);
      loadUserProfile();
      return;
    }

    // Jika belum, tunggu event dari telegram.js
    const onTelegramReady = (event) => {
      console.log('📡 telegramUserReady event received in profile.js');
      window.removeEventListener('telegramUserReady', onTelegramReady);
      loadUserProfile();
    };

    window.addEventListener('telegramUserReady', onTelegramReady);

    // Timeout setelah 3 detik
    setTimeout(() => {
      window.removeEventListener('telegramUserReady', onTelegramReady);
      
      // Cek localStorage
      const savedUser = localStorage.getItem('giftfreebies_user');
      if (savedUser) {
        try {
          window.currentUser = JSON.parse(savedUser);
          console.log('✅ Loaded user from localStorage:', window.currentUser);
          loadUserProfile();
        } catch (e) {
          console.error('Error parsing saved user:', e);
          loadUserProfile(); // Coba load dengan window.currentUser yang mungkin null
        }
      } else {
        loadUserProfile(); // Coba load dengan window.currentUser yang mungkin null
      }
    }, 3000);
  }
});
