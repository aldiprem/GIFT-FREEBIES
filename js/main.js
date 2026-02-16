// Main JavaScript for Gift Freebies Telegram App
(function() {
  console.log('🎁 GIFT FREEBIES - Script started...');

  // ==================== KONFIGURASI ====================
  const API_BASE_URL = 'https://individually-threaded-jokes-letting.trycloudflare.com';

    const createGiveawayBtn = document.getElementById('createGiveawayBtn');
    if (createGiveawayBtn) {
      createGiveawayBtn.addEventListener('click', () => {
        window.location.href = 'create.html';
      });
    }

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

    userId: document.getElementById('userId'),
    languageCode: document.getElementById('languageCode'),
    participations: document.getElementById('participations'),
    wins: document.getElementById('wins'),
    premiumBadge: document.getElementById('premiumBadge'),

    settingsBtn: document.getElementById('settingsBtn'),
    activeBtn: document.getElementById('activeBtn'),
    endedBtn: document.getElementById('endedBtn'),
    giveawayContent: document.getElementById('giveawayContent')
  };

  // ==================== DATA GIVEAWAY ====================
  const giveaways = {
    active: [
      { title: '🎮 Gaming Bundle Giveaway', participants: 234, ends: '2 days' },
      { title: '💰 Crypto Airdrop', participants: 567, ends: '5 hours' },
      { title: '🎁 Premium NFT Pack', participants: 89, ends: '1 day' }
        ],
    ended: [
      { title: '📱 Smartphone Giveaway', winners: 'Alex, Maria, John' },
      { title: '🎧 Wireless Earbuds', winners: 'Sarah, Mike' },
      { title: '💎 Discord Nitro', winners: 'David' }
        ]
  };

  // ==================== FUNGSI UTILITY ====================
  function showError(msg) {
    if (elements.loading) elements.loading.style.display = 'none';
    if (elements.error) {
      elements.error.style.display = 'flex';
      elements.error.querySelector('div').textContent = `❌ ${msg}`;
    }
  }

  function showProfile() {
    if (elements.loading) elements.loading.style.display = 'none';
    if (elements.error) elements.error.style.display = 'none';
    if (elements.profileContent) elements.profileContent.style.display = 'block';
  }

  function generateAvatarUrl(name) {
    if (!name) return 'https://ui-avatars.com/api/?name=U&size=120&background=1e88e5&color=fff';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name.charAt(0).toUpperCase())}&size=120&background=1e88e5&color=fff`;
  }

  // Fungsi untuk menambahkan indicator premium/free di foto
  function addPremiumIndicator(isPremium) {
    if (!elements.profilePhotoWrapper) return;

    // Hapus indicator lama jika ada
    const oldIndicator = elements.profilePhotoWrapper.querySelector('.premium-indicator, .free-indicator');
    if (oldIndicator) oldIndicator.remove();

    // Buat indicator baru
    const indicator = document.createElement('div');
    indicator.className = isPremium ? 'premium-indicator' : 'free-indicator';
    elements.profilePhotoWrapper.appendChild(indicator);
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
    } catch {
      return null;
    }
  }

  // ==================== UPDATE UI ====================
  function updateUI(user) {
    const fullName = user.fullname || [user.first_name, user.last_name].filter(Boolean).join(' ') || 'No Name';
    const username = user.username ? (user.username.startsWith('@') ? user.username : `@${user.username}`) : '(no username)';
    const isPremium = user.is_premium || false;
    const userId = user.user_id || user.id || '-';

    // Update profile dengan efek marquee
    if (elements.profileNameDisplay) elements.profileNameDisplay.textContent = fullName;
    if (elements.profileUsernameDisplay) elements.profileUsernameDisplay.textContent = username;
    if (elements.profileIdDisplay) elements.profileIdDisplay.textContent = `ID: ${userId}`;

    // Update stats
    if (elements.userId) elements.userId.textContent = userId;
    if (elements.languageCode) elements.languageCode.textContent = (user.language_code || 'id').toUpperCase();
    if (elements.participations) elements.participations.textContent = user.total_participations || 0;
    if (elements.wins) elements.wins.textContent = user.total_wins || 0;

    // Update badge
    if (elements.premiumBadge) {
      if (isPremium) {
        elements.premiumBadge.textContent = '⭐ Premium User';
        elements.premiumBadge.className = 'badge premium';
      } else {
        elements.premiumBadge.textContent = 'Free User';
        elements.premiumBadge.className = 'badge free';
      }
    }

    // Update avatar
    if (elements.profilePhoto) {
      elements.profilePhoto.src = user.photo_url || generateAvatarUrl(fullName);
    }

    // Add premium/free indicator
    addPremiumIndicator(isPremium);

    showProfile();
  }

  // ==================== INIT ====================
  async function init() {
    // Cek Telegram
    if (!window.Telegram?.WebApp) {
      return showMockData();
    }

    const tg = window.Telegram.WebApp;
    tg.expand();
    tg.ready();

    const user = tg.initDataUnsafe?.user;
    if (!user) {
      return showError('Tidak ada data user');
    }

    // Coba ambil dari API
    const apiUser = await fetchUserFromApi(user.id);

    if (apiUser) {
      updateUI({ ...user, ...apiUser });
    } else {
      updateUI(user);
    }
  }

  // ==================== MOCK DATA ====================
  function showMockData() {
    setTimeout(() => {
      updateUI({
        id: 7998861975,
        first_name: 'Al',
        last_name: 'wayss',
        username: 'fTamous',
        language_code: 'id',
        is_premium: false
      });
    }, 800);
  }

  // ==================== GIVEAWAY ====================
  function displayGiveaways(type) {
    const data = giveaways[type];
    let html = '';
    data.forEach(item => {
      if (type === 'active') {
        html += `<div class="giveaway-item"><h3>${item.title}</h3><p>👥 ${item.participants} participants • ⏱️ Ends in ${item.ends}</p></div>`;
      } else {
        html += `<div class="giveaway-item"><h3>${item.title}</h3><p>🏆 Winners: ${item.winners}</p></div>`;
      }
    });
    elements.giveawayContent.innerHTML = html;
  }

  // ==================== EVENT LISTENERS ====================
  elements.settingsBtn?.addEventListener('click', () => alert('Settings Menu'));

  elements.activeBtn?.addEventListener('click', () => {
    elements.activeBtn.classList.add('active');
    elements.endedBtn.classList.remove('active');
    displayGiveaways('active');
  });

  elements.endedBtn?.addEventListener('click', () => {
    elements.endedBtn.classList.add('active');
    elements.activeBtn.classList.remove('active');
    displayGiveaways('ended');
  });

  // ==================== START ====================
  displayGiveaways('active');
  init();
})();
