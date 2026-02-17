// Main JavaScript for Gift Freebies Telegram App
(function() {
  console.log('🎁 GIFT FREEBIES - Script started...');

  // ==================== FUNGSI GETARAN ====================
  function vibrate(duration = 20) {
    // Cek apakah vibration API didukung
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(duration);
    } else {
      console.log('Vibration API tidak didukung di browser ini');
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
    createGiveawayBtn: document.getElementById('createGiveawayBtn')
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
    vibrate(30); // Getar lebih panjang untuk error
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

    const oldIndicator = elements.profilePhotoWrapper.querySelector('.premium-indicator, .free-indicator');
    if (oldIndicator) oldIndicator.remove();

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

  // Fetch user's giveaway count
  async function fetchUserGiveawayCount(userId) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/giveaways/user/${userId}?limit=1`, {
        headers: { 'Accept': 'application/json' },
        mode: 'cors'
      });
      if (!res.ok) return 0;
      const data = await res.json();
      return data.count || 0;
    } catch {
      return 0;
    }
  }

  // ==================== UPDATE UI ====================
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

  // ==================== INIT ====================
  async function init() {
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

    const apiUser = await fetchUserFromApi(user.id);

    if (apiUser) {
      await updateUI({ ...user, ...apiUser });
    } else {
      await updateUI(user);
    }
  }

  // ==================== MOCK DATA ====================
  function showMockData() {
    setTimeout(async () => {
      await updateUI({
        id: 7998861975,
        first_name: 'Al',
        last_name: 'wayss',
        username: 'fTamous',
        language_code: 'id',
        is_premium: false,
        total_participations: 5,
        total_wins: 1
      });
    }, 800);
  }

  // ==================== GIVEAWAY ====================
  function displayGiveaways(type) {
    vibrate(15); // Getar saat ganti tab giveaway
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
      elements.endedBtn.classList.remove('active');
      displayGiveaways('active');
    });
  }

  if (elements.endedBtn) {
    elements.endedBtn.addEventListener('click', () => {
      vibrate(10);
      elements.endedBtn.classList.add('active');
      elements.activeBtn.classList.remove('active');
      displayGiveaways('ended');
    });
  }

  // ==================== START ====================
  displayGiveaways('active');
  init();
})();
