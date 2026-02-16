// Main JavaScript for Gift Freebies Telegram App
(function() {
  console.log('GIFT FREEBIES - Script started...');

  // DOM Elements
  const loadingEl = document.getElementById('loading');
  const userDataEl = document.getElementById('userData');
  const errorEl = document.getElementById('error');
  const avatarInitialEl = document.getElementById('avatarInitial');
  const avatarContainer = document.getElementById('avatarContainer');
  const fullNameEl = document.getElementById('fullName');
  const usernameEl = document.getElementById('username');
  const userIdEl = document.getElementById('userId');
  const premiumBadgeEl = document.getElementById('premiumBadge');
  const settingsBtn = document.getElementById('settingsBtn');
  const activeBtn = document.getElementById('activeBtn');
  const endedBtn = document.getElementById('endedBtn');
  const giveawayContent = document.getElementById('giveawayContent');

  // Mock data for giveaways
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

  // Check Telegram WebApp
  if (window.Telegram && window.Telegram.WebApp) {
    console.log('✅ Telegram WebApp detected');

    const tg = window.Telegram.WebApp;
    tg.expand();
    tg.ready();

    console.log('Telegram WebApp version:', tg.version);
    console.log('initDataUnsafe:', tg.initDataUnsafe);

    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
      const user = tg.initDataUnsafe.user;
      console.log('✅ User detected:', user);

      // Hide loading, show user data
      loadingEl.style.display = 'none';
      userDataEl.style.display = 'block';

      // Set full name
      const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'No Name';
      fullNameEl.textContent = fullName;

      // Set username
      usernameEl.textContent = user.username ? `@${user.username}` : '(no username)';

      // Set user ID
      userIdEl.textContent = user.id;

      // Handle avatar
      if (user.photo_url) {
        const img = document.createElement('img');
        img.src = user.photo_url;
        img.alt = 'Avatar';
        avatarContainer.innerHTML = '';
        avatarContainer.appendChild(img);
      } else {
        const initial = (user.first_name || 'U').charAt(0).toUpperCase();
        avatarInitialEl.textContent = initial;
      }

      // Set premium badge
      if (user.is_premium) {
        premiumBadgeEl.textContent = '⭐ Premium User';
        premiumBadgeEl.className = 'badge premium';
      }

    } else {
      console.log('❌ No user data');
      loadingEl.style.display = 'none';
      errorEl.style.display = 'block';
    }
  } else {
    console.log('❌ Not in Telegram');
    loadingEl.style.display = 'none';
    errorEl.style.display = 'block';

    // For testing outside Telegram - show mock data
    showMockData();
  }

  // Settings button handler
  settingsBtn.addEventListener('click', () => {
    alert('Settings menu (demo)');
  });

  // Giveaway buttons handlers
  activeBtn.addEventListener('click', () => {
    activeBtn.classList.add('active');
    endedBtn.classList.remove('active');
    displayGiveaways('active');
  });

  endedBtn.addEventListener('click', () => {
    endedBtn.classList.add('active');
    activeBtn.classList.remove('active');
    displayGiveaways('ended');
  });

  // Display giveaways based on type
  function displayGiveaways(type) {
    const data = giveaways[type];
    let html = '';

    if (type === 'active') {
      data.forEach(item => {
        html += `
                    <div class="giveaway-item">
                        <h3>${item.title}</h3>
                        <p>👥 ${item.participants} participants • ⏱️ Ends in ${item.ends}</p>
                    </div>
                `;
      });
    } else {
      data.forEach(item => {
        html += `
                    <div class="giveaway-item">
                        <h3>${item.title}</h3>
                        <p>🏆 Winners: ${item.winners}</p>
                    </div>
                `;
      });
    }

    if (html === '') {
      html = '<div class="empty-message">No giveaways available</div>';
    }

    giveawayContent.innerHTML = html;
  }

  // Show mock data for testing outside Telegram
  function showMockData() {
    setTimeout(() => {
      loadingEl.style.display = 'none';
      userDataEl.style.display = 'block';
      errorEl.style.display = 'none';

      // Mock user data
      fullNameEl.textContent = 'Test User';
      usernameEl.textContent = '@testuser';
      userIdEl.textContent = '123456789';
      avatarInitialEl.textContent = 'T';

      console.log('⚠️ Using mock data (not in Telegram)');
    }, 1000);
  }

  // Initial display - show active giveaways by default
  displayGiveaways('active');

  // Handle theme from Telegram
  if (window.Telegram && window.Telegram.WebApp) {
    const tg = window.Telegram.WebApp;

    // Set color scheme based on Telegram theme
    if (tg.colorScheme === 'dark') {
      document.body.style.background = 'linear-gradient(135deg, #0f0f1a, #1a1a2f)';
    }

    // Handle back button if needed
    tg.onEvent('backButtonClicked', () => {
      console.log('Back button clicked');
    });
  }
})();
