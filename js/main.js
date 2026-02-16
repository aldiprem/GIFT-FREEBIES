// ==================== KONFIGURASI API ====================
const API_URL = 'https://processed-clicking-pressed-alike.trycloudflare.com';

// ==================== FUNGSI UTILITY ====================
function formatNumber(num) {
    return new Intl.NumberFormat('id-ID').format(num);
}

function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showLoading(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
            </div>
        `;
    }
}

function showError(containerId, message) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="alert alert-error">❌ ${message}</div>
        `;
    }
}

function showSuccess(containerId, message) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="alert alert-success">✅ ${message}</div>
        `;
    }
}

// Get URL Parameters
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// ==================== USER SESSION MANAGEMENT ====================
let currentUser = null;

async function loadUserSession() {
    console.log('🔄 Loading user session...');
    
    // Cek apakah ada user Telegram yang sudah di-set
    if (window.telegramUser) {
        console.log('✅ Telegram user detected:', window.telegramUser);
        // User dari Telegram akan disimpan oleh telegram.js
        const savedUser = localStorage.getItem('giftfreebies_user');
        if (savedUser) {
            currentUser = JSON.parse(savedUser);
            console.log('✅ Loaded Telegram user from storage:', currentUser);
            updateUserUI();
            return;
        }
    }
    
    // Coba load dari localStorage
    const savedUser = localStorage.getItem('giftfreebies_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        console.log('✅ Loaded saved user:', currentUser);
        updateUserUI();
    } else {
        // Untuk demo, cek apakah ada parameter user_id di URL
        const userId = getUrlParameter('user_id');
        if (userId) {
            try {
                console.log('🔍 Fetching user by ID:', userId);
                const response = await fetch(`${API_URL}/api/user/${userId}`);
                if (response.ok) {
                    currentUser = await response.json();
                    localStorage.setItem('giftfreebies_user', JSON.stringify(currentUser));
                    updateUserUI();
                }
            } catch (error) {
                console.error('Error loading user:', error);
            }
        } else {
            // Buat user dummy untuk demo
            console.log('ℹ️ No user found, using dummy');
            currentUser = {
                user_id: 123456789,
                fullname: 'John Doe',
                username: 'johndoe',
                avatar: 'https://via.placeholder.com/40'
            };
            localStorage.setItem('giftfreebies_user', JSON.stringify(currentUser));
            updateUserUI();
        }
    }
}

// Listen for Telegram user ready event
window.addEventListener('telegramUserReady', (event) => {
    console.log('📡 Telegram user ready event received:', event.detail);
    currentUser = event.detail;
    updateUserUI();
    
    // Reload profile if on profile page
    if (window.location.pathname.includes('profile.html')) {
        console.log('🔄 Reloading profile page...');
        setTimeout(() => {
            if (typeof loadUserProfile === 'function') {
                loadUserProfile();
            }
        }, 100);
    }
});

function updateUserUI() {
    if (!currentUser) return;
    
    console.log('🖼️ Updating UI for user:', currentUser);
    
    const userNameEl = document.getElementById('userName');
    const userAvatarEl = document.getElementById('userAvatar');
    const profileFullname = document.getElementById('profileFullname');
    const profileUsername = document.getElementById('profileUsername');
    const profileAvatar = document.getElementById('profileAvatar');

    if (userNameEl) {
        userNameEl.textContent = currentUser.fullname || currentUser.username || 'User';
    }
    
    if (userAvatarEl) {
        userAvatarEl.src = currentUser.avatar || 'https://via.placeholder.com/40';
        userAvatarEl.alt = currentUser.fullname || 'User';
    }
    
    if (profileFullname) {
        profileFullname.textContent = currentUser.fullname || 'No Name';
    }
    
    if (profileUsername) {
        profileUsername.textContent = currentUser.username ? `@${currentUser.username}` : '-';
    }
    
    if (profileAvatar && currentUser.avatar) {
        profileAvatar.src = currentUser.avatar;
    }
}

// ==================== API CALLS ====================
async function apiCall(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        }
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        console.log(`🔍 API Call: ${method} ${endpoint}`, data || '');
        const response = await fetch(`${API_URL}${endpoint}`, options);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'API call failed');
        }

        console.log(`✅ API Success: ${method} ${endpoint}`, result);
        return result;
    } catch (error) {
        console.error('❌ API Error:', error);
        throw error;
    }
}

// ==================== CONNECTION MONITORING ====================
function updateConnectionStatus(status, message = '') {
    const statusEl = document.getElementById('connectionStatus');
    if (!statusEl) return;

    statusEl.className = 'connection-status ' + status;

    switch (status) {
        case 'online':
            statusEl.innerHTML = '🟢 Online';
            break;
        case 'offline':
            statusEl.innerHTML = '🔴 Offline';
            break;
        case 'checking':
            statusEl.innerHTML = '🟡 Checking...';
            break;
    }

    if (message) {
        statusEl.title = message;
    }
}

async function testApiConnection() {
    updateConnectionStatus('checking');

    try {
        const response = await fetch(`${API_URL}/api/health`, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Connected to API:', data);
            updateConnectionStatus('online', `Server: ${data.timestamp}`);
            return true;
        } else {
            throw new Error('Response not OK');
        }
    } catch (error) {
        console.error('❌ Cannot connect to API:', error);
        updateConnectionStatus('offline', error.message);
        return false;
    }
}

// Panggil setiap 30 detik untuk monitoring
setInterval(testApiConnection, 30000);

// ==================== SEARCH FUNCTIONALITY ====================
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

async function handleSearch(e) {
    const query = e.target.value;
    if (query.length > 2) {
        try {
            const results = await apiCall(`/api/giveaways/search?q=${query}`);
            displaySearchResults(results);
        } catch (error) {
            console.error('Search error:', error);
        }
    } else if (query.length === 0) {
        // Reload all giveaways
        loadAllGiveaways();
    }
}

function displaySearchResults(results) {
    const container = document.getElementById('giveawayList');
    if (!container) return;

    if (results.length === 0) {
        container.innerHTML = '<div class="alert alert-warning">Tidak ada giveaway ditemukan</div>';
        return;
    }

    container.innerHTML = results.map(giveaway => createGiveawayCard(giveaway)).join('');
}

async function loadAllGiveaways() {
    const container = document.getElementById('giveawayList');
    if (!container) return;
    
    showLoading('giveawayList');
    
    try {
        const giveaways = await apiCall('/api/giveaways');
        if (giveaways.length === 0) {
            container.innerHTML = '<div class="alert alert-info">Belum ada giveaway aktif</div>';
        } else {
            container.innerHTML = giveaways.map(giveaway => createGiveawayCard(giveaway)).join('');
        }
    } catch (error) {
        console.error('Error loading giveaways:', error);
        showError('giveawayList', 'Gagal memuat giveaway');
    }
}

function createGiveawayCard(giveaway) {
    const status = giveaway.status === 'active' ? 'Aktif' : 'Berakhir';
    const statusClass = giveaway.status === 'active' ? 'success' : 'warning';
    const textPreview = giveaway.giveaway_text ? giveaway.giveaway_text.substring(0, 100) + '...' : 'No description';

    return `
        <div class="giveaway-item" onclick="window.location.href='giveaway.html?giveaway_id=${giveaway.giveaway_id}'">
            <div>
                <h3>🎁 ${giveaway.prize}</h3>
                <p>${textPreview}</p>
                <small>👥 ${giveaway.participants_count || 0} peserta</small>
            </div>
            <div>
                <span class="giveaway-status status-${statusClass}">${status}</span>
                <br>
                <small>Berakhir: ${formatDate(giveaway.end_time)}</small>
            </div>
        </div>
    `;
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Main.js initialized');
    
    // Load user session
    await loadUserSession();
    
    // Test API connection
    testApiConnection();

    // Handle search if on index page
    const searchInput = document.getElementById('searchGiveaway');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 500));
        
        // Load all giveaways initially
        if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
            loadAllGiveaways();
        }
    }

    // Check for giveaway_id in URL
    const giveawayId = getUrlParameter('search') || getUrlParameter('giveaway_id');
    if (giveawayId && window.location.pathname.includes('giveaway.html')) {
        // Will be handled by giveaway-detail.js
        console.log('🔍 Giveaway ID detected in URL:', giveawayId);
    } else if (giveawayId && !window.location.pathname.includes('giveaway.html')) {
        window.location.href = `giveaway.html?giveaway_id=${giveawayId}`;
    }
});
