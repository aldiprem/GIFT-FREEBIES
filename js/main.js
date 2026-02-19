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

  // ==================== FUNGSI: FETCH GIVEAWAY DETAIL (DIPINDAHKAN KE ATAS) ====================
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
      
      // Handle berbagai format response
      if (result && result.giveaway_id) {
        // Jika langsung objek giveaway
        return result;
      } else if (result.success && result.giveaway) {
        // Jika dengan properti success
        return result.giveaway;
      } else {
        console.error('Format response tidak dikenal:', result);
        throw new Error('Data giveaway tidak valid');
      }
    } catch (error) {
      console.error('❌ Error fetching giveaway:', error);
      throw error;
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

  // ==================== FUNGSI: RENDER GIVEAWAY DETAIL ====================
  function renderGiveawayDetail(giveaway) {
    if (elements.profileContent) elements.profileContent.style.display = 'none';
    if (elements.giveawayButtons) elements.giveawayButtons.style.display = 'none';
    if (elements.loading) elements.loading.style.display = 'none';
    if (elements.error) elements.error.style.display = 'none';
  
    // ===== SEMBUNYIKAN SEMUA ELEMEN YANG TIDAK DIPERLUKAN =====
    const topContainer = document.querySelector('.top-container');
    if (topContainer) topContainer.style.display = 'none';
  
    const giveawayButtons = document.querySelector('.giveaway-buttons');
    if (giveawayButtons) giveawayButtons.style.display = 'none';
  
    // ===== PENTING: SEMBUNYIKAN SETTINGS BUTTON =====
    if (elements.settingsBtn) elements.settingsBtn.style.display = 'none';
  
    const container = elements.giveawayContent;
    if (!container) return;
  
    // ... (kode untuk prizes, requirements, dll tetap sama) ...
  
    // Gabungkan semua HTML dengan struktur FULL SCREEN TANPA SCROLL
    const detailHtml = `
          <div class="giveaway-detail-page">
              <div class="giveaway-detail-header">
                  <!-- HEADER KOSONG, TOMBOL BACK AKAN DITAMBAHKAN VIA JS -->
              </div>
              
              <div class="detail-content-container">
                  <div class="detail-main-card">
                      <div class="${statusClass}">${statusText}</div>
                      
                      ${mediaHtml}
                      
                      <!-- AREA SCROLL UNTUK KONTEN -->
                      <div class="detail-scroll-area">
                          <div class="detail-section-title">
                              <span class="detail-section-icon">🎁</span>
                              <span class="detail-section-text">Hadiah</span>
                          </div>
                          <div class="detail-prizes-grid">
                              ${prizesHtml}
                          </div>
                          
                          <div class="detail-section-title">
                              <span class="detail-section-icon">📄</span>
                              <span class="detail-section-text">Deskripsi</span>
                          </div>
                          <div class="detail-text-card">
                              ${giveaway.giveaway_text || '<em>Tidak ada deskripsi</em>'}
                          </div>
                          
                          <div class="detail-section-title">
                              <span class="detail-section-icon">🔐</span>
                              <span class="detail-section-text">Syarat</span>
                          </div>
                          <div class="detail-requirements-grid">
                              ${reqHtml}
                          </div>
                          
                          ${channelsHtml ? `
                              <div class="detail-section-title">
                                  <span class="detail-section-icon">📢</span>
                                  <span class="detail-section-text">Channel</span>
                              </div>
                              ${channelsHtml}
                          ` : ''}
                          
                          ${linksHtml ? `
                              <div class="detail-section-title">
                                  <span class="detail-section-icon">🔗</span>
                                  <span class="detail-section-text">Tautan</span>
                              </div>
                              ${linksHtml}
                          ` : ''}
                          
                          <!-- HANYA TAMPILKAN WAKTU BERAKHIR DAN COUNTDOWN -->
                          <div class="detail-timer-card">
                              <div class="detail-timer-label">Berakhir Dalam</div>
                              <div class="detail-timer-value" id="detailCountdown">${timeRemaining}</div>
                              <div class="detail-end-date">${endDateFormatted}</div>
                          </div>
                          
                          <div class="detail-captcha-badge">
                              <span class="detail-captcha-icon">🧩</span>
                              <span class="detail-captcha-text ${giveaway.captcha_enabled ? 'active' : 'inactive'}">
                                  CAPTCHA ${giveaway.captcha_enabled ? 'AKTIF' : 'NONAKTIF'}
                              </span>
                          </div>
                      </div>
                  </div>
              </div>
              
              <div class="detail-action-fixed">
                  <button class="detail-action-btn participate" id="detailParticipateBtn">
                      <span class="detail-action-icon">✓</span>
                      <span>PARTISIPASI</span>
                  </button>
                  <button class="detail-action-btn share" id="detailShareBtn">
                      <span class="detail-action-icon">📤</span>
                      <span>BAGIKAN</span>
                  </button>
              </div>
          </div>
      `;
  
    container.innerHTML = detailHtml;
    container.style.display = 'block';
  
    // ===== TAMBAHKAN TOMBOL BACK (HANYA SEKALI) =====
    const backBtn = document.createElement('button');
    backBtn.className = 'detail-back-btn';
    backBtn.innerHTML = '←';
    backBtn.addEventListener('click', goBackToIndex);
  
    const header = document.querySelector('.giveaway-detail-header');
    if (header) {
      header.appendChild(backBtn);
    }
  
    // Mulai countdown jika ada end date
    if (giveaway.end_date && giveaway.status === 'active') {
      startDetailCountdown(giveaway.end_date);
    }
  
    // Event listener untuk tombol partisipasi
    const participateBtn = document.getElementById('detailParticipateBtn');
    if (participateBtn) {
      participateBtn.addEventListener('click', () => {
        vibrate(15);
        alert('Fitur partisipasi sedang dalam pengembangan.');
      });
    }
  
    // Event listener untuk tombol share
    const shareBtn = document.getElementById('detailShareBtn');
    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        vibrate(10);
        shareGiveaway(window.location.href, prizes[0]);
      });
    }
  }

  // ==================== FUNGSI: KEMBALI KE INDEX ====================
  function goBackToIndex() {
    // Tampilkan kembali elemen yang disembunyikan
    if (elements.profileContent) elements.profileContent.style.display = 'block';
    if (elements.giveawayButtons) elements.giveawayButtons.style.display = 'flex';
    if (elements.settingsBtn) elements.settingsBtn.style.display = 'flex';
  
    // ===== TAMPILKAN KEMBALI TOP CONTAINER DAN GIVEAWAY BUTTONS =====
    const topContainer = document.querySelector('.top-container');
    if (topContainer) topContainer.style.display = 'flex'; // atau 'block' tergantung CSS
  
    const giveawayButtons = document.querySelector('.giveaway-buttons');
    if (giveawayButtons) giveawayButtons.style.display = 'flex';
  
    // Hapus konten detail
    const container = elements.giveawayContent;
    if (container) {
      container.innerHTML = '';
      container.style.display = 'block';
    }
  
    // Hentikan countdown
    if (window.detailCountdownInterval) {
      clearInterval(window.detailCountdownInterval);
    }
  
    // Kembali ke index
    window.location.href = 'index.html';
  }

  // ==================== FUNGSI: COUNTDOWN UNTUK DETAIL ====================
  function startDetailCountdown(endDate) {
      const countdownEl = document.getElementById('detailCountdown');
      if (!countdownEl) return;
  
      function updateCountdown() {
          const now = new Date().getTime();
          const end = new Date(endDate).getTime();
          const diff = end - now;
  
          if (diff <= 0) {
              countdownEl.textContent = '00:00:00:00';
              return;
          }
  
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
          countdownEl.textContent = `${days.toString().padStart(2, '0')}:${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
  
      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);
      window.detailCountdownInterval = interval;
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