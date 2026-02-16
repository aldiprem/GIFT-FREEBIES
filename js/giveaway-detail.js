// Load giveaway detail
async function loadGiveawayDetail(giveawayId) {
  const container = document.getElementById('giveawayDetail');
  if (!container) return;

  showLoading('giveawayDetail');

  try {
    const giveaway = await apiCall(`/api/giveaways/${giveawayId}`);
    displayGiveawayDetail(giveaway);

    // Check if user has already joined
    if (currentUser) {
      checkUserParticipation(giveawayId);
    }
  } catch (error) {
    console.error('Error loading giveaway:', error);
    showError('giveawayDetail', 'Giveaway tidak ditemukan atau sudah berakhir');
  }
}

function displayGiveawayDetail(giveaway) {
  const container = document.getElementById('giveawayDetail');
  if (!container) return;

  const isActive = giveaway.status === 'active' && new Date(giveaway.end_time) > new Date();
  const timeLeft = getTimeLeft(giveaway.end_time);

  container.innerHTML = `
        <div class="giveaway-prize">🏆 ${giveaway.prize}</div>
        
        ${giveaway.prize_description ? `<p>${giveaway.prize_description}</p>` : ''}
        
        <div class="giveaway-meta">
            <div class="meta-item">
                <span class="meta-label">👥 Peserta</span>
                <span class="meta-value">${giveaway.participants_count || 0}</span>
            </div>
            <div class="meta-item">
                <span class="meta-label">🎫 Total Tiket</span>
                <span class="meta-value">${giveaway.total_tickets || 0}</span>
            </div>
            <div class="meta-item">
                <span class="meta-label">🏅 Pemenang</span>
                <span class="meta-value">${giveaway.total_winners}</span>
            </div>
            <div class="meta-item">
                <span class="meta-label">⏰ Sisa Waktu</span>
                <span class="meta-value">${timeLeft}</span>
            </div>
        </div>
        
        <div style="background: rgba(0,0,0,0.2); padding: 1.5rem; border-radius: 12px; margin: 1.5rem 0;">
            <h3>📄 Deskripsi Giveaway</h3>
            <p style="white-space: pre-line; margin-top: 1rem;">${giveaway.giveaway_text}</p>
        </div>
        
        ${giveaway.require_join_channel ? `
            <div class="alert alert-warning">
                ⚠️ Syarat: Wajib join channel ${giveaway.require_join_channels}
            </div>
        ` : ''}
        
        <button class="join-btn" id="joinGiveawayBtn" ${!isActive ? 'disabled' : ''}>
            ${isActive ? '🎯 Ikut Giveaway' : '⏳ Giveaway Telah Berakhir'}
        </button>
        
        <div id="joinResult" style="margin-top: 1rem;"></div>
    `;

  // Add event listener to join button
  const joinBtn = document.getElementById('joinGiveawayBtn');
  if (joinBtn && isActive) {
    joinBtn.addEventListener('click', () => joinGiveaway(giveaway.giveaway_id));
  }
}

function getTimeLeft(endTime) {
  const end = new Date(endTime);
  const now = new Date();

  if (end <= now) return 'Berakhir';

  const diff = end - now;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days} hari ${hours} jam`;
  if (hours > 0) return `${hours} jam ${minutes} menit`;
  return `${minutes} menit`;
}

async function checkUserParticipation(giveawayId) {
  if (!currentUser) return;

  try {
    const result = await apiCall(`/api/giveaways/${giveawayId}/participants/${currentUser.user_id}`);
    if (result.participated) {
      const joinBtn = document.getElementById('joinGiveawayBtn');
      if (joinBtn) {
        joinBtn.textContent = '✅ Anda sudah berpartisipasi';
        joinBtn.disabled = true;
      }
    }
  } catch (error) {
    // Ignore error, user hasn't participated
  }
}

async function joinGiveaway(giveawayId) {
  if (!currentUser) {
    alert('Silakan login terlebih dahulu');
    return;
  }

  const joinBtn = document.getElementById('joinGiveawayBtn');
  const originalText = joinBtn.textContent;
  joinBtn.textContent = '⏳ Memproses...';
  joinBtn.disabled = true;

  try {
    const result = await apiCall(`/api/giveaways/${giveawayId}/join`, 'POST', {
      user_id: currentUser.user_id,
      fullname: currentUser.fullname,
      username: currentUser.username
    });

    document.getElementById('joinResult').innerHTML = `
            <div class="alert alert-success">
                ✅ Berhasil join giveaway! Anda mendapatkan ${result.tickets} tiket.
            </div>
        `;

    joinBtn.textContent = '✅ Anda sudah berpartisipasi';

    // Refresh participant count
    setTimeout(() => {
      loadGiveawayDetail(giveawayId);
    }, 2000);

  } catch (error) {
    console.error('Error joining giveaway:', error);
    document.getElementById('joinResult').innerHTML = `
            <div class="alert alert-error">
                ❌ Gagal join: ${error.message}
            </div>
        `;
    joinBtn.textContent = originalText;
    joinBtn.disabled = false;
  }
}

// Load giveaway if ID in URL
document.addEventListener('DOMContentLoaded', () => {
  const giveawayId = getUrlParameter('giveaway_id') || getUrlParameter('search');
  if (giveawayId && window.location.pathname.includes('giveaway.html')) {
    loadGiveawayDetail(giveawayId);
  }
});
