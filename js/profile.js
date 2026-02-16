// Load user profile data
async function loadUserProfile() {
  if (!currentUser) return;

  try {
    // Load user stats
    const stats = await apiCall(`/api/user/${currentUser.user_id}/stats`);
    updateUserStats(stats);

    // Load user giveaways
    const giveaways = await apiCall(`/api/user/${currentUser.user_id}/giveaways`);
    displayUserGiveaways(giveaways);

    // Load profile details
    const userData = await apiCall(`/api/user/${currentUser.user_id}`);
    updateProfileDetails(userData);

  } catch (error) {
    console.error('Error loading profile:', error);
    showError('userGiveaways', 'Gagal memuat data profil');
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
  if (profileUsername) profileUsername.textContent = `@${userData.username || 'username'}`;
  if (profileAvatar) profileAvatar.src = userData.avatar || 'https://via.placeholder.com/120';
  if (profileBio) {
    const joined = formatDate(userData.first_seen);
    profileBio.textContent = `Member since ${joined}`;
  }
}

function displayUserGiveaways(giveaways) {
  const container = document.getElementById('userGiveaways');
  if (!container) return;

  if (giveaways.length === 0) {
    container.innerHTML = '<div class="alert alert-info">Belum ada giveaway yang dibuat</div>';
    return;
  }

  container.innerHTML = giveaways.map(giveaway => {
    const status = giveaway.status === 'active' ? 'Aktif' : 'Berakhir';
    const statusClass = giveaway.status === 'active' ? 'success' : 'secondary';

    return `
            <div class="giveaway-item">
                <div>
                    <h4>🎁 ${giveaway.prize}</h4>
                    <p>👥 ${giveaway.participants_count || 0} peserta | 🎫 ${giveaway.total_tickets || 0} tiket</p>
                    <small>Dibuat: ${formatDate(giveaway.created_at)}</small>
                </div>
                <div>
                    <span class="giveaway-status status-${statusClass}">${status}</span>
                    <br>
                    <button class="btn-small" onclick="window.location.href='giveaway.html?giveaway_id=${giveaway.giveaway_id}'">Detail</button>
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
