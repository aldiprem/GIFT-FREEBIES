// Main JavaScript for Gift Freebies Telegram App
(function() {
    console.log('🎁 GIFT FREEBIES - Script started...');

    // ==================== KONFIGURASI ====================
    const API_BASE_URL = 'https://individually-threaded-jokes-letting.trycloudflare.com';
    
    // ==================== DOM ELEMENTS ====================
    const elements = {
        // Loading & Error
        loading: document.getElementById('loading'),
        userData: document.getElementById('userData'),
        error: document.getElementById('error'),
        errorMessage: document.getElementById('errorMessage'),
        
        // Avatar
        avatarContainer: document.getElementById('avatarContainer'),
        avatarInitial: document.getElementById('avatarInitial'),
        profilePhoto: document.getElementById('profilePhoto'),
        
        // Text elements
        fullName: document.getElementById('fullName'),
        username: document.getElementById('username'),
        userId: document.getElementById('userId'),
        languageCode: document.getElementById('languageCode'),
        userStats: document.getElementById('userStats'),
        premiumBadge: document.getElementById('premiumBadge'),
        
        // Profile summary
        profileNameDisplay: document.getElementById('profileNameDisplay'),
        profileUsernameDisplay: document.getElementById('profileUsernameDisplay'),
        profileIdDisplay: document.getElementById('profileIdDisplay'),
        
        // Buttons
        settingsBtn: document.getElementById('settingsBtn'),
        profileSettingsBtn: document.getElementById('profileSettingsBtn'),
        activeBtn: document.getElementById('activeBtn'),
        endedBtn: document.getElementById('endedBtn'),
        giveawayContent: document.getElementById('giveawayContent')
    };

    // ==================== DATA GIVEAWAY (SEMENTARA) ====================
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
        if (elements.userData) elements.userData.style.display = 'none';
        if (elements.error) {
            elements.error.style.display = 'block';
            if (elements.errorMessage) elements.errorMessage.textContent = message;
        }
    }

    function hideLoading() {
        if (elements.loading) elements.loading.style.display = 'none';
        if (elements.userData) elements.userData.style.display = 'block';
        if (elements.error) elements.error.style.display = 'none';
    }

    function generateAvatarUrl(name) {
        if (!name) return `https://ui-avatars.com/api/?name=U&size=120&background=1e88e5&color=fff`;
        const firstChar = name.charAt(0).toUpperCase();
        return `https://ui-avatars.com/api/?name=${firstChar}&size=120&background=1e88e5&color=fff`;
    }

    function formatNumber(num) {
        return num?.toLocaleString() || '0';
    }

    // ==================== API CALLS ====================
    async function fetchUserFromApi(userId) {
        try {
            console.log(`📡 Fetching user data for ID: ${userId} from API...`);
            
            const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                mode: 'cors'
            });

            if (!response.ok) {
                if (response.status === 404) {
                    // User not found in database, but we have Telegram data
                    console.log('👤 User not found in API, will use Telegram data');
                    return null;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('✅ API Response:', data);
            
            if (data.success && data.user) {
                return data.user;
            } else if (data.user) {
                // Direct user object
                return data.user;
            }
            
            return null;
            
        } catch (error) {
            console.error('❌ API Fetch Error:', error);
            return null; // Return null to fallback to Telegram data
        }
    }

    // ==================== UPDATE UI WITH USER DATA ====================
    function updateUIWithUserData(user, fromTelegram = false) {
        console.log('📝 Updating UI with user data:', user);
        
        // Data dari Telegram atau API
        const fullName = user.fullname || [user.first_name, user.last_name].filter(Boolean).join(' ') || 'No Name';
        const username = user.username ? (user.username.startsWith('@') ? user.username : `@${user.username}`) : '(no username)';
        const userId = user.user_id || user.id || '-';
        const isPremium = user.is_premium || false;
        const language = user.language_code || 'id';
        
        // Update text elements
        if (elements.fullName) elements.fullName.textContent = fullName;
        if (elements.username) elements.username.textContent = username;
        if (elements.userId) elements.userId.textContent = userId;
        if (elements.languageCode) elements.languageCode.textContent = language.toUpperCase();
        
        // Update profile summary
        if (elements.profileNameDisplay) elements.profileNameDisplay.textContent = fullName;
        if (elements.profileUsernameDisplay) elements.profileUsernameDisplay.textContent = username;
        if (elements.profileIdDisplay) elements.profileIdDisplay.textContent = `ID: ${userId}`;
        
        // Update stats (from API or Telegram)
        const participations = user.total_participations || 0;
        const wins = user.total_wins || 0;
        if (elements.userStats) {
            elements.userStats.textContent = `Partisipasi: ${formatNumber(participations)} | Menang: ${formatNumber(wins)}`;
        }
        
        // Update premium badge
        if (elements.premiumBadge) {
            if (isPremium) {
                elements.premiumBadge.textContent = '⭐ Premium User';
                elements.premiumBadge.className = 'badge premium';
            } else {
                elements.premiumBadge.textContent = 'Free User';
                elements.premiumBadge.className = 'badge free';
            }
        }
        
        // Handle avatar
        updateAvatar(user, fullName);
        
        hideLoading();
    }

    function updateAvatar(user, fullName) {
        // Priority: 1. photo_url from Telegram, 2. avatar from API, 3. generated avatar
        if (user.photo_url) {
            // Use Telegram photo
            if (elements.avatarContainer) {
                elements.avatarContainer.innerHTML = `<img src="${user.photo_url}" alt="Avatar">`;
            }
            if (elements.profilePhoto) {
                elements.profilePhoto.src = user.photo_url;
            }
        } else {
            // Use generated avatar
            const avatarUrl = generateAvatarUrl(fullName);
            if (elements.avatarContainer) {
                elements.avatarContainer.innerHTML = `<img src="${avatarUrl}" alt="Avatar" onerror="this.parentElement.innerHTML='<span>' + this.alt.charAt(0).toUpperCase() + '</span>'">`;
            }
            if (elements.profilePhoto) {
                elements.profilePhoto.src = avatarUrl;
            }
            if (elements.avatarInitial) {
                elements.avatarInitial.textContent = fullName.charAt(0).toUpperCase();
            }
        }
    }

    // ==================== MAIN FUNCTION ====================
    async function init() {
        console.log('🚀 Initializing app...');
        
        // Check Telegram WebApp
        if (window.Telegram && window.Telegram.WebApp) {
            console.log('✅ Telegram WebApp detected');
            
            const tg = window.Telegram.WebApp;
            tg.expand();
            tg.ready();
            
            console.log('📱 Telegram version:', tg.version);
            console.log('📦 initDataUnsafe:', tg.initDataUnsafe);
            
            if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
                const telegramUser = tg.initDataUnsafe.user;
                const userId = telegramUser.id;
                
                console.log('👤 Telegram User ID:', userId);
                console.log('👤 Telegram User Data:', telegramUser);
                
                // Try to get additional data from API
                const apiUser = await fetchUserFromApi(userId);
                
                if (apiUser) {
                    // Merge API data with Telegram data (API takes precedence)
                    const mergedUser = {
                        ...telegramUser,
                        ...apiUser,
                        user_id: apiUser.user_id || telegramUser.id,
                        fullname: apiUser.fullname || [telegramUser.first_name, telegramUser.last_name].filter(Boolean).join(' ')
                    };
                    updateUIWithUserData(mergedUser);
                    
                    // Update user in API (to ensure data is synced)
                    syncUserWithApi(telegramUser);
                    
                } else {
                    // Use Telegram data only
                    updateUIWithUserData(telegramUser, true);
                    
                    // Create user in API (first time)
                    createUserInApi(telegramUser);
                }
                
            } else {
                console.log('❌ No user data from Telegram');
                showError('Tidak ada data user dari Telegram');
            }
        } else {
            console.log('⚠️ Not in Telegram - using mock data');
            showMockData();
        }
    }

    // ==================== API SYNC FUNCTIONS ====================
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
            
            console.log('📤 Creating user in API:', userData);
            
            const response = await fetch(`${API_BASE_URL}/api/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                mode: 'cors',
                body: JSON.stringify(userData)
            });
            
            if (response.ok) {
                console.log('✅ User created/updated in API');
            } else {
                console.warn('⚠️ Failed to sync user with API');
            }
        } catch (error) {
            console.warn('⚠️ Error syncing user:', error);
        }
    }

    async function syncUserWithApi(telegramUser) {
        // Update last_seen etc.
        try {
            await fetch(`${API_BASE_URL}/api/users/${telegramUser.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                mode: 'cors',
                body: JSON.stringify({ last_seen: new Date().toISOString() })
            });
        } catch (error) {
            // Silent fail - not critical
        }
    }

    // ==================== MOCK DATA (FOR TESTING) ====================
    function showMockData() {
        setTimeout(() => {
            const mockUser = {
                id: 123456789,
                first_name: 'Test',
                last_name: 'User',
                username: 'testuser',
                language_code: 'id',
                is_premium: false
            };
            updateUIWithUserData(mockUser, true);
            console.log('⚠️ Using mock data (not in Telegram)');
        }, 1000);
    }

    // ==================== GIVEAWAY FUNCTIONS ====================
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

        if (elements.giveawayContent) {
            elements.giveawayContent.innerHTML = html;
        }
    }

    // ==================== EVENT LISTENERS ====================
    function setupEventListeners() {
        // Settings buttons
        if (elements.settingsBtn) {
            elements.settingsBtn.addEventListener('click', () => alert('Settings menu (demo)'));
        }
        if (elements.profileSettingsBtn) {
            elements.profileSettingsBtn.addEventListener('click', () => alert('Settings menu (demo)'));
        }

        // Giveaway buttons
        if (elements.activeBtn) {
            elements.activeBtn.addEventListener('click', () => {
                elements.activeBtn.classList.add('active');
                elements.endedBtn.classList.remove('active');
                displayGiveaways('active');
            });
        }

        if (elements.endedBtn) {
            elements.endedBtn.addEventListener('click', () => {
                elements.endedBtn.classList.add('active');
                elements.activeBtn.classList.remove('active');
                displayGiveaways('ended');
            });
        }
    }

    // ==================== START THE APP ====================
    setupEventListeners();
    displayGiveaways('active');
    init();
})();
