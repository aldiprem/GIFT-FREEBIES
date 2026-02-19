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
  let allGiveaways = { active: [], ended: [] }; // Menyimpan semua giveaway dari API

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

  /**
   * Show toast notification
   */
  function showToast(message, type = 'info', duration = 2000) {
    // Cek apakah sudah ada container toast
    let toastContainer = document.querySelector('.toast-container');
    
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'toast-container';
      toastContainer.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        right: 20px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 10px;
        pointer-events: none;
      `;
      document.body.appendChild(toastContainer);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
      color: white;
      padding: 12px 16px;
      border-radius: 12px;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      animation: slideUp 0.3s ease;
      pointer-events: auto;
      text-align: center;
    `;
    toast.textContent = message;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'fadeOut 0.3s ease';
      setTimeout(() => {
        toast.remove();
        if (toastContainer.children.length === 0) {
          toastContainer.remove();
        }
      }, 300);
    }, duration);
  }

  // Tambahkan CSS animations jika belum ada
  if (!document.querySelector('#toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
      @keyframes slideUp {
        from {
          transform: translateY(100%);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
      
      @keyframes fadeOut {
        to {
          opacity: 0;
          transform: translateY(100%);
        }
      }
    `;
    document.head.appendChild(style);
  }

  // ==================== API CALLS ====================
  async function fetchUserFromApi(userId) {
    try {
      console.log(`📡 Fetching user data for ID: ${userId}`);
      const res = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
        headers: { 'Accept': 'application/json' },
        mode: 'cors'
      });
      
      if (!res.ok) {
        console.log(`API response not OK: ${res.status}`);
        return null;
      }
      
      const data = await res.json();
      console.log('📥 User data response:', data);
      
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

  // ==================== FUNGSI: FETCH ALL GIVEAWAYS ====================
  async function fetchAllGiveaways() {
    try {
      console.log('📡 Fetching all giveaways...');
      console.log('API URL:', API_BASE_URL);

      // Ambil active giveaways
      const activeUrl = `${API_BASE_URL}/api/giveaways?status=active&limit=50`;
      console.log('Active URL:', activeUrl);
      
      const activeRes = await fetch(activeUrl, {
        headers: { 'Accept': 'application/json' },
        mode: 'cors'
      });

      // Ambil ended giveaways
      const endedUrl = `${API_BASE_URL}/api/giveaways?status=ended&limit=50`;
      console.log('Ended URL:', endedUrl);
      
      const endedRes = await fetch(endedUrl, {
        headers: { 'Accept': 'application/json' },
        mode: 'cors'
      });

      console.log('Active response status:', activeRes.status);
      console.log('Ended response status:', endedRes.status);

      let activeGiveaways = [];
      let endedGiveaways = [];

      if (activeRes.ok) {
        const activeData = await activeRes.json();
        console.log('Active data:', activeData);
        activeGiveaways = activeData.giveaways || [];
      } else {
        console.warn('Failed to fetch active giveaways:', activeRes.status);
      }

      if (endedRes.ok) {
        const endedData = await endedRes.json();
        console.log('Ended data:', endedData);
        endedGiveaways = endedData.giveaways || [];
      } else {
        console.warn('Failed to fetch ended giveaways:', endedRes.status);
      }

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
  
    console.log(`Displaying ${type} giveaways:`, giveaways);
  
    if (giveaways.length === 0) {
      elements.giveawayContent.innerHTML = `<div class="empty-message">Tidak ada ${type === 'active' ? 'giveaway aktif' : 'giveaway selesai'}</div>`;
      return;
    }
  
    let html = '';
    giveaways.forEach(giveaway => {
      // PERBAIKAN: Pastikan giveaway_id ada
      const giveawayId = giveaway.giveaway_id || giveaway.id;
      const prizeText = Array.isArray(giveaway.prizes) ?
        (giveaway.prizes[0] || 'Giveaway') :
        (giveaway.prizes || 'Giveaway');
      const participants = giveaway.participants_count || 0;
  
      if (type === 'active') {
        const timeRemaining = formatTimeRemaining(giveaway.end_date);
        html += `
          <div class="giveaway-item" data-id="${giveawayId}">
            <h3>${escapeHtml(prizeText)}</h3>
            <p>👥 ${participants} participants • ⏱️ Ends in ${timeRemaining}</p>
          </div>
        `;
      } else {
        const winners = giveaway.winners_count || 0;
        html += `
          <div class="giveaway-item" data-id="${giveawayId}">
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
      console.log(`📡 Fetching giveaway detail for ID: ${id}`);
      const response = await fetch(`${API_BASE_URL}/api/giveaways/${id}`, {
        headers: { 'Accept': 'application/json' },
        mode: 'cors'
      });
      
      if (!response.ok) {
        if (response.status === 404) throw new Error('Giveaway tidak ditemukan');
        throw new Error(`Gagal memuat data: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('📥 Giveaway detail response:', result);
      
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

  /**
   * Menerapkan tema Telegram ke CSS variables
   */
  function applyTelegramTheme(tg) {
    if (!tg || !tg.themeParams) return;
    
    try {
      const theme = tg.themeParams;
      console.log('🎨 Applying Telegram theme');
      
      if (theme.bg_color) {
        document.documentElement.style.setProperty('--tg-theme-bg-color', theme.bg_color);
      }
      if (theme.text_color) {
        document.documentElement.style.setProperty('--tg-theme-text-color', theme.text_color);
      }
      if (theme.hint_color) {
        document.documentElement.style.setProperty('--tg-theme-hint-color', theme.hint_color);
      }
      if (theme.link_color) {
        document.documentElement.style.setProperty('--tg-theme-link-color', theme.link_color);
      }
      if (theme.button_color) {
        document.documentElement.style.setProperty('--tg-theme-button-color', theme.button_color);
      }
      if (theme.button_text_color) {
        document.documentElement.style.setProperty('--tg-theme-button-text-color', theme.button_text_color);
      }
    } catch (themeError) {
      console.warn('⚠️ Error applying Telegram theme:', themeError);
    }
  }

  /**
   * Setup event listeners tambahan
   */
  function setupAdditionalEventListeners() {
    // Handle tombol back browser
    window.addEventListener('popstate', (event) => {
      console.log('📍 Popstate event:', event);
      // Refresh data saat user navigasi
      if (!window.location.search.includes('search=')) {
        // Jika tidak ada parameter search, refresh halaman utama
        window.location.reload();
      }
    });
    
    // Handle visibility change (misal user switch tab)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        console.log('👀 Tab menjadi aktif - refresh data jika perlu');
        // Refresh data jika diperlukan
        if (!window.location.search.includes('search=')) {
          // Refresh giveaway list
          fetchAllGiveaways().then(giveaways => {
            allGiveaways = giveaways;
            displayGiveaways(currentGiveawayType);
          });
        }
      }
    });
    
    // Handle online/offline
    window.addEventListener('online', () => {
      console.log('🌐 Koneksi internet tersambung kembali');
      showToast('Koneksi internet tersambung kembali', 'success', 2000);
      
      // Refresh data
      if (!window.location.search.includes('search=')) {
        fetchAllGiveaways().then(giveaways => {
          allGiveaways = giveaways;
          displayGiveaways(currentGiveawayType);
        });
      }
    });
    
    window.addEventListener('offline', () => {
      console.log('📡 Koneksi internet terputus');
      showToast('Koneksi internet terputus', 'warning', 3000);
    });
  }

  // ==================== INIT UTAMA ====================
  async function init() {
    console.log('🚀 INITIALIZING APPLICATION...');
    
    try {
      // ==================== CEK KONEKSI API ====================
      console.log('🔍 Checking API connection...');
      let apiConnected = false;
      
      try {
        const healthCheck = await fetch(`${API_BASE_URL}/api/health`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          mode: 'cors'
        });
        
        if (healthCheck.ok) {
          const healthData = await healthCheck.json();
          console.log('✅ API Connected:', healthData);
          apiConnected = true;
        } else {
          console.warn('⚠️ API health check failed:', healthCheck.status);
        }
      } catch (healthError) {
        console.warn('⚠️ API connection error:', healthError.message);
      }
      
      if (!apiConnected) {
        console.warn('⚠️ Using application in offline mode - some features may be limited');
        showToast('⚠️ Koneksi ke server terputus. Beberapa fitur mungkin tidak berfungsi.', 'warning', 3000);
      }
      
      // ==================== CEK PARAMETER URL ====================
      const urlParams = new URLSearchParams(window.location.search);
      const giveawayIdFromUrl = urlParams.get('search');
      console.log('🔍 URL search param:', giveawayIdFromUrl);
    
      // ==================== CEK PARAMETER TELEGRAM ====================
      let telegramStartParam = null;
      let telegramUserData = null;
      
      if (window.Telegram?.WebApp) {
        console.log('📱 Running inside Telegram Web App');
        const tg = window.Telegram.WebApp;
        
        // Expand dan ready kan Web App
        tg.expand();
        tg.ready();
        
        // Ambil start_param
        if (tg.initDataUnsafe?.start_param) {
          telegramStartParam = tg.initDataUnsafe.start_param;
          console.log('📱 Telegram start_param:', telegramStartParam);
        }
        
        // Ambil data user
        if (tg.initDataUnsafe?.user) {
          telegramUserData = tg.initDataUnsafe.user;
          console.log('📱 Telegram user data:', telegramUserData);
        }
        
        // Terapkan tema Telegram
        applyTelegramTheme(tg);
      } else {
        console.log('🌐 Running in standalone web browser');
      }
    
      // ==================== PRIORITASKAN ID GIVEAWAY ====================
      // Prioritaskan: URL param > Telegram start_param
      const finalGiveawayId = giveawayIdFromUrl || telegramStartParam;
    
      if (finalGiveawayId) {
        // === MODE DETAIL GIVEAWAY ===
        console.log('🎯 Menampilkan detail giveaway untuk ID:', finalGiveawayId);
        
        try {
          // Tampilkan loading
          if (elements.loading) {
            elements.loading.style.display = 'flex';
            const loadingText = elements.loading.querySelector('p');
            if (loadingText) loadingText.textContent = 'Memuat detail giveaway...';
          }
          
          // Sembunyikan error jika sebelumnya muncul
          if (elements.error) elements.error.style.display = 'none';
          
          // Fetch data giveaway
          console.log('📡 Fetching giveaway detail...');
          const giveawayData = await fetchGiveawayDetail(finalGiveawayId);
          
          if (!giveawayData) {
            throw new Error('Data giveaway tidak ditemukan');
          }
          
          console.log('✅ Giveaway data loaded:', giveawayData);
          
          // Sembunyikan loading
          if (elements.loading) elements.loading.style.display = 'none';
          
          // Render detail giveaway
          renderGiveawayDetail(giveawayData);
          
        } catch (error) {
          console.error('❌ Gagal memuat detail giveaway:', error);
          
          // Sembunyikan loading
          if (elements.loading) elements.loading.style.display = 'none';
          
          // Tampilkan error
          showError(
            error.message || 'Gagal memuat detail giveaway. Pastikan koneksi internet Anda stabil.',
            true
          );
        }
        
        return; // STOP EKSEKUSI DI SINI
      }
    
      // ==================== MODE PROFIL (TANPA PARAMETER) ====================
      console.log('👤 Mode profil - menampilkan halaman utama');
      
      let user = null;
      
      // ==================== AMBIL DATA USER ====================
      if (telegramUserData) {
        // Ada user Telegram
        console.log('📱 Menggunakan data user Telegram');
        
        try {
          // Coba ambil data user dari API
          const apiUser = await fetchUserFromApi(telegramUserData.id);
          
          if (apiUser) {
            // Gabungkan data dari Telegram dan API
            user = { 
              ...telegramUserData, 
              ...apiUser,
              // Pastikan field-field penting ada
              fullname: apiUser.fullname || [telegramUserData.first_name, telegramUserData.last_name].filter(Boolean).join(' '),
              username: apiUser.username || telegramUserData.username,
              is_premium: apiUser.is_premium || telegramUserData.is_premium || false
            };
            console.log('✅ Data user dari API:', apiUser);
          } else {
            // Fallback ke data Telegram saja
            user = telegramUserData;
            console.log('ℹ️ Menggunakan data user Telegram (tanpa data API)');
          }
        } catch (userError) {
          console.error('❌ Error fetching user from API:', userError);
          // Fallback ke data Telegram
          user = telegramUserData;
          console.log('ℹ️ Fallback ke data user Telegram karena error API');
        }
        
      } else {
        // Guest mode (tidak di Telegram atau tidak ada data user)
        console.log('👤 Menggunakan guest mode');
        user = { ...guestUser }; // Copy guest user
      }
      
      // ==================== UPDATE UI PROFIL ====================
      try {
        await updateUI(user);
        console.log('✅ UI profil berhasil diupdate');
      } catch (uiError) {
        console.error('❌ Error updating UI:', uiError);
        showError('Gagal menampilkan profil. Silakan refresh halaman.', false);
      }
      
      // ==================== FETCH GIVEAWAYS ====================
      try {
        console.log('📡 Fetching all giveaways...');
        allGiveaways = await fetchAllGiveaways();
        
        if (allGiveaways.active.length === 0 && allGiveaways.ended.length === 0) {
          console.log('ℹ️ Tidak ada giveaway ditemukan');
          showToast('Belum ada giveaway yang tersedia', 'info', 2000);
        } else {
          console.log(`✅ Loaded ${allGiveaways.active.length} active, ${allGiveaways.ended.length} ended giveaways`);
        }
      } catch (giveawaysError) {
        console.error('❌ Error fetching giveaways:', giveawaysError);
        allGiveaways = { active: [], ended: [] };
        showToast('Gagal memuat daftar giveaway', 'error', 3000);
      }
      
      // ==================== TAMPILKAN GIVEAWAY ====================
      try {
        // Aktifkan tombol active secara default
        if (elements.activeBtn) elements.activeBtn.classList.add('active');
        if (elements.endedBtn) elements.endedBtn.classList.remove('active');
        
        // Tampilkan giveaway active
        displayGiveaways('active');
        console.log('✅ Giveaway ditampilkan');
      } catch (displayError) {
        console.error('❌ Error displaying giveaways:', displayError);
        if (elements.giveawayContent) {
          elements.giveawayContent.innerHTML = `
            <div class="empty-message">
              <p>Gagal menampilkan giveaway</p>
              <button onclick="location.reload()" class="retry-btn">Coba Lagi</button>
            </div>
          `;
        }
      }
      
      // ==================== SETUP EVENT LISTENERS TAMBAHAN ====================
      setupAdditionalEventListeners();
      
      console.log('🎉 Inisialisasi selesai!');
      
    } catch (fatalError) {
      // Fatal error - sesuatu yang sangat salah
      console.error('💥 Fatal error in init():', fatalError);
      
      // Tampilkan error di UI
      if (elements.loading) elements.loading.style.display = 'none';
      if (elements.error) {
        elements.error.style.display = 'flex';
        const errorDiv = elements.error.querySelector('div');
        if (errorDiv) {
          errorDiv.textContent = '❌ Terjadi kesalahan fatal. Silakan refresh halaman.';
        }
      }
    }
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