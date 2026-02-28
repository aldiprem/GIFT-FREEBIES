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
  const API_BASE_URL = 'https://liabilities-trips-veterans-music.trycloudflare.com';

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
    activeParticipations: document.getElementById('activeParticipations'),
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
  let globalNodal = null;
  let currentUser = null;
  let currentGiveawayType = 'active';
  let allGiveaways = { active: [], ended: [] };
  let currentActiveParticipations = 0;
  let currentStatView = 'create';
  
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

  // ==================== FUNGSI CEK CAPTCHA ====================
  function checkCaptchaRequirement(giveaway) {
    // Cek apakah giveaway memiliki syarat captcha
    // Anda perlu menambahkan field captcha_enabled di database
    return giveaway.captcha_enabled === true || giveaway.captcha_enabled === 1;
  }
  
  function openCaptcha(giveawayId) {
    return new Promise((resolve, reject) => {
      // Simpan current URL untuk kembali nanti
      sessionStorage.setItem('captcha_return_url', window.location.href);
      sessionStorage.setItem('captcha_giveaway_id', giveawayId);
  
      // Buka halaman captcha
      window.location.href = 'captcha.html';
  
      // Resolve akan dipanggil saat kembali dari captcha
      // Kita akan handle di halaman captcha
    });
  }
  
  // Fungsi untuk mengecek status captcha dari sessionStorage
  function isCaptchaPassed(giveawayId) {
    const passed = sessionStorage.getItem(`captcha_passed_${giveawayId}`);
    return passed === 'true';
  }
  
  // Fungsi untuk menandai captcha sudah selesai
  function markCaptchaPassed(giveawayId) {
    sessionStorage.setItem(`captcha_passed_${giveawayId}`, 'true');
  }
  
  // Fungsi untuk membersihkan status captcha
  function clearCaptchaStatus(giveawayId) {
    sessionStorage.removeItem(`captcha_passed_${giveawayId}`);
  }

  /**
   * Show toast notification
   */
  function showToast(message, type = 'info', duration = 2000) {
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
  
      if (data.success && data.user) {
        return data.user;
      } else if (data.user) {
        return data.user;
      } else {
        return null;
      }
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
  
        if (activeData.giveaways && Array.isArray(activeData.giveaways)) {
          activeGiveaways = activeData.giveaways;
  
          console.log(`📊 Active giveaways from API: ${activeGiveaways.length}`);
          activeGiveaways.forEach((g, i) => {
            const now = new Date();
            const endDate = g.end_date ? new Date(g.end_date) : null;
            const isExpired = endDate && now > endDate;
            console.log(`  ${i+1}. ID: ${g.giveaway_id || g.id}, Status: ${g.status}, End: ${g.end_date}, Expired: ${isExpired}`);
          });
        } else {
          activeGiveaways = [];
        }
      } else {
        console.warn('Failed to fetch active giveaways:', activeRes.status);
      }
  
      if (endedRes.ok) {
        const endedData = await endedRes.json();
        console.log('Ended data:', endedData);
  
        if (endedData.giveaways && Array.isArray(endedData.giveaways)) {
          endedGiveaways = endedData.giveaways;
          console.log(`📊 Ended giveaways from API: ${endedGiveaways.length}`);
        } else {
          endedGiveaways = [];
        }
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
      
      if (result && result.giveaway_id) {
        return result;
      } else if (result.success && result.giveaway) {
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
    console.log(`Total ${type} giveaways:`, giveaways.length);
  
    if (giveaways.length === 0) {
      elements.giveawayContent.innerHTML = `<div class="empty-message">Tidak ada ${type === 'active' ? 'giveaway aktif' : 'giveaway selesai'}</div>`;
      return;
    }
  
    let html = '';
  
    giveaways.forEach(giveaway => {
      const giveawayId = giveaway.giveaway_id || giveaway.id;
      const prizeText = Array.isArray(giveaway.prizes) ?
        (giveaway.prizes[0] || 'Giveaway') :
        (giveaway.prizes || 'Giveaway');
  
      const totalPrizes = Array.isArray(giveaway.prizes) ? giveaway.prizes.length : 1;
      const participants = giveaway.participants_count || 0;
  
      const description = giveaway.giveaway_text || 'Tidak ada deskripsi';
      const shortDescription = description.length > 100 ?
        description.substring(0, 100) + '...' :
        description;
  
      const now = new Date();
      const endDate = giveaway.end_date ? new Date(giveaway.end_date) : null;
      const isExpired = endDate && now > endDate;
  
      let timeRemaining = '';
      if (type === 'active' && !isExpired && giveaway.end_date) {
        timeRemaining = formatTimeRemaining(giveaway.end_date);
      }
  
      if (type === 'active') {
        if (!isExpired) {
          html += `
            <div class="giveaway-item" data-id="${giveawayId}">
              <h3>${escapeHtml(prizeText)}</h3>
              <p class="giveaway-description">${escapeHtml(shortDescription)}</p>
              <div class="giveaway-stats">
                <span class="stat-badge">🏆 ${totalPrizes} hadiah</span>
                <span class="stat-badge">👥 ${participants} peserta</span>
                ${timeRemaining ? `<span class="stat-badge time-badge">⏰ ${timeRemaining}</span>` : ''}
              </div>
              <div class="active-badge">ACTIVE</div>
            </div>
          `;
        }
      } else if (type === 'ended') {
        if (isExpired || giveaway.status === 'ended') {
          const prizesList = Array.isArray(giveaway.prizes) ? giveaway.prizes : [];
          const topPrizes = prizesList.slice(0, 3);
      
          const getPrizeColor = (index) => {
            if (index === 0) return 'gold';
            if (index === 1) return 'silver';
            if (index === 2) return 'bronze';
            return 'default';
          };
      
          let prizesHtml = '';
          if (topPrizes.length > 0) {
            topPrizes.forEach((prize, idx) => {
              const prizeColor = getPrizeColor(idx);
              prizesHtml += `
                <div class="ended-prize-item">
                  <span class="ended-prize-number ended-prize-${prizeColor}">#${idx + 1}</span>
                  <span class="ended-prize-text">${escapeHtml(prize)}</span>
                </div>
              `;
            });
          } else {
            prizesHtml = `<div class="ended-prize-item">
              <span class="ended-prize-number ended-prize-default">#1</span>
              <span class="ended-prize-text">${escapeHtml(prizeText)}</span>
            </div>`;
          }
      
          const shortId = giveawayId.length > 10 ?
            giveawayId.substring(0, 8) + '...' :
            giveawayId;
      
          html += `
            <div class="giveaway-item ended" data-id="${giveawayId}">
              <div class="ended-header">
                <span class="ended-id" onclick="copyToClipboard('${giveawayId}')" title="Klik untuk copy ID">#${shortId}</span>
                <span class="ended-badge-ended">SELESAI</span>
              </div>
              
              <div class="ended-prizes-list">
                ${prizesHtml}
              </div>
              
              <div class="ended-stats-row">
                <div class="ended-stat-item-small">
                  <span class="ended-stat-icon">🎁</span>
                  <span class="ended-stat-value">${totalPrizes}</span>
                </div>
                <div class="ended-stat-item-small">
                  <span class="ended-stat-icon">👥</span>
                  <span class="ended-stat-value">${participants}</span>
                </div>
              </div>
            </div>
          `;
        }
      }
    });
  
    if (html === '') {
      elements.giveawayContent.innerHTML = `<div class="empty-message">Tidak ada ${type === 'active' ? 'giveaway aktif' : 'giveaway selesai'}</div>`;
      return;
    }
  
    elements.giveawayContent.innerHTML = html;
  
    document.querySelectorAll('.giveaway-item').forEach(item => {
      item.addEventListener('click', () => {
        const giveawayId = item.dataset.id;
        if (giveawayId) {
          window.location.href = `?search=${giveawayId}`;
        }
      });
    });
  }

  // ==================== FUNGSI COPY ID ====================
  window.copyToClipboard = function(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('✅ ID Giveaway berhasil dicopy!', 'success', 1500);
      }).catch(() => {
        fallbackCopy(text);
      });
    } else {
      fallbackCopy(text);
    }
  };
  
  function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
  
    try {
      document.execCommand('copy');
      showToast('✅ ID Giveaway berhasil dicopy!', 'success', 1500);
    } catch (err) {
      showToast('❌ Gagal menyalin ID', 'error', 1500);
    }
  
    document.body.removeChild(textarea);
  }

  // ==================== FUNGSI: RENDER GIVEAWAY DETAIL ====================
  async function renderGiveawayDetail(giveaway) {
    if (elements.profileContent) elements.profileContent.style.display = 'none';
    if (elements.giveawayButtons) elements.giveawayButtons.style.display = 'none';
    if (elements.loading) elements.loading.style.display = 'none';
    if (elements.error) elements.error.style.display = 'none';
    
    if (elements.settingsBtn) elements.settingsBtn.style.display = 'none';
    
    const topContainer = document.querySelector('.top-container');
    if (topContainer) topContainer.style.display = 'none';
  
    const container = elements.giveawayContent;
    if (!container) return;
  
    let statusClass = 'detail-status';
    let statusText = giveaway.status || 'Active';
    const now = new Date();
    const endDate = giveaway.end_date ? new Date(giveaway.end_date) : null;
    const isExpired = giveaway.status === 'active' && endDate && now > endDate;
    
    if (isExpired || giveaway.status === 'ended') {
      statusText = 'Ended';
      statusClass += ' ended';
    } else if (giveaway.status === 'deleted') {
      statusText = 'Deleted';
      statusClass += ' expired';
    } else {
      statusText = 'Active';
      statusClass += ' active';
    }
  
    const isEnded = (giveaway.status === 'ended') || isExpired;
  
    let isCreator = false;
    if (currentUser && giveaway.creator_user_id == currentUser.id) {
      isCreator = true;
      console.log('👑 User adalah pembuat giveaway ini');
    }
  
    let hasParticipated = false;
    if (currentUser && !isEnded) {
      try {
        const checkResponse = await fetch(`${API_BASE_URL}/api/giveaways/${giveaway.giveaway_id}/participants`, {
          headers: { 'Accept': 'application/json' },
          mode: 'cors'
        });
        
        if (checkResponse.ok) {
          const participantsData = await checkResponse.json();
          hasParticipated = participantsData.participants.some(p => p.user_id == currentUser.id);
          console.log('👤 User has participated:', hasParticipated);
        }
      } catch (error) {
        console.error('Error checking participation:', error);
      }
    }
  
    const prizes = Array.isArray(giveaway.prizes) ? giveaway.prizes : [];
    const requirements = Array.isArray(giveaway.requirements) ? giveaway.requirements : [];
    const channels = Array.isArray(giveaway.channels) ? giveaway.channels : [];
    const links = Array.isArray(giveaway.links) ? giveaway.links : [];
  
    let winners = [];
    let participants = [];
    
    if (isEnded) {
      try {
        const winnersResponse = await fetch(`${API_BASE_URL}/api/giveaways/${giveaway.giveaway_id}/winners`, {
          headers: { 'Accept': 'application/json' },
          mode: 'cors'
        });
        
        if (winnersResponse.ok) {
          const winnersData = await winnersResponse.json();
          winners = winnersData.winners || [];
          console.log('🏆 Winners loaded:', winners);
        }
        
        const participantsResponse = await fetch(`${API_BASE_URL}/api/giveaways/${giveaway.giveaway_id}/participants`, {
          headers: { 'Accept': 'application/json' },
          mode: 'cors'
        });
        
        if (participantsResponse.ok) {
          const participantsData = await participantsResponse.json();
          participants = participantsData.participants || [];
          console.log('👥 Participants loaded:', participants);
        }
        
      } catch (error) {
        console.error('❌ Error fetching winners/participants:', error);
      }
    }
  
    let reqHtml = '';
    if (requirements.length === 0) {
      reqHtml = '<div class="requirement-item">Tidak ada syarat khusus</div>';
    } else {
      requirements.forEach(req => {
        let label = req;
        if (req === 'subscribe') label = 'Subscribe Channel';
        else if (req === 'premium') label = 'Akun Premium';
        else if (req === 'nonpremium') label = 'Akun Non-Premium';
        else if (req === 'aktif') label = 'Akun Aktif';
        else if (req === 'share') label = 'Share Postingan';
        
        reqHtml += `<div class="requirement-item">${escapeHtml(label)}</div>`;
      });
    }
  
    let prizesHtml = '';
    prizes.forEach((prize, index) => {
      prizesHtml += `
        <div class="prize-item">
          <span class="prize-number">${index + 1}</span>
          <span class="prize-text">${escapeHtml(prize)}</span>
        </div>
      `;
    });
  
    let channelsHtml = '';
    if (channels.length > 0) {
      channels.forEach(ch => {
        const channelName = typeof ch === 'string' ? ch : (ch.title || ch.username || 'Channel');
        const username = typeof ch === 'string' ? ch.replace('@', '') : (ch.username || '').replace('@', '');
        const isVerified = typeof ch !== 'string' && ch.is_verified;
        const channelUrl = `https://t.me/${username}`;
        
        channelsHtml += `
          <a href="${channelUrl}" target="_blank" class="panel-item channel-item" data-url="${channelUrl}">
            <div class="item-info">
              <div class="item-icon">📢</div>
              <div class="item-details">
                <div class="item-title">
                  ${escapeHtml(channelName)}
                  ${isVerified ? '<span style="color: #00e676; margin-left: 4px;">✓</span>' : ''}
                </div>
                <div class="item-subtitle channel">${username}</div>
              </div>
            </div>
            <div class="item-selector"></div>
          </a>
        `;
      });
    } else {
      channelsHtml = '<div class="empty-message">Tidak ada channel</div>';
    }
  
    let linksHtml = '';
    if (links.length > 0) {
      links.forEach(link => {
        const title = link.title || 'Tautan';
        const url = link.url || '#';
        linksHtml += `
          <a href="${escapeHtml(url)}" target="_blank" class="panel-item link-item" data-url="${escapeHtml(url)}">
            <div class="item-info">
              <div class="item-icon">🔗</div>
              <div class="item-details">
                <div class="item-title">${escapeHtml(title)}</div>
                <div class="item-subtitle">${escapeHtml(url)}</div>
              </div>
            </div>
            <div class="item-selector"></div>
          </a>
        `;
      });
    } else {
      linksHtml = '<div class="empty-message">Tidak ada link</div>';
    }
  
    let mediaHtml = '';
    if (giveaway.media_path) {
      if (giveaway.media_type === 'video') {
        mediaHtml = `
          <div class="detail-media">
            <video src="${giveaway.media_path}" class="detail-media-video" controls></video>
          </div>
        `;
      } else {
        mediaHtml = `
          <div class="detail-media">
            <img src="${giveaway.media_path}" class="detail-media-image" alt="Giveaway Media" onerror="this.style.display='none'">
          </div>
        `;
      }
    }
  
    const endDateFormatted = giveaway.end_date ? formatDate(giveaway.end_date) : 'Tidak ditentukan';
    
    let timeRemaining = '00:00:00:00';
    let countdownActive = false;
    
    if (!isEnded && giveaway.end_date && giveaway.status === 'active') {
      const endDateTime = new Date(giveaway.end_date).getTime();
      const nowTime = new Date().getTime();
      const diff = endDateTime - nowTime;
      
      if (diff > 0) {
        countdownActive = true;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        timeRemaining = `${days.toString().padStart(2, '0')}:${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
    }
  
    function getInitials(name) {
      if (!name) return 'U';
      return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }
  
    function getUserColor(userId) {
      const colors = [
        '#FF6B6B', '#4ECDC4', '#FFD166', '#A06CD5', '#F7B731',
        '#45AAF2', '#FC5C65', '#26DE81', '#A55EEA', '#FF9F1C'
      ];
      return colors[Math.abs(userId) % colors.length];
    }
  
    let winnersHtml = '';
    if (isEnded && winners.length > 0) {
      const displayWinners = winners.slice(0, 2);
      const hasMoreWinners = winners.length > 2;
  
      const getPrizeColorClass = (prizeIndex) => {
        if (prizeIndex === 0) return 'prize-gold';
        if (prizeIndex === 1) return 'prize-silver';
        if (prizeIndex === 2) return 'prize-bronze';
        return 'prize-default';
      };
  
      winnersHtml = `
        <div class="winners-border-container">
          <div class="winners-list-compact">
      `;
  
      displayWinners.forEach((winner, index) => {
        const fullName = [winner.first_name, winner.last_name].filter(Boolean).join(' ') || winner.fullname || 'User';
        const username = winner.username ? `@${winner.username}` : '(no username)';
        const prizeIndex = winner.prize_index !== undefined ? winner.prize_index : index;
        const prizeName = winner.prize || (prizes[prizeIndex] || `Hadiah ${prizeIndex + 1}`);
        const bgColor = getUserColor(winner.id || winner.user_id);
        const prizeColorClass = getPrizeColorClass(prizeIndex);
  
        winnersHtml += `
          <div class="winner-compact-item">
            <div class="winner-compact-left">
              <div class="winner-compact-avatar" style="background: ${bgColor};">
                ${winner.photo_url ? 
                  `<img src="${winner.photo_url}" alt="${fullName}" class="winner-compact-avatar-img">` : 
                  `<span class="winner-compact-initials">${getInitials(fullName)}</span>`
                }
              </div>
              <div class="winner-compact-info">
                <div class="winner-compact-name">${escapeHtml(fullName)}</div>
                <div class="winner-compact-username">${escapeHtml(username)}</div>
                <div class="winner-prize-name ${prizeColorClass}">${escapeHtml(prizeName)}</div>
              </div>
            </div>
          </div>
        `;
      });
  
      winnersHtml += `</div>`;
  
      if (hasMoreWinners) {
        winnersHtml += `
          <button class="winners-expand-btn" id="expandWinnersBtn">
            <span>Tampilkan Semua (${winners.length})</span>
            <span class="expand-icon">▼</span>
          </button>
        `;
      }
  
      winnersHtml += `</div>`;
  
      if (hasMoreWinners) {
        let allWinnersHtml = '';
        winners.forEach((winner, index) => {
          const fullName = [winner.first_name, winner.last_name].filter(Boolean).join(' ') || winner.fullname || 'User';
          const username = winner.username ? `@${winner.username}` : '(no username)';
          const prizeIndex = winner.prize_index !== undefined ? winner.prize_index : index;
          const prizeName = winner.prize || (prizes[prizeIndex] || `Hadiah ${prizeIndex + 1}`);
          const bgColor = getUserColor(winner.id || winner.user_id);
          const prizeColorClass = getPrizeColorClass(prizeIndex);
  
          allWinnersHtml += `
            <div class="winner-modal-item">
              <div class="winner-modal-left">
                <div class="winner-modal-avatar" style="background: ${bgColor};">
                  ${winner.photo_url ? 
                    `<img src="${winner.photo_url}" alt="${fullName}" class="winner-modal-avatar-img">` : 
                    `<span class="winner-modal-initials">${getInitials(fullName)}</span>`
                  }
                </div>
                <div class="winner-modal-info">
                  <div class="winner-modal-name">${escapeHtml(fullName)}</div>
                  <div class="winner-modal-username">${escapeHtml(username)}</div>
                  <div class="winner-modal-prize-name ${prizeColorClass}">${escapeHtml(prizeName)}</div>
                </div>
              </div>
            </div>
          `;
        });
  
        winnersHtml += `
          <div class="winners-modal" id="winnersModal">
            <div class="winners-modal-content">
              <div class="winners-modal-header">
                <h3>Semua Pemenang</h3>
                <button class="winners-modal-close" id="closeWinnersModalBtn">✕</button>
              </div>
              <div class="winners-modal-list">
                ${allWinnersHtml}
              </div>
            </div>
          </div>
        `;
      }
    }
  
    let participantsModalHtml = '';
    if (isEnded && participants.length > 0) {
      let participantsListHtml = '';
      participants.forEach(participant => {
        const fullName = participant.fullname || 'User';
        const username = participant.username ? `@${participant.username}` : '(no username)';
        const bgColor = getUserColor(participant.user_id);
        
        participantsListHtml += `
          <div class="participant-modal-item">
            <div class="participant-modal-avatar" style="background: ${bgColor};">
              <span class="participant-modal-initials">${getInitials(fullName)}</span>
            </div>
            <div class="participant-modal-info">
              <div class="participant-modal-name">${escapeHtml(fullName)}</div>
              <div class="participant-modal-username">${escapeHtml(username)}</div>
            </div>
          </div>
        `;
      });
      
      participantsModalHtml = `
        <div class="participants-modal" id="participantsModal">
          <div class="participants-modal-content">
            <div class="participants-modal-header">
              <h3>Daftar Partisipan (${participants.length})</h3>
              <button class="participants-modal-close" id="closeParticipantsModalBtn">✕</button>
            </div>
            <div class="participants-modal-list">
              ${participantsListHtml}
            </div>
          </div>
        </div>
      `;
    }
  
    let actionButtonsHtml = '';
    if (!isEnded) {
      if (hasParticipated) {
        actionButtonsHtml = `
          <div class="detail-actions-fixed">
            <button class="btn btn-participate disabled" id="detailParticipateBtn" disabled>
              <span>✓</span>
              <span>MENGIKUTI</span>
            </button>
            <button class="btn btn-share" id="detailShareBtn">
              <span>📤</span>
              <span>BAGIKAN</span>
            </button>
          </div>
        `;
      } else {
        actionButtonsHtml = `
          <div class="detail-actions-fixed">
            <button class="btn btn-participate" id="detailParticipateBtn">
              <span>✓</span>
              <span>PARTISIPASI</span>
            </button>
            <button class="btn btn-share" id="detailShareBtn">
              <span>📤</span>
              <span>BAGIKAN</span>
            </button>
          </div>
        `;
      }
    }
  
    const detailHtml = `
      <div class="giveaway-detail-container">
        <div class="detail-header">
          <div class="logo-box" style="background: transparent; border: none; box-shadow: none; padding: 8px 0;">
            <img src="img/logo.png" class="logo-img" alt="logo" onerror="this.style.display='none'">
            <span class="logo-text">GIFT FREEBIES</span>
          </div>
          <div class="detail-header-right">
            ${isCreator && !isEnded ? `
              <button class="delete-giveaway-btn" id="deleteGiveawayBtn" title="Hapus Giveaway">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 6H5H21" stroke="#ff6b6b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="#ff6b6b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            ` : ''}
            ${isEnded ? `<span class="detail-ended-badge">ENDED</span>` : ''}
            ${isEnded && participants.length > 0 ? `
              <button class="eye-custom-btn" id="toggleParticipantsBtn" title="Lihat Partisipan">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" fill="white"/>
                  <circle cx="12" cy="12" r="3" fill="white"/>
                </svg>
              </button>
            ` : ''}
            <button class="detail-back-btn" id="backToIndexBtn">←</button>
          </div>
        </div>
        
        <div class="detail-card">
          ${mediaHtml}
          
          <div class="detail-card-content">
            <div class="${statusClass}">${statusText}</div>
            
            ${!isEnded ? `
            <div class="detail-description">
              <div class="description-header">
                <div class="description-title">Deskripsi</div>
                ${giveaway.giveaway_text && giveaway.giveaway_text.length > 100 ? '<button class="description-expand-btn" id="expandDescriptionBtn">Lihat Lengkap</button>' : ''}
              </div>
              <div class="description-content ${giveaway.giveaway_text && giveaway.giveaway_text.length > 100 ? 'collapsed' : ''}" id="descriptionContent">
                ${giveaway.giveaway_text || '<em>Tidak ada deskripsi</em>'}
              </div>
            </div>
            ` : ''}
            
            ${!isEnded ? `
            <div class="detail-prizes">
              <div class="prizes-header">
                <div class="prizes-title">Hadiah</div>
                ${prizes.length > 2 ? '<button class="prizes-expand-btn" id="expandPrizesBtn">Lihat Semua</button>' : ''}
              </div>
              <div class="prizes-list ${prizes.length > 2 ? 'collapsed' : ''}" id="prizesList">
                ${prizesHtml}
              </div>
            </div>
            ` : ''}
            
            <div class="detail-requirements">
              <div class="requirements-title">Syarat</div>
              <div class="requirements-scroll">
                <div class="requirements-list">
                  ${reqHtml}
                </div>
              </div>
            </div>
            
            ${isEnded && winners.length > 0 ? winnersHtml : ''}
            
            ${channels.length > 0 || links.length > 0 ? `
            <div class="channel-stack-container">
              ${channels.length > 0 ? `
              <div class="channel-stack-row">
                <div class="channel-stack-label">
                  <span class="icon">📢</span>
                  <span>CHANNEL</span>
                </div>
                <button class="eye-custom-btn" id="toggleChannelBtn">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" fill="white"/>
                    <circle cx="12" cy="12" r="3" fill="white"/>
                  </svg>
                </button>
              </div>
              ` : ''}
              
              ${links.length > 0 ? `
              <div class="channel-stack-row">
                <div class="channel-stack-label link">
                  <span class="icon">🔗</span>
                  <span>LINK</span>
                </div>
                <button class="eye-custom-btn" id="toggleLinkBtn">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" fill="white"/>
                    <circle cx="12" cy="12" r="3" fill="white"/>
                  </svg>
                </button>
              </div>
              ` : ''}
            </div>
            ` : ''}
            
            ${channels.length > 0 ? `
            <div class="channel-panel-container hidden" id="channelPanelContainer">
              <div class="detail-panel">
                <div class="panel-header">
                  <div class="panel-title channel">Daftar Channel</div>
                  <button class="panel-close" id="closeChannelPanelBtn">✕</button>
                </div>
                <div class="panel-content" id="channelsList">
                  ${channelsHtml}
                </div>
              </div>
            </div>
            ` : ''}
            
            ${links.length > 0 ? `
            <div class="link-panel-container hidden" id="linkPanelContainer">
              <div class="detail-panel">
                <div class="panel-header">
                  <div class="panel-title link">Daftar Link</div>
                  <button class="panel-close" id="closeLinkPanelBtn">✕</button>
                </div>
                <div class="panel-content" id="linksList">
                  ${linksHtml}
                </div>
              </div>
            </div>
            ` : ''}
            
            ${!isEnded ? `
              <div class="detail-timer">
                <div class="timer-label">BERAKHIR DALAM</div>
                <div class="timer-countdown" id="detailCountdown">${timeRemaining}</div>
                <div class="timer-end-date">
                  <span>${endDateFormatted}</span>
                </div>
              </div>
            ` : ''}
          </div>
        </div>
        
        ${actionButtonsHtml}
        
        ${participantsModalHtml}
      </div>
    `;
  
    container.innerHTML = detailHtml;
    container.style.display = 'block';
  
    setupDetailEventListeners(giveaway, prizes, countdownActive, isEnded);

    if (isCreator && !isEnded) {
      const deleteBtn = document.getElementById('deleteGiveawayBtn');
      if (deleteBtn) {
        deleteBtn.replaceWith(deleteBtn.cloneNode(true));
        const newDeleteBtn = document.getElementById('deleteGiveawayBtn');
        
        if (newDeleteBtn) {
          newDeleteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            showDeleteConfirmation(giveaway);
          });
        }
      }
    }
  }
  
  // ==================== FUNGSI: SETUP EVENT LISTENERS UNTUK DETAIL ====================
  function setupDetailEventListeners(giveaway, prizes, countdownActive, isEnded) {
    const backBtn = document.getElementById('backToIndexBtn');
    if (backBtn) {
      backBtn.replaceWith(backBtn.cloneNode(true));
      const newBackBtn = document.getElementById('backToIndexBtn');
      if (newBackBtn) {
        newBackBtn.addEventListener('click', function(e) {
          e.preventDefault();
          goBackToIndex();
        });
      }
    }
  
    const toggleParticipantsBtn = document.getElementById('toggleParticipantsBtn');
    
    if (toggleParticipantsBtn) {
      toggleParticipantsBtn.replaceWith(toggleParticipantsBtn.cloneNode(true));
      const newToggleParticipantsBtn = document.getElementById('toggleParticipantsBtn');
      
      if (newToggleParticipantsBtn) {
        newToggleParticipantsBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          const modal = document.getElementById('participantsModal');
          if (modal) {
            modal.classList.add('active');
            
            const closeBtn = document.getElementById('closeParticipantsModalBtn');
            if (closeBtn) {
              closeBtn.addEventListener('click', () => {
                modal.classList.remove('active');
              });
            }
            
            modal.addEventListener('click', (e) => {
              if (e.target === modal) {
                modal.classList.remove('active');
              }
            });
          }
          
          vibrate(15);
        });
      }
    }
    
    const expandWinnersBtn = document.getElementById('expandWinnersBtn');
    if (expandWinnersBtn) {
      expandWinnersBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const modal = document.getElementById('winnersModal');
        if (modal) {
          modal.classList.add('active');
          
          const closeBtn = document.getElementById('closeWinnersModalBtn');
          if (closeBtn) {
            closeBtn.addEventListener('click', () => {
              modal.classList.remove('active');
            });
          }
          
          modal.addEventListener('click', (e) => {
            if (e.target === modal) {
              modal.classList.remove('active');
            }
          });
        }
        
        vibrate(10);
      });
    }
  
    const toggleChannelBtn = document.getElementById('toggleChannelBtn');
    const channelPanelContainer = document.getElementById('channelPanelContainer');
    const closeChannelPanelBtn = document.getElementById('closeChannelPanelBtn');
  
    if (toggleChannelBtn && channelPanelContainer) {
      toggleChannelBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
  
        const toggleLinkBtn = document.getElementById('toggleLinkBtn');
        const linkPanelContainer = document.getElementById('linkPanelContainer');
  
        if (linkPanelContainer && !linkPanelContainer.classList.contains('hidden')) {
          linkPanelContainer.classList.add('hidden');
          if (toggleLinkBtn) toggleLinkBtn.classList.remove('active');
        }
  
        channelPanelContainer.classList.toggle('hidden');
        toggleChannelBtn.classList.toggle('active');
  
        vibrate(15);
      });
    }
  
    if (closeChannelPanelBtn && channelPanelContainer) {
      closeChannelPanelBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        channelPanelContainer.classList.add('hidden');
        if (toggleChannelBtn) {
          toggleChannelBtn.classList.remove('active');
        }
      });
    }
  
    const toggleLinkBtn = document.getElementById('toggleLinkBtn');
    const linkPanelContainer = document.getElementById('linkPanelContainer');
    const closeLinkPanelBtn = document.getElementById('closeLinkPanelBtn');
  
    if (toggleLinkBtn && linkPanelContainer) {
      toggleLinkBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
  
        if (channelPanelContainer && !channelPanelContainer.classList.contains('hidden')) {
          channelPanelContainer.classList.add('hidden');
          if (toggleChannelBtn) {
            toggleChannelBtn.classList.remove('active');
          }
        }
  
        linkPanelContainer.classList.toggle('hidden');
        toggleLinkBtn.classList.toggle('active');
  
        vibrate(15);
      });
    }
  
    if (closeLinkPanelBtn && linkPanelContainer) {
      closeLinkPanelBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        linkPanelContainer.classList.add('hidden');
        if (toggleLinkBtn) {
          toggleLinkBtn.classList.remove('active');
        }
      });
    }
  
    const expandDescBtn = document.getElementById('expandDescriptionBtn');
    const descContent = document.getElementById('descriptionContent');
  
    if (expandDescBtn && descContent) {
      expandDescBtn.addEventListener('click', () => {
        const isCollapsed = descContent.classList.contains('collapsed');
  
        if (isCollapsed) {
          descContent.classList.remove('collapsed');
          descContent.classList.add('expanded');
          expandDescBtn.textContent = 'Tutup';
        } else {
          descContent.classList.add('collapsed');
          descContent.classList.remove('expanded');
          expandDescBtn.textContent = 'Lihat Lengkap';
        }
  
        vibrate(10);
      });
    }
  
    const expandPrizesBtn = document.getElementById('expandPrizesBtn');
    const prizesList = document.getElementById('prizesList');
  
    if (expandPrizesBtn && prizesList) {
      expandPrizesBtn.addEventListener('click', () => {
        const isCollapsed = prizesList.classList.contains('collapsed');
  
        if (isCollapsed) {
          prizesList.classList.remove('collapsed');
          prizesList.classList.add('expanded');
          expandPrizesBtn.textContent = 'Tutup';
        } else {
          prizesList.classList.add('collapsed');
          prizesList.classList.remove('expanded');
          expandPrizesBtn.textContent = 'Lihat Semua';
        }
  
        vibrate(10);
      });
    }
  
    document.querySelectorAll('.channel-item').forEach(item => {
      const newItem = item.cloneNode(true);
      item.parentNode.replaceChild(newItem, item);
    
      newItem.addEventListener('click', function(e) {
        e.preventDefault();
    
        const channelUrl = this.dataset.url;
        if (channelUrl) {
          window.open(channelUrl, '_blank');
          showToast('🔍 Channel dibuka, verifikasi akan dilakukan saat partisipasi', 'info', 2000);
        }
    
        vibrate(10);
      });
    });
    
    document.querySelectorAll('.link-item').forEach(item => {
      const newItem = item.cloneNode(true);
      item.parentNode.replaceChild(newItem, item);
    
      let linkVerificationTimer = null;
      let isVerifying = false;
    
      newItem.addEventListener('click', function(e) {
        e.preventDefault();
    
        const linkUrl = this.dataset.url;
        const selector = this.querySelector('.item-selector');
    
        if (selector && selector.classList.contains('selected')) {
          window.open(linkUrl, '_blank');
          return;
        }
    
        if (isVerifying) return;
    
        isVerifying = true;
        window.open(linkUrl, '_blank');
        showToast('⏳ Memverifikasi link...', 'info', 2000);
    
        linkVerificationTimer = setTimeout(() => {
          if (selector) {
            selector.classList.add('selected');
            const linkId = linkUrl || '';
            sessionStorage.setItem(`link_clicked_${linkId}`, 'true');
            showToast('✅ Link berhasil diverifikasi!', 'success', 2000);
          }
    
          isVerifying = false;
        }, 5000);
      });
    
      newItem.addEventListener('remove', () => {
        if (linkVerificationTimer) {
          clearTimeout(linkVerificationTimer);
        }
      });
    });
    
    function startLinkPress(item) {
      if (isLinkTimerActive) return;
    
      const selector = item.querySelector('.item-selector');
      if (selector && selector.classList.contains('selected')) {
        return;
      }
    
      isLinkTimerActive = true;
      currentLinkItem = item;
      linkTimerStart = Date.now();
      linkTimerRemaining = 5;
    
      showLinkTimer(item, 5);
    
      linkTimerInterval = setInterval(() => {
        const elapsed = (Date.now() - linkTimerStart) / 1000;
        linkTimerRemaining = Math.max(0, 5 - elapsed);
    
        updateLinkTimer(item, linkTimerRemaining);
    
        if (linkTimerRemaining <= 0) {
          completeLinkPress(item);
        }
      }, 100);
    
      linkTimer = setTimeout(() => {
        completeLinkPress(item);
      }, 5000);
    }
    
    function completeLinkPress(item) {
      if (!isLinkTimerActive || currentLinkItem !== item) return;
    
      clearTimeout(linkTimer);
      clearInterval(linkTimerInterval);
    
      const selector = item.querySelector('.item-selector');
      if (selector) {
        selector.classList.add('selected');
        const linkId = item.dataset.url || '';
        sessionStorage.setItem(`link_clicked_${linkId}`, 'true');
      }
    
      hideLinkTimer(item);
    
      const linkUrl = item.dataset.url;
      if (linkUrl) {
        window.open(linkUrl, '_blank');
      }
    
      showToast('✅ Link berhasil diverifikasi!', 'success', 2000);
    
      isLinkTimerActive = false;
      currentLinkItem = null;
    }
  
    if (!isEnded) {
      const participateBtn = document.getElementById('detailParticipateBtn');
      if (participateBtn) {
        participateBtn.addEventListener('click', () => {
          handleParticipate(giveaway);
        });
      }
    
      const shareBtn = document.getElementById('detailShareBtn');
      if (shareBtn) {
        shareBtn.addEventListener('click', () => {
          vibrate(10);
          sessionStorage.setItem(`shared_${giveaway.giveaway_id}`, 'true');
          shareGiveaway(giveaway.giveaway_id || giveaway.id, prizes[0] || 'Giveaway');
          showToast('✅ Berhasil membagikan! Silakan klik PARTISIPASI', 'success', 2000);
        });
      }
    }
    
    if (countdownActive && giveaway.end_date) {
      startDetailCountdown(giveaway.end_date);
    }
  }

  // ==================== FUNGSI SHOW DELETE CONFIRMATION ====================
  function showDeleteConfirmation(giveaway) {
    const modal = document.createElement('div');
    modal.className = 'delete-confirmation-modal';
    modal.innerHTML = `
      <div class="delete-confirmation-content">
        <div class="delete-confirmation-header">
          <span>🗑️ Hapus Giveaway</span>
          <button class="delete-modal-close" id="deleteModalClose">✕</button>
        </div>
        <div class="delete-confirmation-body">
          <p>Apakah Anda yakin ingin menghapus giveaway ini?</p>
          <p class="delete-warning">Tindakan ini akan:</p>
          <ul>
            <li>Menghapus giveaway dari database</li>
            <li>Menghapus semua pesan giveaway dari channel/group</li>
            <li>Mengubah status menjadi CANCELLED</li>
          </ul>
          <p class="delete-confirmation-id">ID: ${giveaway.giveaway_id}</p>
        </div>
        <div class="delete-confirmation-footer">
          <button class="delete-cancel-btn" id="deleteCancelBtn">BATALKAN</button>
          <button class="delete-confirm-btn" id="deleteConfirmBtn">HAPUS</button>
        </div>
      </div>
    `;
  
    document.body.appendChild(modal);
  
    setTimeout(() => {
      modal.classList.add('active');
    }, 10);
  
    document.getElementById('deleteModalClose').addEventListener('click', () => {
      modal.classList.remove('active');
      setTimeout(() => modal.remove(), 300);
    });
  
    document.getElementById('deleteCancelBtn').addEventListener('click', () => {
      modal.classList.remove('active');
      setTimeout(() => modal.remove(), 300);
    });
  
    document.getElementById('deleteConfirmBtn').addEventListener('click', async () => {
      const confirmBtn = document.getElementById('deleteConfirmBtn');
      const originalText = confirmBtn.textContent;
      confirmBtn.textContent = '⏳ Menghapus...';
      confirmBtn.disabled = true;
  
      try {
        const response = await fetch(`${API_BASE_URL}/api/giveaways/${giveaway.giveaway_id}/cancel`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          mode: 'cors'
        });
  
        if (response.ok) {
          const result = await response.json();
  
          if (result.success) {
            modal.querySelector('.delete-confirmation-body').innerHTML = `
              <div class="delete-success">
                <span class="delete-success-icon">✅</span>
                <p>Giveaway berhasil dihapus!</p>
                <p class="delete-success-message">Pesan akan dihapus dari semua channel.</p>
              </div>
            `;
  
            modal.querySelector('.delete-confirmation-footer').style.display = 'none';
  
            setTimeout(() => {
              modal.classList.remove('active');
              setTimeout(() => {
                modal.remove();
                window.location.href = window.location.pathname;
              }, 300);
            }, 2000);
  
            showToast('✅ Giveaway berhasil dihapus', 'success', 2000);
          } else {
            throw new Error(result.error || 'Gagal menghapus giveaway');
          }
        } else {
          const error = await response.json();
          throw new Error(error.error || 'Gagal menghapus giveaway');
        }
  
      } catch (error) {
        console.error('Error deleting giveaway:', error);
        showToast('❌ Gagal menghapus giveaway: ' + error.message, 'error', 3000);
  
        confirmBtn.textContent = originalText;
        confirmBtn.disabled = false;
      }
    });
  
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
      }
    });
  }

  // ==================== FUNGSI: KEMBALI KE INDEX ====================
  function goBackToIndex() {
    console.log('🔙 Kembali ke index...');
  
    currentGiveawayType = 'active';
  
    if (elements.profileContent) {
      elements.profileContent.style.display = 'block';
    }
  
    if (elements.giveawayButtons) {
      elements.giveawayButtons.style.display = 'flex';
    }
  
    if (elements.settingsBtn) {
      elements.settingsBtn.style.display = 'flex';
    }
  
    const topContainer = document.querySelector('.top-container');
    if (topContainer) {
      topContainer.style.display = 'flex';
    }
  
    const container = elements.giveawayContent;
    if (container) {
      container.innerHTML = '';
      container.style.display = 'block';
    }
  
    if (window.detailCountdownInterval) {
      clearInterval(window.detailCountdownInterval);
      window.detailCountdownInterval = null;
    }
  
    const url = new URL(window.location.href);
    url.searchParams.delete('search');
  
    window.location.href = url.toString();
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
  
  // ==================== FUNGSI: SHARE GIVEAWAY ====================
  function shareGiveaway(giveawayId, prize) {
    vibrate(10);
  
    const botUsername = 'freebiestbot';
    const miniAppUrl = `https://t.me/${botUsername}/giveaway?startapp=${giveawayId}`;
  
    const shareText = `🎁 **IKUTI GIVEAWAY MENARIK!**\n\n${prize || 'Giveaway'}\n\n__Klik link di bawah ini untuk mengikuti:__\n${miniAppUrl}`;
    const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(miniAppUrl)}&text=${encodeURIComponent(shareText)}`;
  
    console.log('Sharing giveaway dengan pesan:', shareText);
  
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
  
      try {
        if (tg.openTelegramLink) {
          tg.openTelegramLink(telegramShareUrl);
          showToast('Membuka Telegram untuk berbagi...', 'success', 1500);
        }
        else if (tg.openLink) {
          tg.openLink(telegramShareUrl);
          showToast('Membuka Telegram untuk berbagi...', 'success', 1500);
        }
        else {
          window.open(telegramShareUrl, '_blank');
          showToast('Berhasil membuka link share', 'success', 1500);
        }
      } catch (error) {
        console.error('Error sharing giveaway:', error);
        window.open(telegramShareUrl, '_blank');
      }
    } else {
      if (navigator.share) {
        navigator.share({
          title: 'GiftFreebies Giveaway',
          text: shareText,
          url: miniAppUrl
        }).catch((error) => {
          console.log('Share cancelled or failed:', error);
          window.open(telegramShareUrl, '_blank');
        });
      } else {
        window.open(telegramShareUrl, '_blank');
      }
    }
  }

  // ==================== FUNGSI UPDATE UI ====================
  async function updateUI(user) {
    currentUser = user;
  
    const fullName = user.fullname || [user.first_name, user.last_name].filter(Boolean).join(' ') || 'No Name';
    const username = user.username ? (user.username.startsWith('@') ? user.username : `@${user.username}`) : '(no username)';
    const isPremium = user.is_premium || false;
    const userId = user.user_id || user.id || '-';
  
    if (elements.profileNameDisplay) elements.profileNameDisplay.textContent = fullName;
    if (elements.profileUsernameDisplay) elements.profileUsernameDisplay.textContent = username;
    if (elements.profileIdDisplay) elements.profileIdDisplay.textContent = `ID: ${userId}`;
  
    const [totalCreate, activeParticipations, totalParticipations, totalWins] = await Promise.all([
      fetchUserGiveawayCount(userId),
      fetchUserActiveParticipations(userId),
      Promise.resolve(user.total_participations || 0),
      Promise.resolve(user.total_wins || 0)
    ]);
  
    currentActiveParticipations = activeParticipations;
  
    if (elements.totalCreate) elements.totalCreate.textContent = totalCreate;
    if (elements.activeParticipations) {
      elements.activeParticipations.textContent = activeParticipations;
    }
    if (elements.participations) elements.participations.textContent = totalParticipations;
    if (elements.wins) elements.wins.textContent = totalWins;
  
    if (elements.profilePhoto) {
      elements.profilePhoto.src = user.photo_url || generateAvatarUrl(fullName);
    }
  
    addPremiumIndicator(isPremium);
    showProfile();
  }
  
  // ==================== FUNGSI SETUP STATS EVENT LISTENERS ====================
  function setupStatsEventListeners() {
    console.log('🎯 Setting up stats event listeners');
    
    if (document.getElementById('statCreate')) {
      document.getElementById('statCreate').addEventListener('click', async () => {
        vibrate(10);
        showToast('Memuat data...', 'info', 500);
        const giveaways = await fetchGiveawaysByType('created', currentUser?.id);
        showGiveawayListModal('create', giveaways);
      });
    }

    if (document.getElementById('statAktif')) {
      document.getElementById('statAktif').addEventListener('click', async () => {
        vibrate(10);
        showToast('Memuat data...', 'info', 500);
        const giveaways = await fetchGiveawaysByType('active-participated', currentUser?.id);
        showGiveawayListModal('aktif', giveaways);
      });
    }

    if (document.getElementById('statPartisipasi')) {
      document.getElementById('statPartisipasi').addEventListener('click', async () => {
        vibrate(10);
        showToast('Memuat data...', 'info', 500);
        const giveaways = await fetchGiveawaysByType('all-participated', currentUser?.id);
        showGiveawayListModal('partisipasi', giveaways);
      });
    }

    if (document.getElementById('statMenang')) {
      document.getElementById('statMenang').addEventListener('click', async () => {
        vibrate(10);
        showToast('Memuat data...', 'info', 500);
        const giveaways = await fetchGiveawaysByType('won', currentUser?.id);
        showGiveawayListModal('menang', giveaways);
      });
    }
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
    window.addEventListener('popstate', (event) => {
      console.log('📍 Popstate event:', event);
      if (!window.location.search.includes('search=')) {
        window.location.reload();
      }
    });
    
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        console.log('👀 Tab menjadi aktif - refresh data jika perlu');
        if (!window.location.search.includes('search=')) {
          fetchAllGiveaways().then(giveaways => {
            allGiveaways = giveaways;
            displayGiveaways(currentGiveawayType);
          });
        }
      }
    });
    
    window.addEventListener('online', () => {
      console.log('🌐 Koneksi internet tersambung kembali');
      showToast('Koneksi internet tersambung kembali', 'success', 2000);
      
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
  
  async function checkUserSubscriptionWithModal(giveawayId, channelUsername, userId) {
    return new Promise(async (resolve, reject) => {
      try {
        const cleanUsername = channelUsername.replace('@', '');
  
        const modal = showSubscriptionLoadingModal(cleanUsername);
  
        const response = await fetch(`${API_BASE_URL}/api/check-subscription`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          mode: 'cors',
          body: JSON.stringify({
            user_id: userId,
            channel_username: cleanUsername
          })
        });
  
        if (response.status === 202) {
          updateLoadingModalStatus(modal, 'Memeriksa keanggotaan...');
  
          const pollResult = await pollSubscriptionStatus(cleanUsername, userId, modal);
          resolve(pollResult);
  
        } else if (response.ok) {
          const data = await response.json();
  
          if (data.is_subscribed) {
            updateLoadingModalSuccess(modal, cleanUsername, data.channel_info);
            setTimeout(() => {
              completeLoadingModal(modal, true);
              resolve(true);
            }, 1500);
          } else {
            updateLoadingModalError(modal, `Anda belum subscribe ke @${cleanUsername}`);
            setTimeout(() => {
              completeLoadingModal(modal, false);
              resolve(false);
            }, 1500);
          }
        } else {
          const error = await response.json();
          updateLoadingModalError(modal, error.error || 'Gagal mengecek subscription');
          setTimeout(() => {
            completeLoadingModal(modal, false);
            resolve(false);
          }, 1500);
        }
  
      } catch (error) {
        console.error('Error checking subscription:', error);
        reject(error);
      }
    });
  }
  
  // ==================== FUNGSI POLLING STATUS SUBSCRIPTION ====================
  async function pollSubscriptionStatus(channelUsername, userId, modal) {
    const maxAttempts = 20;
    let attempts = 0;
    
    return new Promise((resolve) => {
      const pollInterval = setInterval(async () => {
        attempts++;
        
        try {
          const response = await fetch(`${API_BASE_URL}/api/check-subscription-status/${channelUsername}/${userId}`);
          
          if (response.ok) {
            const data = await response.json();
            
            if (data.completed) {
              clearInterval(pollInterval);
              
              if (data.result.is_subscribed) {
                updateLoadingModalSuccess(modal, channelUsername, data.result.channel_info);
                setTimeout(() => {
                  completeLoadingModal(modal, true);
                  resolve(true);
                }, 1500);
              } else {
                updateLoadingModalError(modal, `Anda belum subscribe ke @${channelUsername}`);
                setTimeout(() => {
                  completeLoadingModal(modal, false);
                  resolve(false);
                }, 1500);
              }
              
            } else if (data.requires_sync) {
              updateLoadingModalStatus(modal, 'Mengambil data channel...');
            } else {
              updateLoadingModalStatus(modal, 'Memeriksa keanggotaan...');
            }
          }
          
          if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            updateLoadingModalError(modal, 'Timeout! Silakan coba lagi.');
            setTimeout(() => {
              completeLoadingModal(modal, false);
              resolve(false);
            }, 1500);
          }
          
        } catch (error) {
          console.error('Polling error:', error);
          if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            updateLoadingModalError(modal, 'Gagal terhubung ke server');
            setTimeout(() => {
              completeLoadingModal(modal, false);
              resolve(false);
            }, 1500);
          }
        }
      }, 1500);
    });
  }
  
  // ==================== FUNGSI LOADING MODAL UNTUK SUBSCRIPTION ====================
  let subscriptionModal = null;
  let subscriptionTypingInterval = null;
  let subscriptionTypingIndex = 0;
  let subscriptionTypingLines = [];

  // ==================== FUNGSI CEK SYARAT PREMIUM ====================
  function checkPremiumRequirement(userIsPremium, requirement) {
    if (requirement === 'premium') {
      return userIsPremium === true;
    } else if (requirement === 'nonpremium') {
      return userIsPremium === false;
    }
    return true;
  }

  function showSubscriptionLoadingModal(channelUsername) {
    const existingModal = document.querySelector('.subscription-loading-modal');
    if (existingModal) {
      existingModal.remove();
    }
    
    if (subscriptionTypingInterval) {
      clearInterval(subscriptionTypingInterval);
      subscriptionTypingInterval = null;
    }
    
    subscriptionTypingIndex = 0;
    
    subscriptionTypingLines = [
      { text: `🔍 Memeriksa keanggotaan di @${channelUsername}...`, delay: 300 },
      { text: `👤 Mengecek status subscribe...`, delay: 400 },
      { text: `⏳ Mohon tunggu sebentar...`, delay: 500 }
    ];
    
    subscriptionModal = document.createElement('div');
    subscriptionModal.className = 'subscription-loading-modal';
    subscriptionModal.innerHTML = `
      <div class="sync-loading-content">
        <div class="sync-loading-header">
          <div class="sync-loading-title">🔍 Memeriksa Subscription</div>
          <div class="sync-loading-spinner"></div>
        </div>
        <div class="sync-loading-body">
          <div class="sync-typing-container">
            <div class="sync-typing-content" id="subscriptionTypingContent"></div>
          </div>
          <div class="sync-progress-bar">
            <div class="sync-progress-fill" id="subscriptionProgressFill"></div>
          </div>
          <div class="sync-status" id="subscriptionStatus">Memulai...</div>
        </div>
      </div>
    `;
    
    document.body.appendChild(subscriptionModal);
    
    setTimeout(() => {
      subscriptionModal.classList.add('active');
    }, 10);
    
    startSubscriptionTypingEffect();
    
    return subscriptionModal;
  }
  
  function startSubscriptionTypingEffect() {
    const typingContent = document.getElementById('subscriptionTypingContent');
    if (!typingContent) return;
    
    typingContent.innerHTML = '';
    subscriptionTypingIndex = 0;
    
    function typeNextLine() {
      if (subscriptionTypingIndex >= subscriptionTypingLines.length) {
        updateSubscriptionStatus('Memeriksa...');
        updateSubscriptionProgress(50);
        return;
      }
      
      const line = subscriptionTypingLines[subscriptionTypingIndex];
      const lineElement = document.createElement('div');
      lineElement.className = 'sync-typing-line';
      lineElement.style.opacity = '0';
      lineElement.textContent = line.text;
      typingContent.appendChild(lineElement);
      
      setTimeout(() => {
        lineElement.style.opacity = '1';
      }, 50);
      
      const progress = ((subscriptionTypingIndex + 1) / subscriptionTypingLines.length) * 40;
      updateSubscriptionProgress(progress);
      
      if (subscriptionTypingIndex === 0) {
        updateSubscriptionStatus('Menghubungi server...');
      } else if (subscriptionTypingIndex === 1) {
        updateSubscriptionStatus('Memeriksa keanggotaan...');
      }
      
      subscriptionTypingIndex++;
      
      setTimeout(typeNextLine, line.delay || 400);
    }
    
    typeNextLine();
  }
  
  function updateSubscriptionStatus(status) {
    const statusEl = document.getElementById('subscriptionStatus');
    if (statusEl) {
      statusEl.textContent = status;
    }
  }
  
  function updateSubscriptionProgress(percent) {
    const progressFill = document.getElementById('subscriptionProgressFill');
    if (progressFill) {
      progressFill.style.width = `${percent}%`;
    }
  }
  
  function updateLoadingModalStatus(modal, status) {
    updateSubscriptionStatus(status);
    updateSubscriptionProgress(60);
  }
  
  function updateLoadingModalSuccess(modal, channelUsername, channelInfo) {
    const typingContent = document.getElementById('subscriptionTypingContent');
    if (!typingContent) return;
    
    const successLine = document.createElement('div');
    successLine.className = 'sync-typing-line success';
    successLine.innerHTML = `✅ Anda sudah subscribe ke @${channelUsername}!`;
    typingContent.appendChild(successLine);
    
    if (channelInfo) {
      const infoLine = document.createElement('div');
      infoLine.className = 'sync-typing-line success';
      infoLine.innerHTML = `📢 ${channelInfo.title || channelUsername}`;
      typingContent.appendChild(infoLine);
    }
    
    updateSubscriptionStatus('✅ Berhasil!');
    updateSubscriptionProgress(100);
  }
  
  function updateLoadingModalError(modal, errorMessage) {
    const typingContent = document.getElementById('subscriptionTypingContent');
    if (!typingContent) return;
    
    const errorLine = document.createElement('div');
    errorLine.className = 'sync-typing-line';
    errorLine.style.borderLeftColor = '#ff6b6b';
    errorLine.innerHTML = `❌ ${errorMessage}`;
    typingContent.appendChild(errorLine);
    
    updateSubscriptionStatus('❌ Gagal');
    updateSubscriptionProgress(100);
  }
  
  function completeLoadingModal(modal, success) {
    if (!modal) return;
    
    setTimeout(() => {
      modal.classList.remove('active');
      setTimeout(() => {
        if (modal && modal.parentNode) {
          modal.remove();
        }
        if (subscriptionModal === modal) {
          subscriptionModal = null;
        }
      }, 300);
    }, success ? 1500 : 2000);
  }
  
  // ==================== STATE UNTUK LINK TIMER ====================
  let linkTimer = null;
  let linkTimerInterval = null;
  let currentLinkItem = null;
  let linkTimerStart = 0;
  let linkTimerRemaining = 5;
  let isLinkTimerActive = false;
  
  // ==================== FUNGSI SETUP LINK TIMER ====================
  function setupLinkTimers() {
    document.querySelectorAll('.link-item').forEach(item => {
      const newItem = item.cloneNode(true);
      item.parentNode.replaceChild(newItem, item);
    });
  
    document.querySelectorAll('.link-item').forEach(item => {
      let touchTimer = null;
      let isPressing = false;
      let pressStartTime = 0;
      
      item.addEventListener('mousedown', (e) => {
        e.preventDefault();
        startLinkPress(item);
      });
  
      item.addEventListener('mouseup', () => {
        cancelLinkPress(item);
      });
  
      item.addEventListener('mouseleave', () => {
        cancelLinkPress(item);
      });
  
      item.addEventListener('touchstart', (e) => {
        e.preventDefault();
        startLinkPress(item);
      });
  
      item.addEventListener('touchend', (e) => {
        e.preventDefault();
        cancelLinkPress(item);
      });
  
      item.addEventListener('touchcancel', (e) => {
        e.preventDefault();
        cancelLinkPress(item);
      });
  
      item.addEventListener('click', (e) => {
        if (isLinkTimerActive && currentLinkItem === item) {
          e.preventDefault();
          return;
        }
      });
    });
  }
  
  function startLinkPress(item) {
    if (isLinkTimerActive) return;
    
    const selector = item.querySelector('.item-selector');
    if (selector && selector.classList.contains('selected')) {
      return;
    }
    
    isLinkTimerActive = true;
    currentLinkItem = item;
    linkTimerStart = Date.now();
    linkTimerRemaining = 5;
    
    showLinkTimer(item, 5);
    
    linkTimerInterval = setInterval(() => {
      const elapsed = (Date.now() - linkTimerStart) / 1000;
      linkTimerRemaining = Math.max(0, 5 - elapsed);
      
      updateLinkTimer(item, linkTimerRemaining);
      
      if (linkTimerRemaining <= 0) {
        completeLinkPress(item);
      }
    }, 100);
    
    linkTimer = setTimeout(() => {
      completeLinkPress(item);
    }, 5000);
  }
  
  function cancelLinkPress(item) {
    if (!isLinkTimerActive || currentLinkItem !== item) return;
    
    clearTimeout(linkTimer);
    clearInterval(linkTimerInterval);
    
    hideLinkTimer(item);
    
    isLinkTimerActive = false;
    currentLinkItem = null;
  }
  
  function completeLinkPress(item) {
    if (!isLinkTimerActive || currentLinkItem !== item) return;
    
    clearTimeout(linkTimer);
    clearInterval(linkTimerInterval);
    
    const selector = item.querySelector('.item-selector');
    if (selector) {
      selector.classList.add('selected');
      
      const linkId = item.dataset.url || '';
      sessionStorage.setItem(`link_clicked_${linkId}`, 'true');
    }
    
    hideLinkTimer(item);
    
    showToast('✅ Link berhasil diverifikasi!', 'success', 2000);
    
    isLinkTimerActive = false;
    currentLinkItem = null;
  }
  
  function showLinkTimer(item, seconds) {
    const oldTimer = item.querySelector('.link-timer');
    if (oldTimer) oldTimer.remove();
    
    const timer = document.createElement('div');
    timer.className = 'link-timer';
    timer.innerHTML = `
      <div class="link-timer-circle">
        <svg viewBox="0 0 36 36" class="link-timer-svg">
          <circle cx="18" cy="18" r="16" fill="none" class="link-timer-bg"></circle>
          <circle cx="18" cy="18" r="16" fill="none" class="link-timer-progress" 
                  stroke-dasharray="100" stroke-dashoffset="0"></circle>
        </svg>
        <span class="link-timer-text">${seconds}</span>
      </div>
      <div class="link-timer-label">Tahan untuk verifikasi</div>
    `;
    
    item.appendChild(timer);
  }
  
  function updateLinkTimer(item, seconds) {
    const timerText = item.querySelector('.link-timer-text');
    const progress = item.querySelector('.link-timer-progress');
    
    if (timerText) {
      timerText.textContent = Math.ceil(seconds);
    }
    
    if (progress) {
      const offset = 100 - (seconds / 5) * 100;
      progress.style.strokeDashoffset = offset;
    }
  }
  
  function hideLinkTimer(item) {
    const timer = item.querySelector('.link-timer');
    if (timer) {
      timer.remove();
    }
  }

  // ==================== FUNGSI CEK STATUS AKTIF (PERNAH BERPARTISIPASI) ====================
  async function checkUserActiveStatus(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}/participation-history`, {
        headers: { 'Accept': 'application/json' },
        mode: 'cors'
      });
  
      if (!response.ok) return false;
  
      const data = await response.json();
      return data.total_participations > 0;
  
    } catch (error) {
      console.error('Error checking active status:', error);
      return false;
    }
  }

  // ==================== UPDATE FUNGSI CHECKALLREQUIREMENTS ====================
  async function checkAllRequirements(giveaway, user) {
    const requirements = giveaway.requirements || [];
    const channels = giveaway.channels || [];
    const links = giveaway.links || [];
  
    const failedRequirements = [];
    const channelStatuses = {};
    const linkStatuses = {};
  
    if (requirements.includes('premium') && !user.is_premium) {
      failedRequirements.push('premium');
      showToast('❌ Giveaway ini khusus untuk pengguna Premium', 'error', 3000);
      return {
        passed: false,
        failed: ['premium'],
        channelStatuses: {},
        linkStatuses: {}
      };
    }
  
    if (requirements.includes('nonpremium') && user.is_premium) {
      failedRequirements.push('nonpremium');
      showToast('❌ Giveaway ini khusus untuk pengguna Non-Premium', 'error', 3000);
      return {
        passed: false,
        failed: ['nonpremium'],
        channelStatuses: {},
        linkStatuses: {}
      };
    }
  
    if (requirements.includes('aktif')) {
      const isActive = await checkUserActiveStatus(user.id);
      if (!isActive) {
        failedRequirements.push('aktif');
        showToast('❌ Anda harus pernah berpartisipasi di giveaway lain', 'error', 3000);
        return {
          passed: false,
          failed: ['aktif'],
          channelStatuses: {},
          linkStatuses: {}
        };
      }
    }
  
    if (requirements.includes('share')) {
      const hasShared = sessionStorage.getItem(`shared_${giveaway.giveaway_id}`) === 'true';
      if (!hasShared) {
        failedRequirements.push('share');
        showToast('❌ Anda harus membagikan giveaway ini terlebih dahulu', 'warning', 3000);
  
        setTimeout(() => {
          const shareBtn = document.getElementById('detailShareBtn');
          if (shareBtn) {
            shareBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
            shareBtn.classList.add('pulse-animation');
            setTimeout(() => shareBtn.classList.remove('pulse-animation'), 2000);
          }
        }, 500);
  
        return {
          passed: false,
          failed: ['share'],
          channelStatuses: {},
          linkStatuses: {}
        };
      }
    }
  
    if (requirements.includes('subscribe') && channels.length > 0) {
      const modal = showGlobalSubscriptionModal(channels.length);
  
      for (let i = 0; i < channels.length; i++) {
        const channel = channels[i];
        const channelUsername = typeof channel === 'string' ? channel : channel.username;
  
        updateGlobalModalStatus(modal, i + 1, channels.length, channelUsername);
  
        try {
          const response = await fetch(`${API_BASE_URL}/api/check-subscription`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            mode: 'cors',
            body: JSON.stringify({
              user_id: user.id,
              channel_username: channelUsername.replace('@', '')
            })
          });
  
          if (response.status === 202) {
            const pollResult = await pollGlobalSubscriptionStatus(channelUsername, user.id, modal, i + 1, channels.length);
            channelStatuses[channelUsername] = pollResult;
            if (!pollResult) {
              failedRequirements.push(`subscribe:${channelUsername}`);
            }
          } else if (response.ok) {
            const data = await response.json();
            channelStatuses[channelUsername] = data.is_subscribed || false;
            if (!data.is_subscribed) {
              failedRequirements.push(`subscribe:${channelUsername}`);
            }
          } else {
            channelStatuses[channelUsername] = false;
            failedRequirements.push(`subscribe:${channelUsername}`);
          }
  
        } catch (error) {
          console.error(`Error checking channel ${channelUsername}:`, error);
          channelStatuses[channelUsername] = false;
          failedRequirements.push(`subscribe:${channelUsername}`);
        }
      }
  
      completeGlobalModal(modal);
    }
  
    if (links.length > 0) {
      links.forEach(link => {
        const linkId = link.url || link;
        const hasClicked = sessionStorage.getItem(`link_clicked_${linkId}`) === 'true';
        linkStatuses[linkId] = hasClicked;
        if (!hasClicked) {
          failedRequirements.push(`link:${linkId}`);
        }
      });
    }
  
    updateChannelSelectors(channelStatuses);
    updateLinkSelectors(linkStatuses);
  
    const hasChannelFailures = failedRequirements.some(req => req.startsWith('subscribe:'));
    if (hasChannelFailures) {
      setTimeout(() => {
        const channelPanel = document.getElementById('channelPanelContainer');
        const toggleChannelBtn = document.getElementById('toggleChannelBtn');
  
        if (channelPanel && channelPanel.classList.contains('hidden')) {
          channelPanel.classList.remove('hidden');
          if (toggleChannelBtn) {
            toggleChannelBtn.classList.add('active');
          }
        }
  
        if (channelPanel) {
          channelPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
    }
  
    const hasLinkFailures = failedRequirements.some(req => req.startsWith('link:'));
    if (hasLinkFailures) {
      setTimeout(() => {
        const linkPanel = document.getElementById('linkPanelContainer');
        const toggleLinkBtn = document.getElementById('toggleLinkBtn');
  
        if (linkPanel && linkPanel.classList.contains('hidden')) {
          linkPanel.classList.remove('hidden');
          if (toggleLinkBtn) {
            toggleLinkBtn.classList.add('active');
          }
        }
  
        if (linkPanel) {
          linkPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
    }
  
    return {
      passed: failedRequirements.length === 0,
      failed: failedRequirements,
      channelStatuses: channelStatuses,
      linkStatuses: linkStatuses
    };
  }
  
  // ==================== FUNGSI UPDATE LINK SELECTORS ====================
  function updateLinkSelectors(linkStatuses) {
    document.querySelectorAll('.link-item').forEach(item => {
      const linkUrl = item.dataset.url;
      if (linkUrl && linkStatuses[linkUrl] === true) {
        const selector = item.querySelector('.item-selector');
        if (selector) {
          selector.classList.add('selected');
        }
      }
    });
  }
  
  // ==================== FUNGSI UPDATE CHANNEL SELECTORS ====================
  function updateChannelSelectors(channelStatuses) {
    document.querySelectorAll('.channel-item').forEach(item => {
      const channelUrl = item.dataset.url;
      if (channelUrl) {
        const username = channelUrl.replace('https://t.me/', '');
        
        if (channelStatuses[username] === true) {
          const selector = item.querySelector('.item-selector');
          if (selector) {
            selector.classList.add('selected');
          }
        }
      }
    });
  }
  
  // ==================== FUNGSI HANDLE PARTICIPATE (DENGAN CAPTCHA) ====================
  async function handleParticipate(giveaway) {
    try {
      vibrate(15);
  
      if (!currentUser) {
        showToast('Silakan login terlebih dahulu', 'warning', 2000);
        return;
      }
  
      console.log('🎯 Processing participation for giveaway:', giveaway.giveaway_id);
      console.log('👤 Current user:', currentUser);
  
      // ===== CEK CAPTCHA =====
      if (checkCaptchaRequirement(giveaway)) {
        console.log('🔒 Captcha required for this giveaway');
  
        // Cek apakah sudah pernah menyelesaikan captcha untuk giveaway ini
        if (!isCaptchaPassed(giveaway.giveaway_id)) {
          showToast('🔒 Menyelesaikan captcha terlebih dahulu...', 'info', 2000);
  
          // Simpan data giveaway untuk digunakan setelah captcha selesai
          sessionStorage.setItem('pending_participation', JSON.stringify({
            giveaway_id: giveaway.giveaway_id,
            user_id: currentUser.id,
            fullname: currentUser.fullname || [currentUser.first_name, currentUser.last_name].filter(Boolean).join(' '),
            username: currentUser.username,
            is_premium: currentUser.is_premium || false
          }));
  
          // Simpan return URL
          sessionStorage.setItem('captcha_return_url', window.location.href);
          sessionStorage.setItem('captcha_giveaway_id', giveaway.giveaway_id);
  
          // Buka halaman captcha
          window.location.href = 'captcha.html';
          return; // Hentikan eksekusi, akan lanjut setelah captcha selesai
        } else {
          console.log('✅ Captcha already passed for this giveaway');
        }
      }
  
      // Lanjutkan pengecekan syarat lainnya
      const requirementCheck = await checkAllRequirements(giveaway, currentUser);
  
      if (!requirementCheck.passed) {
        showToast('❌ Gagal, Dipastikan anda sudah menekan link syarat!', 'error', 3000);
  
        setTimeout(() => {
          window.location.reload();
        }, 1000);
  
        return;
      }
  
      showToast('Menyimpan partisipasi...', 'info', 1000);
  
      const result = await saveParticipation(giveaway.giveaway_id, currentUser);
  
      if (result.success) {
        showToast('✅ Berhasil berpartisipasi!', 'success', 2000);
  
        // Bersihkan status captcha setelah berhasil (opsional)
        clearCaptchaStatus(giveaway.giveaway_id);
  
        if (elements.participations) {
          const currentCount = parseInt(elements.participations.textContent) || 0;
          elements.participations.textContent = currentCount + 1;
        }
  
        sessionStorage.removeItem(`shared_${giveaway.giveaway_id}`);
  
        setTimeout(() => {
          window.location.reload();
        }, 1000);
  
      } else {
        showToast(result.message || 'Gagal berpartisipasi', 'error', 2000);
  
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
  
    } catch (error) {
      console.error('Error in handleParticipate:', error);
      showToast(error.message || 'Terjadi kesalahan', 'error', 2000);
  
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  }

  // ==================== FUNGSI SIMPAN PARTISIPASI ====================
  async function saveParticipation(giveawayId, userData) {
    try {
      console.log(`📝 Saving participation for giveaway ${giveawayId}`);
  
      const response = await fetch(`${API_BASE_URL}/api/giveaways/${giveawayId}/participate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        mode: 'cors',
        body: JSON.stringify({
          user_id: userData.id,
          fullname: userData.fullname || [userData.first_name, userData.last_name].filter(Boolean).join(' '),
          username: userData.username,
          is_premium: userData.is_premium || false
        })
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save participation');
      }
  
      const data = await response.json();
      return data;
  
    } catch (error) {
      console.error('Error saving participation:', error);
      throw error;
    }
  }

  function showGlobalSubscriptionModal(totalChannels) {
    const existingModal = document.querySelector('.global-subscription-modal');
    if (existingModal) {
      existingModal.remove();
    }
  
    let globalModal = document.createElement('div');
    globalModal.className = 'global-subscription-modal';
    globalModal.innerHTML = `...`; // Anda perlu mengisi ini nanti
  
    document.body.appendChild(globalModal);
  
    setTimeout(() => {
      globalModal.classList.add('active');
    }, 10);
  
    return globalModal;
  }
  
  function updateGlobalModalStatus(modal, current, total, channelUsername) {
    if (!modal) return;
  
    const progressFill = document.getElementById('globalProgressFill');
    const progressCurrent = document.getElementById('globalProgressCurrent');
    const currentChannel = document.getElementById('globalCurrentChannel');
    const statusEl = document.getElementById('globalStatus');
  
    if (progressFill) {
      const percent = (current / total) * 100;
      progressFill.style.width = `${percent}%`;
    }
  
    if (progressCurrent) {
      progressCurrent.textContent = current;
    }
  
    if (currentChannel) {
      currentChannel.innerHTML = `<span class="channel-name">@${channelUsername.replace('@', '')}</span>`;
    }
  
    if (statusEl) {
      statusEl.textContent = `Memeriksa channel ${current} dari ${total}`;
    }
  }
  
  function completeGlobalModal(modal) {
    if (!modal) return;
  
    const progressFill = document.getElementById('globalProgressFill');
    const statusEl = document.getElementById('globalStatus');
    const currentChannel = document.getElementById('globalCurrentChannel');
  
    if (progressFill) {
      progressFill.style.width = '100%';
    }
  
    if (statusEl) {
      statusEl.textContent = 'Pengecekan selesai!';
    }
  
    if (currentChannel) {
      currentChannel.innerHTML = '✅ Semua channel telah diperiksa';
    }
  
    setTimeout(() => {
      modal.classList.remove('active');
      setTimeout(() => {
        if (modal && modal.parentNode) {
          modal.remove();
        }
        if (globalModal === modal) {
          globalModal = null;
        }
      }, 300);
    }, 1000);
  }
  
  // ==================== FUNGSI POLLING GLOBAL ====================
  async function pollGlobalSubscriptionStatus(channelUsername, userId, modal, current, total) {
    const maxAttempts = 20;
    let attempts = 0;
  
    return new Promise((resolve) => {
      const pollInterval = setInterval(async () => {
        attempts++;
  
        try {
          const response = await fetch(`${API_BASE_URL}/api/check-subscription-status/${channelUsername}/${userId}`);
  
          if (response.ok) {
            const data = await response.json();
  
            if (data.completed) {
              clearInterval(pollInterval);
  
              updateGlobalModalStatus(modal, current, total, channelUsername);
  
              resolve(data.result.is_subscribed || false);
              return;
            }
          }
  
          if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            resolve(false);
          }
  
        } catch (error) {
          console.error('Polling error:', error);
          if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            resolve(false);
          }
        }
      }, 1500);
    });
  }
  
  // ==================== FUNGSI UPDATE CHANNEL SELECTORS ====================
  function updateChannelSelectors(channelStatuses) {
    document.querySelectorAll('.channel-item').forEach(item => {
      const channelUrl = item.dataset.url;
      if (channelUrl) {
        const username = channelUrl.replace('https://t.me/', '');
  
        if (channelStatuses[username] === true) {
          const selector = item.querySelector('.item-selector');
          if (selector) {
            selector.classList.add('selected');
          }
        }
      }
    });
  }
  
  // ==================== FUNGSI UPDATE LINK SELECTORS ====================
  function updateLinkSelectors(linkStatuses) {
    document.querySelectorAll('.link-item').forEach(item => {
      const linkUrl = item.dataset.url;
      if (linkUrl && linkStatuses[linkUrl] === true) {
        const selector = item.querySelector('.item-selector');
        if (selector) {
          selector.classList.add('selected');
        }
      }
    });
  }

  // ==================== FUNGSI CEK GIVEAWAY AKTIF YANG DIIKUTI ====================
  async function fetchUserActiveParticipations(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}/active-participations`, {
        headers: { 'Accept': 'application/json' },
        mode: 'cors'
      });
  
      if (!response.ok) return 0;
  
      const data = await response.json();
      return data.count || 0;
  
    } catch (error) {
      console.error('Error fetching active participations:', error);
      return 0;
    }
  }
  
  // ==================== FUNGSI FETCH GIVEAWAY LIST BY STATUS ====================
  async function fetchGiveawaysByType(type, userId = null) {
    try {
      let url = `${API_BASE_URL}/api/giveaways/list?type=${type}`;
      if (userId) {
        url += `&user_id=${userId}`;
      }
  
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        mode: 'cors'
      });
  
      if (!response.ok) return [];
  
      const data = await response.json();
      return data.giveaways || [];
  
    } catch (error) {
      console.error(`Error fetching ${type} giveaways:`, error);
      return [];
    }
  }
  
  // ==================== FUNGSI DISPLAY GIVEAWAY LIST MODAL ====================
  function showGiveawayListModal(type, giveaways) {
    const oldModal = document.querySelector('.giveaway-list-modal');
    if (oldModal) oldModal.remove();
  
    let title = '';
    let icon = '';
    switch (type) {
      case 'create':
        title = 'Giveaway yang Dibuat';
        icon = '🎁';
        break;
      case 'aktif':
        title = 'Giveaway Aktif Diikuti';
        icon = '🔥';
        break;
      case 'partisipasi':
        title = 'Riwayat Partisipasi';
        icon = '📝';
        break;
      case 'menang':
        title = 'Giveaway Dimenangkan';
        icon = '🏆';
        break;
    }
  
    const modal = document.createElement('div');
    modal.className = 'giveaway-list-modal';
  
    let content = `
      <div class="giveaway-list-content">
        <div class="giveaway-list-header">
          <div class="giveaway-list-title">
            <span class="giveaway-list-icon">${icon}</span>
            <span>${title}</span>
          </div>
          <button class="giveaway-list-close" id="closeGiveawayListBtn">✕</button>
        </div>
        <div class="giveaway-list-body">
    `;
  
    if (giveaways.length === 0) {
      content += `
        <div class="giveaway-list-empty">
          <div class="empty-icon">📭</div>
          <div class="empty-text">Tidak ada data</div>
        </div>
      `;
    } else {
      giveaways.forEach(g => {
        const prizeText = Array.isArray(g.prizes) ?
          (g.prizes[0] || 'Giveaway') :
          (g.prizes || 'Giveaway');
  
        const endDate = g.end_date ? formatDate(g.end_date) : 'No limit';
        const status = g.status === 'active' ?
          '<span class="status-badge status-active">AKTIF</span>' :
          '<span class="status-badge status-ended">SELESAI</span>';
  
        content += `
          <div class="giveaway-list-item" data-id="${g.giveaway_id || g.id}">
            <div class="item-header">
              <span class="item-prize">${escapeHtml(prizeText)}</span>
              ${status}
            </div>
            <div class="item-details">
              <span class="item-id">#${(g.giveaway_id || g.id).substring(0, 8)}...</span>
              <span class="item-date">${endDate}</span>
            </div>
          </div>
        `;
      });
    }
  
    content += `
        </div>
      </div>
    `;
  
    modal.innerHTML = content;
    document.body.appendChild(modal);
  
    setTimeout(() => {
      modal.classList.add('active');
    }, 10);
  
    document.getElementById('closeGiveawayListBtn').addEventListener('click', () => {
      modal.classList.remove('active');
      setTimeout(() => modal.remove(), 300);
    });
  
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
      }
    });
  
    document.querySelectorAll('.giveaway-list-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.dataset.id;
        if (id) {
          modal.classList.remove('active');
          setTimeout(() => {
            modal.remove();
            window.location.href = `?search=${id}`;
          }, 300);
        }
      });
    });
  }

  // ==================== INIT UTAMA ====================
  async function init() {
    console.log('🚀 INITIALIZING APPLICATION...');
  
    try {
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
  
      const urlParams = new URLSearchParams(window.location.search);
      const giveawayIdFromUrl = urlParams.get('search');
      console.log('🔍 URL search param:', giveawayIdFromUrl);
  
      let telegramStartParam = null;
      let telegramUserData = null;
  
      if (window.Telegram?.WebApp) {
        console.log('📱 Running inside Telegram Web App');
        const tg = window.Telegram.WebApp;
  
        tg.expand();
        tg.ready();
  
        if (tg.initDataUnsafe?.start_param) {
          telegramStartParam = tg.initDataUnsafe.start_param;
          console.log('📱 Telegram start_param:', telegramStartParam);
        }
  
        if (tg.initDataUnsafe?.user) {
          telegramUserData = tg.initDataUnsafe.user;
          console.log('📱 Telegram user data:', telegramUserData);
        }
  
        applyTelegramTheme(tg);
      } else {
        console.log('🌐 Running in standalone web browser');
      }
  
      let user = null;
  
      if (telegramUserData) {
        console.log('📱 Menggunakan data user Telegram');
  
        try {
          const apiUser = await fetchUserFromApi(telegramUserData.id);
  
          if (apiUser) {
            user = {
              ...telegramUserData,
              ...apiUser,
              fullname: apiUser.fullname || [telegramUserData.first_name, telegramUserData.last_name].filter(Boolean).join(' '),
              username: apiUser.username || telegramUserData.username,
              is_premium: apiUser.is_premium || telegramUserData.is_premium || false
            };
            console.log('✅ Data user dari API:', apiUser);
          } else {
            user = telegramUserData;
            console.log('ℹ️ Menggunakan data user Telegram (tanpa data API)');
          }
        } catch (userError) {
          console.error('❌ Error fetching user from API:', userError);
          user = telegramUserData;
          console.log('ℹ️ Fallback ke data user Telegram karena error API');
        }
  
      } else {
        console.log('👤 Menggunakan guest mode');
        user = { ...guestUser };
      }
  
      currentUser = user;
      console.log('👤 Current user set:', currentUser);
  
      const finalGiveawayId = giveawayIdFromUrl || telegramStartParam;
  
      if (finalGiveawayId) {
        console.log('🎯 Menampilkan detail giveaway untuk ID:', finalGiveawayId);
  
        try {
          if (elements.loading) {
            elements.loading.style.display = 'flex';
            const loadingText = elements.loading.querySelector('p');
            if (loadingText) loadingText.textContent = 'Memuat detail giveaway...';
          }
  
          if (elements.error) elements.error.style.display = 'none';
  
          console.log('📡 Fetching giveaway detail...');
          const giveawayData = await fetchGiveawayDetail(finalGiveawayId);
  
          if (!giveawayData) {
            throw new Error('Data giveaway tidak ditemukan');
          }
  
          console.log('✅ Giveaway data loaded:', giveawayData);
  
          if (elements.loading) elements.loading.style.display = 'none';
  
          renderGiveawayDetail(giveawayData);
  
        } catch (error) {
          console.error('❌ Gagal memuat detail giveaway:', error);
  
          if (elements.loading) elements.loading.style.display = 'none';
  
          showError(
            error.message || 'Gagal memuat detail giveaway. Pastikan koneksi internet Anda stabil.',
            true
          );
        }
  
        return;
      }
  
      console.log('👤 Mode profil - menampilkan halaman utama');
      
      try {
        await updateUI(user);
        console.log('✅ UI profil berhasil diupdate');
      
        // 🔥 INI YANG PENTING - Setup stats setelah UI diupdate
        setupStatsEventListeners();
      
      } catch (uiError) {
        console.error('❌ Error updating UI:', uiError);
        showError('Gagal menampilkan profil. Silakan refresh halaman.', false);
      }
  
      try {
        console.log('📡 Fetching all giveaways...');
        allGiveaways = await fetchAllGiveaways();
  
        if (allGiveaways.active.length > 0) {
          console.log('Active giveaways status check:');
          allGiveaways.active.forEach((g, i) => {
            console.log(`  ${i+1}. ID: ${g.giveaway_id || g.id}, Status: ${g.status}`);
          });
        }
  
        if (allGiveaways.ended.length > 0) {
          console.log('Ended giveaways status check:');
          allGiveaways.ended.forEach((g, i) => {
            console.log(`  ${i+1}. ID: ${g.giveaway_id || g.id}, Status: ${g.status}`);
          });
        }
  
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
  
      try {
        if (elements.activeBtn) elements.activeBtn.classList.add('active');
        if (elements.endedBtn) elements.endedBtn.classList.remove('active');
  
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
  
      setupAdditionalEventListeners();
  
      console.log('🎉 Inisialisasi selesai!');
  
    } catch (fatalError) {
      console.error('💥 Fatal error in init():', fatalError);
  
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