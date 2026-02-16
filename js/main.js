// Main JavaScript for Gift Freebies Telegram App
(function() {
    console.log('🎁 GIFT FREEBIES - Script started...');

    // ==================== KONFIGURASI ====================
    const API_BASE_URL = 'https://individually-threaded-jokes-letting.trycloudflare.com';
    
    // ==================== DOM ELEMENTS ====================
    const elements = {
        // Loading & Error
        loading: document.getElementById('loading'),
        profileContent: document.getElementById('profileContent'),
        error: document.getElementById('error'),
        
        // Profile elements
        profilePhoto: document.getElementById('profilePhoto'),
        profileNameDisplay: document.getElementById('profileNameDisplay'),
        profileUsernameDisplay: document.getElementById('profileUsernameDisplay'),
        
        // Detail info
        userId: document.getElementById('userId'),
        languageCode: document.getElementById('languageCode'),
        participations: document.getElementById('participations'),
        wins: document.getElementById('wins'),
        premiumBadge: document.getElementById('premiumBadge'),
        
        // Buttons
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
    function showError(message) {
        console.error('❌ Error:', message);
        if (elements.loading) elements.loading.style.display = 'none';
        if (elements.profileContent) elements.profileContent.style.display = 'none';
        if (elements.error) {
            elements.error.style.display = 'flex';
            document.getElementById('errorMessage').textContent = message;
        }
    }

    function showProfile() {
        if (elements.loading) elements.loading.style.display = 'none';
        if (elements.error) elements.error.style.display = 'none';
        if (elements.profileContent) elements.profileContent.style.display = 'block';
    }

    function generateAvatarUrl(name) {
        if (!name) return `https://ui-avatars.com/api/?name=U&size=120&background=1e88e5&color=fff`;
        const firstChar = name.charAt(0).toUpperCase();
        return `https://ui-avatars.com/api/?name=${firstChar}&size=120&background=1e88e5&color=fff`;
    }

    // ==================== API CALLS ====================
    async function fetchUserFromApi(userId) {
        try {
            console.log(`📡 Fetching user data for ID: ${userId}...`);
            
            const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                mode: 'cors'
            });

            if (!response.ok) {
                if (response.status === 404) return null;
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            return data.success ? data.user : (data.user || null);
            
        } catch (error) {
            console.warn('⚠️ API fetch failed:', error);
            return null;
        }
    }

    async function createUserInApi(telegramUser) {
        try {
            const userData = {
                user_id: telegramUser.id,
                fullname: [telegramUser.first_name, telegramUser.last_name].filter(Boolean).join(' ') || 'No Name',
                username: telegramUser.username || null,
                language_code: telegramUser.language_code || 'id',
                is_premium: telegramUser.is_premium ? 1 : 0,
                is_bot: telegramUser.is_bot ? 1 : 0
            };
            
            await fetch(`${API_BASE_URL}/api/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                mode: 'cors',
                body: JSON.stringify(userData)
            });
            console.log('✅ User synced with API');
        } catch (error) {
            console.warn('⚠️ Failed to sync user');
        }
    }

    // ==================== UPDATE UI ====================
    function updateUI(user) {
        // Data dari user
        const fullName = user.fullname || [user.first_name, user.last_name].filter(Boolean).join(' ') || 'No Name';
        const username = user.username ? (user.username.startsWith('@') ? user.username : `@${user.username}`) : '(no username)';
        const userId = user.user_id || user.id || '-';
        const isPremium = user.is_premium || false;
        const language = user.language_code || 'id';
        
        // Update profile summary
        if (elements.profileNameDisplay) elements.profileNameDisplay.textContent = fullName;
        if (elements.profileUsernameDisplay) elements.profileUsernameDisplay.textContent = username;
        
        // Update detail info
        if (elements.userId) elements.userId.textContent = userId;
        if (elements.languageCode) elements.languageCode.textContent = language.toUpperCase();
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
        if (user.photo_url) {
            elements.profilePhoto.src = user.photo_url;
        } else {
            elements.profilePhoto.src = generateAvatarUrl(fullName);
        }
        
        showProfile();
    }

    // ==================== INIT ====================
    async function init() {
        console.log('🚀 Initializing...');
        
        // Check Telegram
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
        
        console.log('👤 Telegram User:', user);
        
        // Try to get from API
        const apiUser = await fetchUserFromApi(user.id);
        
        if (apiUser) {
            // Merge data
            updateUI({ ...user, ...apiUser });
        } else {
            // Use Telegram data only
            updateUI(user);
            // Create in API (background)
            createUserInApi(user);
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
                is_premium: false,
                total_participations: 0,
                total_wins: 0
            });
        }, 800);
    }

    // ==================== GIVEAWAY ====================
    function displayGiveaways(type) {
        const data = giveaways[type];
        let html = '';

        data.forEach(item => {
            if (type === 'active') {
                html += `
                    <div class="giveaway-item">
                        <h3>${item.title}</h3>
                        <p>👥 ${item.participants} participants • ⏱️ Ends in ${item.ends}</p>
                    </div>
                `;
            } else {
                html += `
                    <div class="giveaway-item">
                        <h3>${item.title}</h3>
                        <p>🏆 Winners: ${item.winners}</p>
                    </div>
                `;
            }
        });

        elements.giveawayContent.innerHTML = html;
    }

    // ==================== EVENT LISTENERS ====================
    elements.settingsBtn?.addEventListener('click', () => alert('Settings'));
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
