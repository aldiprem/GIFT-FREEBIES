// js/profile.js - UPDATE INI

// Load user profile data
async function loadUserProfile() {
  // Cek apakah ada data Telegram
  if (window.telegramUser) {
    await loadTelegramProfile(window.telegramUser);
  } else if (currentUser) {
    await loadLegacyProfile(currentUser);
  } else {
    showError('userGiveaways', 'Silakan login terlebih dahulu');
  }
}

// Load profile dari Telegram
async function loadTelegramProfile(tgUser) {
  try {
    // Tampilkan loading
    showLoading('userGiveaways');
    
    const API_BASE_URL = 'https://expect-checkout-cologne-dozens.trycloudflare.com'; // GANTI DENGAN URL TUNNEL ANDA
    
    // 1. Ambil data user dari endpoint Telegram style
    const userResponse = await fetch(`${API_BASE_URL}/api/users/${tgUser.id}`);
    if (!userResponse.ok) throw new Error('Gagal mengambil data user');
    const userData = await userResponse.json();
    
    // 2. Ambil balance
    const balanceResponse = await fetch(`${API_BASE_URL}/api/user/balance/${tgUser.id}`);
    const balanceData = await balanceResponse.json();
    
    // 3. Update profile details
    updateProfileDetails({
      fullname: tgUser.first_name + ' ' + (tgUser.last_name || ''),
      username: tgUser.username || '',
      first_seen: new Date().toISOString(),
      avatar: tgUser.photo_url || `https://ui-avatars.com/api/?name=${tgUser.first_name}&size=120&background=1e88e5&color=fff`
    });
    
    // 4. Update stats (hitung dari data yang ada)
    const stats = {
      total_giveaways: userData.user?.added_gifts?.length || 0,
      total_participations: 0, // Sesuaikan dengan API Anda
      total_wins: 0,
      total_tickets: 0
    };
    updateUserStats(stats);
    
    // 5. Tampilkan giveaway dari user
    if (userData.user?.added_gifts) {
      displayUserGiveaways(userData.user.added_gifts.map(gift => ({
        giveaway_id: gift.slug,
        prize: gift.nama || gift.name,
        participants_count: 0,
        total_tickets: 0,
        status: gift.is_listed ? 'active' : 'ended',
        created_at: new Date().toISOString()
      })));
    } else {
      document.getElementById('userGiveaways').innerHTML = '<div class="alert alert-info">Belum ada giveaway yang dibuat</div>';
    }
    
  } catch (error) {
    console.error('Error loading Telegram profile:', error);
    showError('userGiveaways', 'Gagal memuat data profil: ' + error.message);
  }
}

// Load profile legacy (dari currentUser)
async function loadLegacyProfile(user) {
  try {
    showLoading('userGiveaways');
    
    // Load user stats
    const stats = await apiCall(`/api/user/${user.user_id}/stats`);
    updateUserStats(stats);

    // Load user giveaways
    const giveaways = await apiCall(`/api/user/${user.user_id}/giveaways`);
    displayUserGiveaways(giveaways);

    // Load profile details
    const userData = await apiCall(`/api/user/${user.user_id}`);
    updateProfileDetails(userData);

  } catch (error) {
    console.error('Error loading profile:', error);
    showError('userGiveaways', 'Gagal memuat data profil');
  }
}

// Fungsi-fungsi lainnya tetap sama...
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
  if (profileAvatar) profileAvatar.src = userData.avatar || 'https://via.placeholder.com/120';
  if (profileBio) {
    const joined = userData.first_seen ? formatDate(userData.first_seen) : 'Unknown';
    profileBio.textContent = `Member since ${joined}`;
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
    loadUserProfile();
  }
});
