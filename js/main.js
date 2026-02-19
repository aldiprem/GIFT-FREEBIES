// Main JavaScript for Gift Freebies Telegram App
(function() {
  console.log('🎁 GIFT FREEBIES - Script started...');

  // ==================== FUNGSI GETARAN ====================
  function vibrate(duration = 20) {
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(duration);
    }
  }

  // ==================== KONFIGURASI ====================
  const API_BASE_URL = 'https://individually-threaded-jokes-letting.trycloudflare.com';

  // ==================== DOM ELEMENTS ====================
  const elements = {
    loading: document.getElementById('loading'),
    error: document.getElementById('error'),
    profileContent: document.getElementById('profileContent'),
    profilePhoto: document.getElementById('profilePhoto'),
    profilePhotoWrapper: document.getElementById('profilePhotoWrapper'),
    profileNameDisplay: document.getElementById('profileNameDisplay'),
    profileUsernameDisplay: document.getElementById('profileUsernameDisplay'),
    profileIdDisplay: document.getElementById('profileIdDisplay'),
    totalCreate: document.getElementById('totalCreate'),
    languageCode: document.getElementById('languageCode'),
    participations: document.getElementById('participations'),
    wins: document.getElementById('wins'),
    settingsBtn: document.getElementById('settingsBtn'),
    activeBtn: document.getElementById('activeBtn'),
    endedBtn: document.getElementById('endedBtn'),
    giveawayContent: document.getElementById('giveawayContent'),
    createGiveawayBtn: document.getElementById('createGiveawayBtn'),
    giveawayButtons: document.querySelector('.giveaway-buttons')
  };

  // ==================== STATE ====================
  let currentUser = null;
  let currentGiveawayType = 'active'; // 'active' atau 'ended'
  let allGiveaways = []; // Menyimpan semua giveaway dari API

  // ==================== GUEST USER DATA ====================
  const guestUser = {
    id: 999999999,
    first_name: 'Guest',
    last_name: 'User',
    username: 'guest',
    language_code: 'id',
    is_premium: false,
    total_participations: 0,
    total_wins: 0
  };

  // ==================== FUNGSI UTILITY ====================
  function showError(msg, isDetailError = false) {
    vibrate(30);
    if (elements.loading) elements.loading.style.display = 'none';
    if (elements.error) {
      elements.error.style.display = 'flex';
      const errorDiv = elements.error.querySelector('div');
      if (errorDiv) errorDiv.textContent = `❌ ${msg}`;
    }
    if (isDetailError && elements.profileContent) {
      elements.profileContent.style.display = 'none';
    }
  }

  function showProfile() {
    if (elements.loading) elements.loading.style.display = 'none';
    if (elements.error) elements.error.style.display = 'none';
    if (elements.profileContent) elements.profileContent.style.display = 'block';
    if (elements.giveawayButtons) elements.giveawayButtons.style.display = 'flex';
  }

  function generateAvatarUrl(name) {
    if (!name) return 'https://ui-avatars.com/api/?name=U&size=120&background=1e88e5&color=fff';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name.charAt(0).toUpperCase())}&size=120&background=1e88e5&color=fff`;
  }

  function addPremiumIndicator(isPremium) {
    if (!elements.profilePhotoWrapper) return;
    const oldIndicator = elements.profilePhotoWrapper.querySelector('.premium-indicator, .free-indicator');
    if (oldIndicator) oldIndicator.remove();
    const indicator = document.createElement('div');
    indicator.className = isPremium ? 'premium-indicator' : 'free-indicator';
    elements.profilePhotoWrapper.appendChild(indicator);
  }

  function formatDate(dateString) {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('id-ID', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  }

  function formatTimeRemaining(endDate) {
    if (!endDate) return 'Tidak terbatas';
    
    const now = new Date();
    const end = new Date(endDate);
    const diff = end - now;
    
    if (diff <= 0) return 'Berakhir';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days} hari`;
    if (hours > 0) return `${hours} jam`;
    if (minutes > 0) return `${minutes} menit`;
    return 'Beberapa detik';
  }

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ==================== API CALLS ====================
  async function fetchUserFromApi(userId) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
        headers: { 'Accept': 'application/json' },
        mode: 'cors'
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.success ? data.user : (data.user || null);
    } catch (error) {
      console.log('API fetch error:', error);
      return null;
    }
  }

  async function fetchUserGiveawayCount(userId) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/giveaways/user/${userId}?limit=1`, {
        headers: { 'Accept': 'application/json' },
        mode: 'cors'
      });
      if (!res.ok) return 0;
      const data = await res.json();
      return data.count || 0;
    } catch (error) {
      console.log('Giveaway count fetch error:', error);
      return 0;
    }
  }

  // ==================== FUNGSI BARU: FETCH ALL GIVEAWAYS ====================
  async function fetchAllGiveaways() {
    try {
      console.log('📡 Fetching all giveaways...');
      
      // Ambil active giveaways
      const activeRes = await fetch(`${API_BASE_URL}/api/giveaways?status=active&limit=50`, {
        headers: { 'Accept': 'application/json' },
        mode: 'cors'
      });
      
      // Ambil ended giveaways
      const endedRes = await fetch(`${API_BASE_URL}/api/giveaways?status=ended&limit=50`, {
        headers: { 'Accept': 'application/json' },
        mode: 'cors'
      });
      
      const activeData = activeRes.ok ? await activeRes.json() : { giveaways: [] };
      const endedData = endedRes.ok ? await endedRes.json() : { giveaways: [] };
      
      const activeGiveaways = activeData.giveaways || [];
      const endedGiveaways = endedData.giveaways || [];
      
      console.log(`✅ Loaded ${activeGiveaways.length} active, ${endedGiveaways.length} ended giveaways`);
      
      return {
        active: activeGiveaways,
        ended: endedGiveaways
      };
    } catch (error) {
      console.error('❌ Error fetching giveaways:', error);
      return { active: [], ended: [] };
    }
  }

  // ==================== FUNGSI: DISPLAY GIVEAWAYS ====================
  function displayGiveaways(type) {
    vibrate(15);
    currentGiveawayType = type;
    
    const giveaways = allGiveaways[type] || [];
    
    if (giveaways.length === 0) {
      elements.giveawayContent.innerHTML = `<div class="empty-message">Tidak ada ${type === 'active' ? 'giveaway aktif' : 'giveaway selesai'}</div>`;
      return;
    }
    
    let html = '';
    giveaways.forEach(giveaway => {
      const prizeText = Array.isArray(giveaway.prizes) ? giveaway.prizes[0] : (giveaway.prizes || 'Giveaway');
      const participants = giveaway.participants_count || 0;
      
      if (type === 'active') {
        const timeRemaining = formatTimeRemaining(giveaway.end_date);
        html += `
          <div class="giveaway-item" data-id="${giveaway.giveaway_id}">
            <h3>${escapeHtml(prizeText)}</h3>
            <p>👥 ${participants} participants • ⏱️ Ends in ${timeRemaining}</p>
          </div>
        `;
      } else {
        const winners = giveaway.winners_count || 0;
        html += `
          <div class="giveaway-item" data-id="${giveaway.giveaway_id}">
            <h3>${escapeHtml(prizeText)}</h3>
            <p>🏆 ${winners} winners • Ended</p>
          </div>
        `;
      }
    });
    
    elements.giveawayContent.innerHTML = html;
    
    // Tambahkan event listener ke setiap item giveaway
    document.querySelectorAll('.giveaway-item').forEach(item => {
      item.addEventListener('click', () => {
        const giveawayId = item.dataset.id;
        if (giveawayId) {
          window.location.href = `?search=${giveawayId}`;
        }
      });
    });
  }

  // ==================== FUNGSI: FETCH GIVEAWAY DETAIL ====================
  async function fetchGiveawayDetail(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/giveaways/${id}`, {
        headers: { 'Accept': 'application/json' },
        mode: 'cors'
      });
      if (!response.ok) {
        if (response.status === 404) throw new Error('Giveaway tidak ditemukan');
        throw new Error(`Gagal memuat data: ${response.status}`);
      }
      const result = await response.json();
      if (result.success && result.giveaway) {
        return result.giveaway;
      } else {
        throw new Error('Data giveaway tidak valid');
      }
    } catch (error) {
      console.error('❌ Error fetching giveaway:', error);
      throw error;
    }
  }

  // ==================== FUNGSI: RENDER GIVEAWAY DETAIL ====================
  function renderGiveawayDetail(giveaway) {
    // Sembunyikan elemen profil dan tombol giveaway
    if (elements.profileContent) elements.profileContent.style.display = 'none';
    if (elements.giveawayButtons) elements.giveawayButtons.style.display = 'none';
    if (elements.loading) elements.loading.style.display = 'none';
    if (elements.error) elements.error.style.display = 'none';

    const container = elements.giveawayContent;
    if (!container) return;

    // Tentukan status
    let statusClass = 'status-badge';
    let statusText = giveaway.status || 'Active';
    const now = new Date();
    const endDate = giveaway.end_date ? new Date(giveaway.end_date) : null;
    if (giveaway.status === 'active' && endDate && now > endDate) {
      statusText = 'Expired';
      statusClass += ' expired';
    } else if (giveaway.status === 'ended') {
      statusText = 'Ended';
      statusClass += ' ended';
    } else if (giveaway.status === 'deleted') {
      statusText = 'Deleted';
      statusClass += ' expired';
    }

    // Siapkan data untuk ditampilkan
    const creator = giveaway.creator || {};
    const prizes = Array.isArray(giveaway.prizes) ? giveaway.prizes : [];
    const requirements = Array.isArray(giveaway.requirements) ? giveaway.requirements : [];
    const channels = Array.isArray(giveaway.channels) ? giveaway.channels : [];
    const links = Array.isArray(giveaway.links) ? giveaway.links : [];

    // Buat HTML untuk hadiah
    let prizesHtml = '';
    if (prizes.length === 0) {
      prizesHtml = '<div class="prize-item">Tidak ada hadiah</div>';
    } else {
      const colors = ['#FF6B6B', '#4ECDC4', '#FFD166', '#A06CD5', '#F7B731'];
      prizes.forEach((prize, index) => {
        const bgColor = colors[index % colors.length];
        prizesHtml += `<div class="prize-item"><span class="prize-number" style="background: ${bgColor};">${index + 1}</span> ${escapeHtml(prize)}</div>`;
      });
    }

    // Buat HTML untuk syarat
    let reqHtml = '';
    if (requirements.length === 0) {
      reqHtml = '<div class="requirement-item">Tidak ada syarat khusus</div>';
    } else {
      requirements.forEach(req => {
        let icon = '🔘';
        let label = req;
        if (req === 'subscribe') { icon = '🔔'; label = 'Subscribe Channel'; }
        else if (req === 'premium') { icon = '⭐'; label = 'Akun Premium'; }
        else if (req === 'nonpremium') { icon = '👤'; label = 'Akun Non-Premium'; }
        else if (req === 'aktif') { icon = '✅'; label = 'Akun Aktif'; }
        else if (req === 'share') { icon = '📤'; label = 'Share Postingan'; }
        reqHtml += `<div class="requirement-item"><span class="requirement-icon">${icon}</span> <span>${label}</span></div>`;
      });
    }

    // Buat HTML untuk channel
    let channelsHtml = '';
    if (channels.length > 0) {
      channelsHtml = '<div class="section-title" style="display: flex;"><span class="section-icon">📢</span><span>Channel/Group yang Harus Diikuti</span></div><div class="channels-section">';
      channels.forEach(ch => {
        const channelName = typeof ch === 'string' ? ch : (ch.title || ch.username || 'Channel');
        const username = typeof ch === 'string' ? ch.replace('@', '') : (ch.username || '').replace('@', '');
        const isVerified = typeof ch !== 'string' && ch.is_verified;
        channelsHtml += `
          <div class="channel-item">
            <div class="channel-icon">📢</div>
            <div class="channel-info">
              <div class="channel-name">${escapeHtml(channelName)} ${isVerified ? '<span class="channel-verified">✅</span>' : ''}</div>
              <div class="channel-username">${username}</div>
            </div>
            <a href="https://t.me/${username}" target="_blank" class="channel-btn">Buka</a>
          </div>`;
      });
      channelsHtml += '</div>';
    }

    // Buat HTML untuk link
    let linksHtml = '';
    if (links.length > 0) {
      linksHtml = '<div class="section-title" style="display: flex;"><span class="section-icon">🔗</span><span>Tautan Terkait</span></div><div class="links-section">';
      links.forEach(link => {
        const title = link.title || 'Tautan';
        const url = link.url || '#';
        linksHtml += `
          <div class="link-item" onclick="window.open('${escapeHtml(url)}', '_blank')">
            <div class="link-icon">🔗</div>
            <div class="link-info">
              <div class="link-title">${escapeHtml(title)}</div>
              <div class="link-url">${escapeHtml(url)}</div>
            </div>
          </div>`;
      });
      linksHtml += '</div>';
    }

    // Gabungkan semua HTML
    const detailHtml = `
      <div class="giveaway-detail-container">
        <div class="giveaway-header">
          <div class="${statusClass}">${statusText}</div>
          <div class="giveaway-id">ID: ${giveaway.giveaway_id || giveaway.id || '-'}</div>
          <button class="back-from-detail-btn" id="backFromDetailBtn">← Kembali</button>
        </div>

        <div class="creator-section">
          <div class="creator-avatar">${creator.fullname ? creator.fullname.charAt(0).toUpperCase() : '?'}</div>
          <div class="creator-info">
            <div class="creator-name">${escapeHtml(creator.fullname || 'Unknown Creator')}</div>
            <div class="creator-username">${creator.username || 'unknown'}</div>
          </div>
        </div>

        <div class="section-title"><span class="section-icon">🎁</span><span>Hadiah</span></div>
        <div class="prizes-section">${prizesHtml}</div>

        <div class="section-title"><span class="section-icon">📄</span><span>Deskripsi Giveaway</span></div>
        <div class="text-section">${giveaway.giveaway_text || '<em>Tidak ada deskripsi</em>'}</div>

        <div class="section-title"><span class="section-icon">🔐</span><span>Syarat Mengikuti</span></div>
        <div class="requirements-section">${reqHtml}</div>

        ${channelsHtml}
        ${linksHtml}

        <div class="duration-section">
          <div class="duration-item"><span class="duration-label">Dibuat Pada</span><span class="duration-value">${formatDate(giveaway.created_at)}</span></div>
          <div class="duration-item"><span class="duration-label">Berakhir Pada</span><span class="duration-value">${formatDate(giveaway.end_date)}</span></div>
          <div class="duration-item"><span class="duration-label">Sisa Waktu</span><span class="duration-value countdown" id="detailCountdown">-</span></div>
        </div>

        <div class="captcha-section">
          <div class="captcha-item">
            <span class="captcha-label">CAPTCHA</span>
            <span class="captcha-status ${giveaway.captcha_enabled ? '' : 'disabled'}">${giveaway.captcha_enabled ? 'Aktif' : 'Nonaktif'}</span>
          </div>
        </div>

        <div class="stats-section">
          <div class="stat-item"><div class="stat-value">${giveaway.participants_count || 0}</div><div class="stat-label">Peserta</div></div>
          <div class="stat-item"><div class="stat-value">${giveaway.winners_count || 0}</div><div class="stat-label">Pemenang</div></div>
          <div class="stat-item"><div class="stat-value">${giveaway.participants_count || 0}</div><div class="stat-label">Total Tiket</div></div>
        </div>

        <div class="action-buttons" id="detailActionButtons">
          ${statusText === 'Active' ? '<button class="btn btn-primary" id="detailJoinBtn"><span class="btn-icon">✓</span><span class="btn-text">Ikuti Giveaway</span></button>' : ''}
          <button class="btn btn-secondary" id="detailShareBtn"><span class="btn-icon">📤</span><span class="btn-text">Bagikan</span></button>
        </div>
      </div>
    `;

    container.innerHTML = detailHtml;
    container.style.display = 'block';

    // Mulai countdown jika ada end date
    if (giveaway.end_date) {
      startCountdown(giveaway.end_date, giveaway.status);
    }

    // Event listener untuk tombol kembali
    const backBtn = document.getElementById('backFromDetailBtn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        window.location.href = 'index.html';
      });
    }

    // Event listener untuk tombol share
    const shareBtn = document.getElementById('detailShareBtn');
    if (shareBtn) {
      shareBtn.addEventListener('click', () => shareGiveaway(window.location.href, prizes[0]));
    }

    // Event listener untuk tombol join
    const joinBtn = document.getElementById('detailJoinBtn');
    if (joinBtn) {
      joinBtn.addEventListener('click', () => {
        alert('Fitur join sedang dalam pengembangan.');
      });
    }
  }

  // ==================== FUNGSI: COUNTDOWN ====================
  function startCountdown(endDate, status) {
    const countdownEl = document.getElementById('detailCountdown');
    if (!countdownEl) return;

    function updateCountdown() {
      const now = new Date();
      const end = new Date(endDate);
      const diff = end - now;

      if (diff <= 0 || status !== 'active') {
        countdownEl.textContent = (status === 'active') ? 'Berakhir' : (status === 'ended' ? 'Selesai' : '-');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      let text = '';
      if (days > 0) text += `${days} hari `;
      if (hours > 0 || days > 0) text += `${hours} jam `;
      if (minutes > 0 || hours > 0 || days > 0) text += `${minutes} menit `;
      text += `${seconds} detik`;
      countdownEl.textContent = text;
    }

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    window.countdownInterval = interval;
  }

  function shareGiveaway(url, prize) {
    const text = `Ikuti giveaway ini: ${prize || 'Giveaway'} - ${url}`;
    if (navigator.share) {
      navigator.share({ title: 'GiftFreebies Giveaway', text: text, url: url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => alert('Link giveaway disalin!')).catch(() => {});
    }
  }

  // ==================== UPDATE UI PROFIL ====================
  async function updateUI(user) {
    const fullName = user.fullname || [user.first_name, user.last_name].filter(Boolean).join(' ') || 'No Name';
    const username = user.username ? (user.username.startsWith('@') ? user.username : `@${user.username}`) : '(no username)';
    const isPremium = user.is_premium || false;
    const userId = user.user_id || user.id || '-';

    if (elements.profileNameDisplay) elements.profileNameDisplay.textContent = fullName;
    if (elements.profileUsernameDisplay) elements.profileUsernameDisplay.textContent = username;
    if (elements.profileIdDisplay) elements.profileIdDisplay.textContent = `ID: ${userId}`;

    const totalCreate = await fetchUserGiveawayCount(userId);

    if (elements.totalCreate) elements.totalCreate.textContent = totalCreate;
    if (elements.languageCode) elements.languageCode.textContent = (user.language_code || 'id').toUpperCase();
    if (elements.participations) elements.participations.textContent = user.total_participations || 0;
    if (elements.wins) elements.wins.textContent = user.total_wins || 0;

    if (elements.profilePhoto) {
      elements.profilePhoto.src = user.photo_url || generateAvatarUrl(fullName);
    }

    addPremiumIndicator(isPremium);
    showProfile();
  }

  // ==================== INIT UTAMA ====================
  async function init() {
    // Cek parameter URL
    const urlParams = new URLSearchParams(window.location.search);
    const giveawayIdFromUrl = urlParams.get('search');

    if (giveawayIdFromUrl) {
      // === MODE DETAIL GIVEAWAY ===
      console.log('🔍 Menampilkan detail giveaway untuk ID:', giveawayIdFromUrl);
      try {
        const giveawayData = await fetchGiveawayDetail(giveawayIdFromUrl);
        if (elements.loading) elements.loading.style.display = 'none';
        renderGiveawayDetail(giveawayData);
      } catch (error) {
        console.error('Gagal memuat detail giveaway:', error);
        showError(error.message || 'Gagal memuat giveaway', true);
      }
      return;
    }

    // === MODE PROFIL (TANPA PARAMETER) ===
    console.log('👤 Mode profil');
    let user = null;

    // Cek apakah di dalam Telegram
    if (!window.Telegram || !window.Telegram.WebApp) {
      console.log('⚠️ Not in Telegram, using guest mode');
      user = guestUser;
    } else {
      const tg = window.Telegram.WebApp;
      tg.expand();
      tg.ready();

      const telegramUser = tg.initDataUnsafe?.user;
      if (!telegramUser) {
        console.log('⚠️ No Telegram user data, using guest mode');
        user = guestUser;
      } else {
        const apiUser = await fetchUserFromApi(telegramUser.id);
        user = apiUser ? { ...telegramUser, ...apiUser } : telegramUser;
      }
    }

    // Update UI profil
    await updateUI(user);
    
    // Fetch semua giveaway dari API
    allGiveaways = await fetchAllGiveaways();
    
    // Tampilkan giveaway active secara default
    displayGiveaways('active');
  }

  // ==================== EVENT LISTENERS ====================
  if (elements.settingsBtn) {
    elements.settingsBtn.addEventListener('click', () => {
      vibrate(20);
      alert('Settings Menu');
    });
  }

  if (elements.createGiveawayBtn) {
    elements.createGiveawayBtn.addEventListener('click', () => {
      vibrate(15);
      window.location.href = 'create.html';
    });
  }

  if (elements.activeBtn) {
    elements.activeBtn.addEventListener('click', () => {
      vibrate(10);
      elements.activeBtn.classList.add('active');
      if (elements.endedBtn) elements.endedBtn.classList.remove('active');
      displayGiveaways('active');
    });
  }

  if (elements.endedBtn) {
    elements.endedBtn.addEventListener('click', () => {
      vibrate(10);
      elements.endedBtn.classList.add('active');
      if (elements.activeBtn) elements.activeBtn.classList.remove('active');
      displayGiveaways('ended');
    });
  }

  // ==================== START ====================
  init();
})();
