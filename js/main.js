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
  let globalNodal = null;
  let currentUser = null;
  let currentGiveawayType = 'active';
    let allGiveaways = { active: [], ended: [] };
  
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
    
            // Log untuk debugging
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
    console.log(`Total ${type} giveaways:`, giveaways.length);
  
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
  
      // Hitung total hadiah
      const totalPrizes = Array.isArray(giveaway.prizes) ? giveaway.prizes.length : 1;
  
      // PERBAIKAN: participants_count adalah jumlah peserta giveaway
      const participants = giveaway.participants_count || 0;
  
      // Ambil deskripsi giveaway (ambil 100 karakter pertama)
      const description = giveaway.giveaway_text || 'Tidak ada deskripsi';
      const shortDescription = description.length > 100 ?
        description.substring(0, 100) + '...' :
        description;
  
      // Tentukan apakah giveaway sudah expired berdasarkan end_date
      const now = new Date();
      const endDate = giveaway.end_date ? new Date(giveaway.end_date) : null;
      const isExpired = endDate && now > endDate;
  
      // Format waktu tersisa untuk active giveaway
      let timeRemaining = '';
      if (type === 'active' && !isExpired && giveaway.end_date) {
        timeRemaining = formatTimeRemaining(giveaway.end_date);
      }
  
      // PERBAIKAN: Jika status dari API adalah 'active' tapi sudah expired,
      // maka harus masuk ke tab ENDED, bukan ACTIVE
      if (type === 'active') {
        // Hanya tampilkan yang benar-benar active (belum expired)
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
        // Hanya tampilkan yang sudah expired atau status ended
        if (isExpired || giveaway.status === 'ended') {
          const winners = giveaway.winners_count || 0;
      
          // Untuk ended giveaway: tambahkan class ended dan garis bawah L
          html += `
            <div class="giveaway-item ended" data-id="${giveawayId}">
              <h3>${escapeHtml(prizeText)}</h3>
              <!-- Deskripsi dengan background gelap dan 2 baris -->
              <div class="ended-description-container">
                <p class="ended-description">${escapeHtml(description)}</p>
              </div>
              <div class="ended-stats-wrapper">
                <div class="ended-stats-left">
                  <div class="ended-stat-item">
                    <span class="ended-stat-icon">🎁</span>
                    <span class="ended-stat-value">${totalPrizes}</span>
                  </div>
                  <div class="ended-stat-divider"></div>
                  <div class="ended-stat-item">
                    <span class="ended-stat-icon">👥</span>
                    <span class="ended-stat-value">${participants}</span>
                  </div>
                  <div class="ended-stat-divider"></div>
                  <div class="ended-stat-item">
                    <span class="ended-stat-icon">🏆</span>
                    <span class="ended-stat-value">${winners}</span>
                  </div>
                </div>
                <div class="ended-badge-container">
                  <span class="ended-badge">SELESAI</span>
                </div>
              </div>
              <!-- Garis bawah L -->
              <div class="ended-border-line"></div>
            </div>
          `;
        }
      }
    });
  
    // Jika setelah filter tidak ada yang ditampilkan, tampilkan pesan kosong
    if (html === '') {
      elements.giveawayContent.innerHTML = `<div class="empty-message">Tidak ada ${type === 'active' ? 'giveaway aktif' : 'giveaway selesai'}</div>`;
      return;
    }
  
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
  async function renderGiveawayDetail(giveaway) {
      // Sembunyikan elemen profil dan tombol giveaway
      if (elements.profileContent) elements.profileContent.style.display = 'none';
      if (elements.giveawayButtons) elements.giveawayButtons.style.display = 'none';
      if (elements.loading) elements.loading.style.display = 'none';
      if (elements.error) elements.error.style.display = 'none';
      
      // ===== PENTING: SEMBUNYIKAN SETTINGS BUTTON =====
      if (elements.settingsBtn) elements.settingsBtn.style.display = 'none';
      
      // ===== PENTING: SEMBUNYIKAN TOP CONTAINER (LOGO DAN PROFILE) =====
      const topContainer = document.querySelector('.top-container');
      if (topContainer) topContainer.style.display = 'none';
  
      const container = elements.giveawayContent;
      if (!container) return;
  
      // Tentukan status
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
  
      // Tentukan apakah ini ended giveaway
      const isEnded = (giveaway.status === 'ended') || isExpired;
  
      // CEK APAKAH USER SUDAH BERPARTISIPASI
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
  
      // Siapkan data untuk ditampilkan
      const prizes = Array.isArray(giveaway.prizes) ? giveaway.prizes : [];
      const requirements = Array.isArray(giveaway.requirements) ? giveaway.requirements : [];
      const channels = Array.isArray(giveaway.channels) ? giveaway.channels : [];
      const links = Array.isArray(giveaway.links) ? giveaway.links : [];
  
      // ===== AMBIL DATA WINNERS DAN PARTICIPANTS DARI API =====
      let winners = [];
      let participants = [];
      
      if (isEnded) {
          try {
              // Ambil data pemenang
              const winnersResponse = await fetch(`${API_BASE_URL}/api/giveaways/${giveaway.giveaway_id}/winners`, {
                  headers: { 'Accept': 'application/json' },
                  mode: 'cors'
              });
              
              if (winnersResponse.ok) {
                  const winnersData = await winnersResponse.json();
                  winners = winnersData.winners || [];
                  console.log('🏆 Winners loaded:', winners);
              }
              
              // Ambil data partisipan
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
  
      // Buat HTML untuk syarat
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
  
      // Buat HTML untuk hadiah
      let prizesHtml = '';
      prizes.forEach((prize, index) => {
          prizesHtml += `
              <div class="prize-item">
                  <span class="prize-number">${index + 1}</span>
                  <span class="prize-text">${escapeHtml(prize)}</span>
              </div>
          `;
      });
  
      // Buat HTML untuk channel
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
  
      // Buat HTML untuk link
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
  
      // Tentukan media (foto/video)
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
  
      // Format tanggal akhir
      const endDateFormatted = giveaway.end_date ? formatDate(giveaway.end_date) : 'Tidak ditentukan';
      
      // Hitung sisa waktu untuk countdown (hanya untuk active)
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
  
      // Fungsi untuk generate inisial dari nama
      function getInitials(name) {
          if (!name) return 'U';
          return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      }
  
      // Fungsi untuk generate warna random berdasarkan user id
      function getUserColor(userId) {
          const colors = [
              '#FF6B6B', '#4ECDC4', '#FFD166', '#A06CD5', '#F7B731',
              '#45AAF2', '#FC5C65', '#26DE81', '#A55EEA', '#FF9F1C'
          ];
          return colors[Math.abs(userId) % colors.length];
      }
  
      // Fungsi untuk generate warna random
      function getRandomColor(index) {
          const colors = [
              '#FF6B6B', '#4ECDC4', '#FFD166', '#A06CD5', '#F7B731',
              '#45AAF2', '#FC5C65', '#26DE81', '#A55EEA', '#FF9F1C'
          ];
          return colors[index % colors.length];
      }
  
      // ===== BUAT HTML UNTUK PEMENANG (TAMPILAN BARU - TANPA JUDUL) =====
      let winnersHtml = '';
      if (isEnded && winners.length > 0) {
          // Tampilkan hanya 2 pemenang pertama
          const displayWinners = winners.slice(0, 2);
          const hasMoreWinners = winners.length > 2;
          
          winnersHtml = `
              <div class="winners-border-container">
                  <div class="winners-list-compact">
          `;
          
          displayWinners.forEach((winner, index) => {
              const fullName = [winner.first_name, winner.last_name].filter(Boolean).join(' ') || winner.fullname || 'User';
              const username = winner.username ? `@${winner.username}` : '(no username)';
              const prizeIndex = winner.prize_index !== undefined ? winner.prize_index + 1 : index + 1;
              const prizeName = winner.prize || (prizes[winner.prize_index] || `Hadiah ${prizeIndex}`);
              const bgColor = getUserColor(winner.id || winner.user_id);
              
              winnersHtml += `
                  <div class="winner-compact-item">
                      <div class="winner-compact-left">
                          <span class="winner-prize-number">#${prizeIndex}</span>
                          <div class="winner-compact-avatar" style="background: ${bgColor};">
                              ${winner.photo_url ? 
                                  `<img src="${winner.photo_url}" alt="${fullName}" class="winner-compact-avatar-img">` : 
                                  `<span class="winner-compact-initials">${getInitials(fullName)}</span>`
                              }
                          </div>
                          <div class="winner-compact-info">
                              <div class="winner-compact-name">${escapeHtml(fullName)}</div>
                              <div class="winner-compact-username">${escapeHtml(username)}</div>
                          </div>
                      </div>
                      <div class="winner-compact-prize">${escapeHtml(prizeName)}</div>
                  </div>
              `;
          });
          
          winnersHtml += `</div>`;
          
          // Tambahkan tombol "Tampilkan Semua" jika lebih dari 2 pemenang
          if (hasMoreWinners) {
              winnersHtml += `
                  <button class="winners-expand-btn" id="expandWinnersBtn">
                      <span>Tampilkan Semua (${winners.length})</span>
                      <span class="expand-icon">▼</span>
                  </button>
              `;
          }
          
          winnersHtml += `</div>`;
          
          // Tambahkan modal untuk menampilkan semua pemenang (hidden by default)
          if (hasMoreWinners) {
              let allWinnersHtml = '';
              winners.forEach((winner, index) => {
                  const fullName = [winner.first_name, winner.last_name].filter(Boolean).join(' ') || winner.fullname || 'User';
                  const username = winner.username ? `@${winner.username}` : '(no username)';
                  const prizeIndex = winner.prize_index !== undefined ? winner.prize_index + 1 : index + 1;
                  const prizeName = winner.prize || (prizes[winner.prize_index] || `Hadiah ${prizeIndex}`);
                  const bgColor = getUserColor(winner.id || winner.user_id);
                  
                  allWinnersHtml += `
                      <div class="winner-modal-item">
                          <div class="winner-modal-left">
                              <span class="winner-modal-prize-number">#${prizeIndex}</span>
                              <div class="winner-modal-avatar" style="background: ${bgColor};">
                                  ${winner.photo_url ? 
                                      `<img src="${winner.photo_url}" alt="${fullName}" class="winner-modal-avatar-img">` : 
                                      `<span class="winner-modal-initials">${getInitials(fullName)}</span>`
                                  }
                              </div>
                              <div class="winner-modal-info">
                                  <div class="winner-modal-name">${escapeHtml(fullName)}</div>
                                  <div class="winner-modal-username">${escapeHtml(username)}</div>
                              </div>
                          </div>
                          <div class="winner-modal-prize">${escapeHtml(prizeName)}</div>
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
  
      // ===== BUAT HTML UNTUK MODAL PARTICIPANTS (BUKAN PANEL BAWAH) =====
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
  
      // ACTION BUTTONS FIXED (HANYA UNTUK ACTIVE GIVEAWAY)
      let actionButtonsHtml = '';
      if (!isEnded) {
          if (hasParticipated) {
              // Jika sudah berpartisipasi, tampilkan tombol disabled
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
              // Jika belum, tampilkan tombol partisipasi normal
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
  
      // Gabungkan semua HTML
      const detailHtml = `
          <div class="giveaway-detail-container">
              <!-- HEADER dengan tombol back -->
              <div class="detail-header">
                  <div class="logo-box" style="background: transparent; border: none; box-shadow: none; padding: 8px 0;">
                      <img src="img/logo.png" class="logo-img" alt="logo" onerror="this.style.display='none'">
                      <span class="logo-text">GIFT FREEBIES</span>
                  </div>
                  <div class="detail-header-right">
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
              
              <!-- MAIN CARD -->
              <div class="detail-card">
                  ${mediaHtml}
                  
                  <div class="detail-card-content">
                      <!-- STATUS BADGE -->
                      <div class="${statusClass}">${statusText}</div>
                      
                      <!-- DESKRIPSI SECTION -->
                      <div class="detail-description">
                          <div class="description-header">
                              <div class="description-title">Deskripsi</div>
                              ${giveaway.giveaway_text && giveaway.giveaway_text.length > 100 ? '<button class="description-expand-btn" id="expandDescriptionBtn">Lihat Lengkap</button>' : ''}
                          </div>
                          <div class="description-content ${giveaway.giveaway_text && giveaway.giveaway_text.length > 100 ? 'collapsed' : ''}" id="descriptionContent">
                              ${giveaway.giveaway_text || '<em>Tidak ada deskripsi</em>'}
                          </div>
                      </div>
                      
                      <!-- SYARAT SECTION -->
                      <div class="detail-requirements">
                          <div class="requirements-title">Syarat</div>
                          <div class="requirements-scroll">
                              <div class="requirements-list">
                                  ${reqHtml}
                              </div>
                          </div>
                      </div>
                      
                      <!-- HADIAH SECTION -->
                      <div class="detail-prizes">
                          <div class="prizes-header">
                              <div class="prizes-title">Hadiah</div>
                              ${prizes.length > 2 ? '<button class="prizes-expand-btn" id="expandPrizesBtn">Lihat Semua</button>' : ''}
                          </div>
                          <div class="prizes-list ${prizes.length > 2 ? 'collapsed' : ''}" id="prizesList">
                              ${prizesHtml}
                          </div>
                      </div>
                      
                      <!-- WINNERS SECTION (HANYA UNTUK ENDED GIVEAWAY) - TANPA JUDUL -->
                      ${isEnded && winners.length > 0 ? winnersHtml : ''}
                      
                      <!-- CHANNEL & LINK BUTTONS DALAM SATU BARIS (UNTUK SEMUA) -->
                      ${channels.length > 0 || links.length > 0 ? `
                      <div class="channel-link-row-container">
                          ${channels.length > 0 ? `
                          <div class="channel-link-row">
                              <div class="channel-link-label channel">
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
                          <div class="channel-link-row">
                              <div class="channel-link-label link">
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
                      
                      <!-- PANEL CHANNEL (AWALNYA HIDDEN) -->
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
                      
                      <!-- PANEL LINK (AWALNYA HIDDEN) -->
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
                      
                      <!-- TIMER SECTION (HANYA UNTUK ACTIVE GIVEAWAY) -->
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
              
              <!-- ACTION BUTTONS FIXED -->
              ${actionButtonsHtml}
              
              <!-- MODAL PARTICIPANTS -->
              ${participantsModalHtml}
          </div>
      `;
  
      container.innerHTML = detailHtml;
      container.style.display = 'block';
  
      // Setup event listeners untuk halaman detail
      setupDetailEventListeners(giveaway, prizes, countdownActive, isEnded);
  }
  
  // ==================== FUNGSI: SETUP EVENT LISTENERS UNTUK DETAIL ====================
  function setupDetailEventListeners(giveaway, prizes, countdownActive, isEnded) {
      // Tombol back
      const backBtn = document.getElementById('backToIndexBtn');
      if (backBtn) {
          // Hapus event listener lama jika ada
          backBtn.replaceWith(backBtn.cloneNode(true));
          const newBackBtn = document.getElementById('backToIndexBtn');
          if (newBackBtn) {
              newBackBtn.addEventListener('click', function(e) {
                  e.preventDefault();
                  goBackToIndex();
              });
          }
      }
  
      // Tombol mata untuk Partisipan (hanya untuk ended) - SEKARANG MODAL
      const toggleParticipantsBtn = document.getElementById('toggleParticipantsBtn');
      
      if (toggleParticipantsBtn) {
          // Hapus event listener lama
          toggleParticipantsBtn.replaceWith(toggleParticipantsBtn.cloneNode(true));
          const newToggleParticipantsBtn = document.getElementById('toggleParticipantsBtn');
          
          if (newToggleParticipantsBtn) {
              newToggleParticipantsBtn.addEventListener('click', (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  // Tampilkan modal participants
                  const modal = document.getElementById('participantsModal');
                  if (modal) {
                      modal.classList.add('active');
                      
                      // Tambahkan event listener untuk menutup modal
                      const closeBtn = document.getElementById('closeParticipantsModalBtn');
                      if (closeBtn) {
                          closeBtn.addEventListener('click', () => {
                              modal.classList.remove('active');
                          });
                      }
                      
                      // Klik di luar modal untuk menutup
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
      
      // Event listener untuk tombol expand winners
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
  
      // Tombol mata untuk Channel
      const toggleChannelBtn = document.getElementById('toggleChannelBtn');
      const channelPanelContainer = document.getElementById('channelPanelContainer');
      const closeChannelPanelBtn = document.getElementById('closeChannelPanelBtn');
  
      if (toggleChannelBtn && channelPanelContainer) {
          toggleChannelBtn.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();
  
              // Tutup panel link jika terbuka
              const toggleLinkBtn = document.getElementById('toggleLinkBtn');
              const linkPanelContainer = document.getElementById('linkPanelContainer');
  
              if (linkPanelContainer && !linkPanelContainer.classList.contains('hidden')) {
                  linkPanelContainer.classList.add('hidden');
                  if (toggleLinkBtn) toggleLinkBtn.classList.remove('active');
              }
  
              // Toggle panel channel
              channelPanelContainer.classList.toggle('hidden');
  
              // Toggle active state tombol
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
  
      // Tombol mata untuk Link
      const toggleLinkBtn = document.getElementById('toggleLinkBtn');
      const linkPanelContainer = document.getElementById('linkPanelContainer');
      const closeLinkPanelBtn = document.getElementById('closeLinkPanelBtn');
  
      if (toggleLinkBtn && linkPanelContainer) {
          toggleLinkBtn.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();
  
              // Tutup panel channel jika terbuka
              if (channelPanelContainer && !channelPanelContainer.classList.contains('hidden')) {
                  channelPanelContainer.classList.add('hidden');
                  if (toggleChannelBtn) {
                      toggleChannelBtn.classList.remove('active');
                  }
              }
  
              // Toggle panel link
              linkPanelContainer.classList.toggle('hidden');
  
              // Toggle active state tombol
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
  
      // Expand deskripsi
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
  
      // Expand hadiah
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
  
      // Klik pada item channel
      document.querySelectorAll('.channel-item').forEach(item => {
          // Hapus event listener lama dengan clone
          const newItem = item.cloneNode(true);
          item.parentNode.replaceChild(newItem, item);
  
          newItem.addEventListener('click', function(e) {
              // Biarkan link berfungsi normal
              const selector = this.querySelector('.item-selector');
              if (selector) {
                  selector.classList.toggle('selected');
              }
              vibrate(10);
          });
      });
  
      // Klik pada item link
      document.querySelectorAll('.link-item').forEach(item => {
          // Hapus event listener lama dengan clone
          const newItem = item.cloneNode(true);
          item.parentNode.replaceChild(newItem, item);
  
          newItem.addEventListener('click', function(e) {
              // Biarkan link berfungsi normal
              const selector = this.querySelector('.item-selector');
              if (selector) {
                  selector.classList.toggle('selected');
              }
              vibrate(10);
          });
      });
  
      // Tombol partisipasi (hanya untuk active)
      if (!isEnded) {
          const participateBtn = document.getElementById('detailParticipateBtn');
          if (participateBtn) {
              participateBtn.addEventListener('click', () => {
                  handleParticipate(giveaway);
              });
          }
      
          // Tombol share
          const shareBtn = document.getElementById('detailShareBtn');
          if (shareBtn) {
              shareBtn.addEventListener('click', () => {
                  vibrate(10);
      
                  // Set flag bahwa user sudah share
                  sessionStorage.setItem(`shared_${giveaway.giveaway_id}`, 'true');
      
                  // Panggil fungsi share
                  shareGiveaway(giveaway.giveaway_id || giveaway.id, prizes[0] || 'Giveaway');
      
                  showToast('✅ Berhasil membagikan! Silakan klik PARTISIPASI', 'success', 2000);
              });
          }
      }
      
      // Mulai countdown jika aktif
      if (countdownActive && giveaway.end_date) {
          startDetailCountdown(giveaway.end_date);
      }
  }
    
    // ==================== FUNGSI: KEMBALI KE INDEX (DIPERBAIKI) ====================
    function goBackToIndex() {
      console.log('🔙 Kembali ke index...');
    
      // Reset state aplikasi
      currentGiveawayType = 'active';
    
      // Tampilkan kembali elemen yang disembunyikan
      if (elements.profileContent) {
        elements.profileContent.style.display = 'block';
      }
    
      if (elements.giveawayButtons) {
        elements.giveawayButtons.style.display = 'flex';
      }
    
      if (elements.settingsBtn) {
        elements.settingsBtn.style.display = 'flex';
      }
    
      // Tampilkan kembali top container
      const topContainer = document.querySelector('.top-container');
      if (topContainer) {
        topContainer.style.display = 'flex';
      }
    
      // Hapus konten detail
      const container = elements.giveawayContent;
      if (container) {
        container.innerHTML = '';
        container.style.display = 'block';
      }
    
      // Hentikan countdown
      if (window.detailCountdownInterval) {
        clearInterval(window.detailCountdownInterval);
        window.detailCountdownInterval = null;
      }
    
      // Hapus parameter search dari URL
      const url = new URL(window.location.href);
      url.searchParams.delete('search');
    
      // CARA PALING MUDAH: Refresh halaman setelah menghapus parameter
      window.location.href = url.toString();
    
      // Kode di bawah ini TIDAK AKAN dieksekusi karena redirect
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
  
    // Format pesan yang akan dibagikan
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

    async function updateUI(user) {
      // Simpan user ke currentUser
      currentUser = user;
    
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
    
      // Pastikan total_participations terbaca
      const participations = user.total_participations || 0;
      if (elements.participations) elements.participations.textContent = participations;
    
      const wins = user.total_wins || 0;
      if (elements.wins) elements.wins.textContent = wins;
    
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
  
  async function checkUserSubscriptionWithModal(giveawayId, channelUsername, userId) {
    return new Promise(async (resolve, reject) => {
      try {
        const cleanUsername = channelUsername.replace('@', '');
  
        // Tampilkan loading modal
        const modal = showSubscriptionLoadingModal(cleanUsername);
  
        // Panggil API untuk check subscription
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
          // Langsung polling status
          updateLoadingModalStatus(modal, 'Memeriksa keanggotaan...');
  
          // Polling status
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
        // Hapus event listener lama
        document.querySelectorAll('.link-item').forEach(item => {
            const newItem = item.cloneNode(true);
            item.parentNode.replaceChild(newItem, item);
        });
    
        // Tambahkan event listener baru
        document.querySelectorAll('.link-item').forEach(item => {
            let touchTimer = null;
            let isPressing = false;
            let pressStartTime = 0;
            
            // Untuk mouse (desktop)
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
    
            // Untuk touch (mobile)
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
    
            // Klik normal (tetap buka link)
            item.addEventListener('click', (e) => {
                // Jika sedang dalam mode press, jangan buka link
                if (isLinkTimerActive && currentLinkItem === item) {
                    e.preventDefault();
                    return;
                }
                // Biarkan link berfungsi normal
            });
        });
    }
    
    function startLinkPress(item) {
        if (isLinkTimerActive) return;
        
        // Cek apakah sudah pernah di-select sebelumnya
        const selector = item.querySelector('.item-selector');
        if (selector && selector.classList.contains('selected')) {
            return; // Sudah pernah di-select
        }
        
        isLinkTimerActive = true;
        currentLinkItem = item;
        linkTimerStart = Date.now();
        linkTimerRemaining = 5;
        
        // Tampilkan timer indicator
        showLinkTimer(item, 5);
        
        // Mulai interval untuk update timer
        linkTimerInterval = setInterval(() => {
            const elapsed = (Date.now() - linkTimerStart) / 1000;
            linkTimerRemaining = Math.max(0, 5 - elapsed);
            
            updateLinkTimer(item, linkTimerRemaining);
            
            if (linkTimerRemaining <= 0) {
                // Timer selesai, beri centang
                completeLinkPress(item);
            }
        }, 100);
        
        // Timeout untuk keamanan (5 detik)
        linkTimer = setTimeout(() => {
            completeLinkPress(item);
        }, 5000);
    }
    
    function cancelLinkPress(item) {
        if (!isLinkTimerActive || currentLinkItem !== item) return;
        
        // Hapus timer
        clearTimeout(linkTimer);
        clearInterval(linkTimerInterval);
        
        // Hapus indicator timer
        hideLinkTimer(item);
        
        isLinkTimerActive = false;
        currentLinkItem = null;
    }
    
    function completeLinkPress(item) {
        if (!isLinkTimerActive || currentLinkItem !== item) return;
        
        // Hapus timer
        clearTimeout(linkTimer);
        clearInterval(linkTimerInterval);
        
        // Beri centang
        const selector = item.querySelector('.item-selector');
        if (selector) {
            selector.classList.add('selected');
            
            // Simpan ke sessionStorage bahwa link ini sudah di-click
            const linkId = item.dataset.url || '';
            sessionStorage.setItem(`link_clicked_${linkId}`, 'true');
        }
        
        // Hapus indicator timer
        hideLinkTimer(item);
        
        // Tampilkan toast sukses
        showToast('✅ Link berhasil diverifikasi!', 'success', 2000);
        
        isLinkTimerActive = false;
        currentLinkItem = null;
    }
    
    function showLinkTimer(item, seconds) {
        // Hapus timer lama jika ada
        const oldTimer = item.querySelector('.link-timer');
        if (oldTimer) oldTimer.remove();
        
        // Buat element timer
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
    
    // ==================== UPDATE FUNGSI CHECKALLREQUIREMENTS (TAMBAH CEK LINK) ====================
    async function checkAllRequirements(giveaway, user) {
        const requirements = giveaway.requirements || [];
        const channels = giveaway.channels || [];
        const links = giveaway.links || [];
        
        const failedRequirements = [];
        const channelStatuses = {};
        const linkStatuses = {};
        
        // Cek subscribe channel
        if (requirements.includes('subscribe') && channels.length > 0) {
            // Tampilkan loading modal SATU KALI untuk semua channel
            const modal = showGlobalSubscriptionModal(channels.length);
            
            // Proses pengecekan channel satu per satu
            for (let i = 0; i < channels.length; i++) {
                const channel = channels[i];
                const channelUsername = typeof channel === 'string' ? channel : channel.username;
                
                // Update status di modal
                updateGlobalModalStatus(modal, i + 1, channels.length, channelUsername);
                
                try {
                    // Panggil API untuk check subscription
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
            
            // Tutup modal setelah semua pengecekan selesai
            completeGlobalModal(modal);
        }
        
        // Cek link clicks (dari sessionStorage)
        if (requirements.includes('share') && links.length > 0) {
            links.forEach(link => {
                const linkId = link.url || link;
                const hasClicked = sessionStorage.getItem(`link_clicked_${linkId}`) === 'true';
                linkStatuses[linkId] = hasClicked;
                if (!hasClicked) {
                    failedRequirements.push('share');
                }
            });
        }
        
        // Update tampilan selector
        updateChannelSelectors(channelStatuses);
        updateLinkSelectors(linkStatuses);
        
        // Jika ada channel yang tidak disubscribe, buka panel channel
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
        // Update selector di panel channel
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
    
    // ==================== FUNGSI HANDLE PARTICIPATE (MODIFIED) ====================
    async function handleParticipate(giveaway) {
        try {
            vibrate(15);
            
            if (!currentUser) {
                showToast('Silakan login terlebih dahulu', 'warning', 2000);
                return;
            }
            
            console.log('🎯 Processing participation for giveaway:', giveaway.giveaway_id);
            console.log('👤 Current user:', currentUser);
            
            // Cek syarat (dengan modal global)
            const requirementCheck = await checkAllRequirements(giveaway, currentUser);
            
            if (!requirementCheck.passed) {
                // Tampilkan toast notifikasi
                showToast('❌ Anda belum subscribe ke semua channel yang diperlukan', 'error', 3000);
                
                // Refresh halaman setelah 1 detik
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
                
                return;
            }
            
            showToast('Menyimpan partisipasi...', 'info', 1000);
            
            const result = await saveParticipation(giveaway.giveaway_id, currentUser);
            
            if (result.success) {
                showToast('✅ Berhasil berpartisipasi!', 'success', 2000);
                
                // Update UI partisipasi
                if (elements.participations) {
                    const currentCount = parseInt(elements.participations.textContent) || 0;
                    elements.participations.textContent = currentCount + 1;
                }
                
                // Reset flag share
                sessionStorage.removeItem(`shared_${giveaway.giveaway_id}`);
                
                // Refresh halaman setelah 1 detik
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
                
            } else {
                showToast(result.message || 'Gagal berpartisipasi', 'error', 2000);
                
                // Refresh halaman setelah 1.5 detik
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            }
            
        } catch (error) {
            console.error('Error in handleParticipate:', error);
            showToast(error.message || 'Terjadi kesalahan', 'error', 2000);
            
            // Refresh halaman setelah 1.5 detik
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
  
    globalModal = document.createElement('div');
    globalModal.className = 'global-subscription-modal';
    globalModal.innerHTML = `
          <div class="sync-loading-content">
              <div class="sync-loading-header">
                  <div class="sync-loading-title">🔍 Memeriksa Keanggotaan</div>
                  <div class="sync-loading-spinner"></div>
              </div>
              <div class="sync-loading-body">
                  <div class="progress-info">
                      <span class="progress-current" id="globalProgressCurrent">0</span>
                      <span class="progress-separator">/</span>
                      <span class="progress-total" id="globalProgressTotal">${totalChannels}</span>
                  </div>
                  <div class="sync-progress-bar">
                      <div class="sync-progress-fill" id="globalProgressFill" style="width: 0%"></div>
                  </div>
                  <div class="current-channel" id="globalCurrentChannel">
                      Memulai pengecekan...
                  </div>
                  <div class="sync-status" id="globalStatus">Memeriksa channel 1 dari ${totalChannels}</div>
              </div>
          </div>
      `;
  
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
  
              // Update status di modal
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
    // Update selector di panel channel
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
  
      // ==================== AMBIL DATA USER (UNTUK SEMUA MODE) ====================
      let user = null;
  
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
  
      // Simpan user ke currentUser GLOBAL
      currentUser = user;
      console.log('👤 Current user set:', currentUser);
  
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
  
        // Debug: tampilkan status masing-masing giveaway
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
